export class QbitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "QbitError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.QBITTORRENT_URL;
  if (!b) throw new QbitError("Set QBITTORRENT_URL (your qBittorrent WebUI URL).");
  return b.replace(/\/$/, "");
}

async function login(): Promise<string> {
  const u = process.env.QBITTORRENT_USER ?? "admin";
  const p = process.env.QBITTORRENT_PASS;
  if (!p) throw new QbitError("Set QBITTORRENT_PASS (WebUI password).");
  let res: Response;
  try {
    res = await fetch(`${base()}/api/v2/auth/login`, {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: u, password: p }).toString(),
      signal: AbortSignal.timeout(30000),
    });
  } catch (e) {
    throw new QbitError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) throw new QbitError(`Login failed: HTTP ${res.status}.`);
  const cookie = res.headers.get("set-cookie") ?? "";
  if (!cookie) throw new QbitError("Login failed: no session cookie (bad credentials?).");
  return cookie.split(";")[0];
}

async function get(path: string): Promise<string> {
  const sid = await login();
  let res: Response;
  try {
    res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json", Cookie: sid } });
  } catch (e) {
    throw new QbitError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new QbitError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listTorrents(): Promise<string> {
  return get("/api/v2/torrents/info");
}

export function getTransferInfo(): Promise<string> {
  return get("/api/v2/transfer/info");
}

export function getAppVersion(): Promise<string> {
  return get("/api/v2/app/version");
}

// ---- muxH tools:
// The tools above read a running qBittorrent. These two work on the identifiers
// themselves and need no connection at all: what a magnet link or info hash
// actually names, and the piece arithmetic a .torrent file has to obey.

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

function b32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let out = ""
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 0x1f]
      bits -= 5
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 0x1f]
  return out
}

function b32Decode(input: string): Buffer {
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const char of input) {
    const index = B32_ALPHABET.indexOf(char)
    if (index < 0) throw new QbitError(`"${char}" is not a base32 (RFC 4648 uppercase) character.`)
    value = (value << 5) | index
    bits += 5
    while (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

const bytesLabel = (n: number): string =>
  n >= 1073741824 ? `${(n / 1073741824).toFixed(2)} GiB` : n >= 1048576 ? `${(n / 1048576).toFixed(2)} MiB` : `${(n / 1024).toFixed(2)} KiB`

/**
 * What a magnet link or a bare info hash actually names: the exact topic, the
 * v1 and v2 hash forms, the suggested file name, the trackers and the length the
 * link claims. qBittorrent will accept a magnet; this says what is inside it.
 */
export async function parseMagnet(args: { uri: string }): Promise<string> {
  const raw = (args.uri ?? "").trim()
  if (!raw) throw new QbitError("Give a magnet URI or a bare info hash.")
  const input = raw.replace(/^magnet:\?/i, "")

  if (!/^magnet:/i.test(raw)) {
    const hash = raw
    if (/^[A-Z2-7]{32}$/.test(hash)) {
      const bytes = b32Decode(hash)
      return [
        `Info hash: ${hash}`,
        `  form: CIDv0, base32 RFC 4648, 32 characters over 20 bytes`,
        `  hex: ${bytes.toString("hex")}`,
        `  length: ${bytes.length} bytes, which is a SHA-1 as BitTorrent v1 requires`,
        `  decoded back to base32: ${b32Encode(bytes)} (${b32Encode(bytes) === hash ? "matches the input" : "does NOT match, so the input is not valid base32"})`,
        "",
        "This is the hash of the torrent's info dictionary, not of the payload. Identical content re-journalled by a different tracker still gets a different hash, because the tracker and creation time are inside the info dictionary.",
      ].join("\n")
    }
    throw new QbitError(`"${hash.slice(0, 40)}" is neither a 32-character base32 v0 hash nor a magnet URI.`)
  }

  if (!/^magnet:/i.test(raw)) throw new QbitError("That is not a magnet URI and not a bare v0 info hash.")

  let params: URLSearchParams
  try {
    params = new URLSearchParams(input)
  } catch {
    throw new QbitError("The magnet URI's query string could not be parsed.")
  }
  const topics = params.getAll("xt")
  if (!topics.length) throw new QbitError("This magnet URI has no xt= topic, so it names no torrent at all.")

  const blocks: string[] = []
  for (const topic of topics) {
    const btih = /^urn:btih:([0-9a-fA-F]{40}|[A-Za-z2-7]{32})$/.exec(topic)
    const btmh = /^urn:btmh:(\d{4})([0-9a-fA-F]+)$/.exec(topic)
    if (btih) {
      const value = btih[1]
      const hex = /^[0-9a-fA-F]{40}$/.test(value) ? value.toLowerCase() : b32Decode(value.toUpperCase()).toString("hex")
      const backToBase32 = b32Encode(Buffer.from(hex, "hex"))
      blocks.push([
        `  topic ${topic.split(":").slice(0, 2).join(":")} (BitTorrent v1)`,
        `    as supplied: ${value}`,
        `    as 40-character hex: ${hex}`,
        `    as 32-character base32: ${backToBase32}`,
        `    digest: 20 bytes, SHA-1 over the info dictionary`,
        /^[0-9a-fA-F]{40}$/.test(value)
          ? `    base32 form of the same hash: ${backToBase32}`
          : `    hex form of the same hash: ${hex} (re-encoded from the base32 above; both forms name one torrent)`,
      ].join("\n"))
    } else if (btmh) {
      const code = btmh[1]
      const multihash = btmh[2]
      const length = multihash.length / 2
      blocks.push([
        `  topic ${topic.split(":").slice(0, 2).join(":")} (multihash, code 0x${code})`,
        `    multihash: ${length} bytes of digest in hex, ${length} hex characters times 2`,
        `    digest: ${multihash.slice(0, 48)}${multihash.length > 48 ? "…" : ""}`,
        `    code 0x1220 is a 32-byte SHA-256, which is what BitTorrent v2 uses`,
      ].join("\n"))
    } else {
      blocks.push(`  topic ${topic}: not a btih or btmh topic, so no info hash could be read from it`)
    }
  }

  const trackers = params.getAll("tr")
  const webs = params.getAll("ws")
  const name = params.get("dn")
  const lengthRaw = params.get("xl")

  return [
    `Magnet link: ${shortenMagnet(raw)}`,
    `  ${topics.length} topic(s), ${trackers.length} tracker(s), ${webs.length} web seed(s)`,
    "",
    ...blocks,
    "",
    `  suggested name: ${name ? decodeURIComponent(name) : "not set, so the client will use the hash"}`,
    lengthRaw ? `  claimed length: ${bytesLabel(Number(lengthRaw))} (xl=${lengthRaw})` : "  claimed length: not set",
    "",
    trackers.length ? `trackers:` : "trackers: none, so this link cannot bootstrap from the trackerless DHT only",
    ...trackers.slice(0, 10).map((t) => `  ${decodeURIComponent(t)}`),
    trackers.length > 10 ? `  (+${trackers.length - 10} more)` : "",
    webs.length ? `web seeds:` : "web seeds: none",
    ...webs.slice(0, 5).map((w) => `  ${decodeURIComponent(w)}`),
    "",
    "Parsed from the URI alone; no tracker was contacted.",
  ].join("\n")
}

const shortenMagnet = (raw: string): string => (raw.length > 90 ? `${raw.slice(0, 90)}…` : raw)

const PIECE_SIZES: Array<{ bytes: number; label: string }> = [
  { bytes: 32 * 1024, label: "32 KiB" },
  { bytes: 64 * 1024, label: "64 KiB" },
  { bytes: 128 * 1024, label: "128 KiB" },
  { bytes: 256 * 1024, label: "256 KiB" },
  { bytes: 512 * 1024, label: "512 KiB" },
  { bytes: 1024 * 1024, label: "1 MiB" },
  { bytes: 2 * 1024 * 1024, label: "2 MiB" },
  { bytes: 4 * 1024 * 1024, label: "4 MiB" },
  { bytes: 8 * 1024 * 1024, label: "8 MiB" },
  { bytes: 16 * 1024 * 1024, label: "16 MiB" },
]

/**
 * The piece arithmetic a payload has to satisfy: how many pieces a size splits
 * into at a given piece length, how big the last piece is, and how much padding
 * the .torrent file itself needs. This is what makes a torrent announceable.
 */
export async function torrentGeometry(args: { size_bytes: number; piece_kb?: number; piece_size?: number }): Promise<string> {
  const size = Number(args.size_bytes)
  if (!Number.isFinite(size) || size <= 0) throw new QbitError("size_bytes must be a positive number of bytes.")
  if (size > Number.MAX_SAFE_INTEGER) throw new QbitError("size_bytes is larger than a 64-bit torrent can describe.")
  const total = Math.trunc(size)

  let piece: number
  let source: string
  const explicit = Number(args.piece_size)
  if (Number.isFinite(explicit) && explicit > 0) {
    if (explicit % 16384 !== 0) throw new QbitError(`piece_size must be a multiple of 16 KiB (16384); ${explicit} is not.`)
    piece = Math.trunc(explicit)
    source = `the piece_size given (${bytesLabel(piece)})`
  } else {
    const kb = Math.min(Math.max(Math.trunc(Number(args.piece_kb ?? 0) || 0), 0), 16777216)
    const match = PIECE_SIZES.find((p) => p.bytes / 1024 === kb)
    if (!match) {
      throw new QbitError(`piece_kb must be one of: ${PIECE_SIZES.map((p) => p.bytes / 1024).join(", ")}.`)
    }
    piece = match.bytes
    source = `the ${match.label} piece size asked for`
  }

  const pieces = Math.ceil(total / piece)
  const lastPiece = total - (pieces - 1) * piece
  // BEP 47: a multi-file .torrent pads the final piece so the data offset
  // lands on a multiple of 16384.
  const padding = (16384 - (total % 16384)) % 16384
  // The piece hash list itself: 20 bytes per piece in a v1 .torrent.
  const hashList = pieces * 20
  const overhead = hashList + padding + 500

  return [
    `Torrent geometry for ${total.toLocaleString()} bytes (${bytesLabel(total)})`,
    `  piece length: ${piece.toLocaleString()} bytes (${bytesLabel(piece)}), from ${source}`,
    "",
    `  pieces: ${pieces.toLocaleString()}`,
    `  full-sized pieces: ${(pieces - 1).toLocaleString()}`,
    `  final piece: ${lastPiece.toLocaleString()} bytes (${bytesLabel(lastPiece)})${lastPiece === piece ? ", the same size, so no short piece" : `, ${(piece - lastPiece).toLocaleString()} bytes short of a full piece`}`,
    `  padding to a 16 KiB boundary: ${padding.toLocaleString()} bytes`,
    "",
    "The .torrent file itself:",
    `  piece hash list: ${hashList.toLocaleString()} bytes (20 bytes per piece, SHA-1)`,
    `  dictionary, trackers and padding: about ${(overhead - hashList).toLocaleString()} bytes`,
    `  so the .torrent is roughly ${bytesLabel(overhead)} for a ${bytesLabel(total)} payload`,
    `  overhead share: ${((overhead / total) * 100).toFixed(4)}%`,
    "",
    pieces > 200000
      ? `At ${pieces.toLocaleString()} pieces the hash list alone is ${bytesLabel(hashList)} in every peer, so a smaller piece length would help small torrents.`
      : `At ${pieces.toLocaleString()} pieces the hash list is a small fraction of the download, so this piece length is well matched to the payload.`,
    "Computed from the given size and piece length; no torrent was created and nothing was fetched.",
  ].join("\n")
}
