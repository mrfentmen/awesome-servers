/**
 * Pinata API client. Needs PINATA_JWT (free at https://app.pinata.cloud/keys).
 * Docs: https://docs.pinata.cloud/
 */
const BASE = "https://api.pinata.cloud"

export class PinataError extends Error {}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const jwt = process.env.PINATA_JWT
  if (!jwt) throw new PinataError("Set PINATA_JWT first (free at app.pinata.cloud/keys).")
  return { "User-Agent": "pinata-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${jwt}`, ...extra }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new PinataError("Pinata rejected the key (401/403). Check PINATA_JWT.")
  if (res.status === 404) throw new PinataError("Not found.")
  if (!res.ok) throw new PinataError(`Pinata error ${res.status}`)
  return (await res.json()) as T
}

export interface Pin {
  cid: string
  name?: string
  size?: number
  date?: string
}

export async function listPins(limit = 10): Promise<{ count: number; pins: Pin[] }> {
  const data = await getJson<Raw>(`/data/pinList?status=pinned&pageLimit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.rows) ? data.rows : []
  return {
    count: typeof data.count === "number" ? data.count : rows.length,
    pins: rows.slice(0, limit).map((r) => ({
      cid: String(r.ipfs_pin_hash),
      name: r.metadata?.name,
      size: r.size,
      date: r.date_pinned ? String(r.date_pinned).slice(0, 10) : undefined,
    })),
  }
}

export async function pinJson(name: string, content: string): Promise<string> {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new PinataError("Content must be valid JSON.")
  }
  const res = await fetch(`${BASE}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ pinataContent: parsed, pinataMetadata: { name: name.trim() || "mcp-pin" } }),
    signal: AbortSignal.timeout(30000),
  })
  if (res.status === 401 || res.status === 403) throw new PinataError("Pinata rejected the key (401/403).")
  if (!res.ok) throw new PinataError(`Pinata error ${res.status}`)
  const data = (await res.json()) as Raw
  if (!data.IpfsHash) throw new PinataError("Pinata returned no hash.")
  return `Pinned as ${data.IpfsHash} (https://gateway.pinata.cloud/ipfs/${data.IpfsHash})`
}

export async function unpin(cid: string): Promise<string> {
  const clean = cid.trim()
  if (!/^Qm[A-Za-z0-9]{44}$/.test(clean) && !/^bafy/.test(clean)) {
    throw new PinataError(`Not a CID: "${cid}".`)
  }
  const res = await fetch(`${BASE}/pinning/unpin/${clean}`, {
    method: "DELETE",
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new PinataError("Pinata rejected the key (401/403).")
  if (!res.ok) throw new PinataError(`Pinata error ${res.status}`)
  return `Unpinned ${clean}.`
}

export function formatPin(p: Pin, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const size = p.size !== undefined ? ` (${(p.size / 1024).toFixed(1)} KB)` : ""
  return `${prefix}${p.name ?? p.cid}${p.name ? ` [${p.cid}]` : ""}${size}${p.date ? ` — ${p.date}` : ""}`
}

// ---- muxH tools:
// A CID is self-describing: the multibase prefix says how it is encoded, and
// what follows is a version, a multicodec, a multihash function and a digest.
// These tools decode that structure locally, so a CID can be checked, compared
// and re-encoded without calling a pinning service.

const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
const B32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567"

const MULTICODECS: Record<number, string> = {
  0x55: "raw",
  0x70: "dag-pb",
  0x71: "dag-cbor",
  0x72: "libp2p-key",
  0x78: "git-raw",
  0x7b: "torrent-info",
  0x0129: "file",
  0x0290: "raw-leaves",
}

const MULTIHASHES: Record<number, string> = {
  0x11: "sha1",
  0x12: "sha2-256",
  0x13: "sha2-512",
  0x14: "sha3-512",
  0x15: "sha3-384",
  0x16: "sha3-256",
  0x17: "shake-128",
  0x18: "shake-256",
  0x1b: "keccak-256",
  0x1c: "blake2b-256",
  0x1d: "blake2s-256",
  0x22: "murmur3-128",
  0x56: "dbl-sha2-256",
}

interface DecodedCid {
  text: string
  version: 0 | 1
  multibase: string
  codecCode: number
  codec: string
  hashCode: number
  hash: string
  digest: Buffer
  /** hash code varint + length varint + digest: what a v0 CID is entirely made of. */
  multihash: Buffer
}

function decodeBase32(input: string): Buffer {
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const char of input) {
    const index = B32_ALPHABET.indexOf(char)
    if (index < 0) throw new PinataError(`"${char}" is not a base32 (RFC 4648 lowercase) character.`)
    value = (value << 5) | index
    bits += 5
    while (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

function decodeBase58(input: string): Buffer {
  let value = 0n
  for (const char of input) {
    const index = B58_ALPHABET.indexOf(char)
    if (index < 0) throw new PinataError(`"${char}" is not a base58 (bitcoin alphabet) character.`)
    value = value * 58n + BigInt(index)
  }
  const out: number[] = []
  while (value > 0n) {
    out.unshift(Number(value & 0xffn))
    value >>= 8n
  }
  for (const char of input) {
    if (char !== B58_ALPHABET[0]) break
    out.unshift(0)
  }
  return Buffer.from(out)
}

function encodeBase32(buffer: Buffer): string {
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

function encodeBase58(buffer: Buffer): string {
  let value = 0n
  for (const byte of buffer) value = (value << 8n) | BigInt(byte)
  let out = ""
  while (value > 0n) {
    out = B58_ALPHABET[Number(value % 58n)] + out
    value /= 58n
  }
  for (const byte of buffer) {
    if (byte !== 0) break
    out = B58_ALPHABET[0] + out
  }
  return out
}

function readVarint(buffer: Buffer, offset: number): [bigint, number] {
  let result = 0n
  let shift = 0n
  let index = offset
  for (;;) {
    if (index >= buffer.length) throw new PinataError("Truncated varint: the CID ends in the middle of a number.")
    const byte = buffer[index++]
    result |= BigInt(byte & 0x7f) << shift
    if ((byte & 0x80) === 0) break
    shift += 7n
    if (shift > 63n) throw new PinataError("Varint is longer than any multicodec or hash code.")
  }
  return [result, index]
}

function encodeVarint(value: number): Buffer {
  const out: number[] = []
  let rest = value
  do {
    const byte = rest & 0x7f
    rest >>>= 7
    out.push(rest > 0 ? byte | 0x80 : byte)
  } while (rest > 0)
  return Buffer.from(out)
}

const digestHex = (digest: Buffer, limit: number): string => {
  const full = digest.toString("hex")
  return full.length > limit ? `${full.slice(0, limit)}…` : full
}

const shorten = (text: string, limit = 56): string => (text.length > limit ? `${text.slice(0, limit)}…` : text)

function decodeCid(input: string): DecodedCid {
  const text = (input ?? "").trim()
  if (!text) throw new PinataError("Give a CID to decode.")
  let buffer: Buffer
  let multibase: string
  if (text[0] === "Q") {
    buffer = decodeBase58(text)
    multibase = "base58btc, no multibase prefix"
  } else if (text[0] === "b") {
    buffer = decodeBase32(text.slice(1))
    multibase = "base32 lower, multibase prefix b"
  } else if (text[0] === "z") {
    buffer = decodeBase58(text.slice(1))
    multibase = "base58btc, multibase prefix z"
  } else {
    throw new PinataError(`Unsupported multibase prefix "${text[0]}". This tool reads base58btc (Q..., z...) and base32 lower (b...).`)
  }

  let version: 0 | 1 = 0
  let codecCode = 0x70
  let cursor = 0
  if (buffer[0] === 0x01) {
    version = 1
    const [codec, after] = readVarint(buffer, 1)
    codecCode = Number(codec)
    cursor = after
  }
  const [hashCode, afterHash] = readVarint(buffer, cursor)
  const [lengthCode, afterLength] = readVarint(buffer, afterHash)
  const length = Number(lengthCode)
  const digest = buffer.subarray(afterLength, afterLength + length)
  if (digest.length !== length) {
    throw new PinataError(`Truncated CID: the header declares a ${length}-byte digest but only ${digest.length} bytes follow.`)
  }
  return {
    text,
    version,
    multibase,
    codecCode,
    codec: MULTICODECS[codecCode] ?? `unknown multicodec 0x${codecCode.toString(16)}`,
    hashCode: Number(hashCode),
    hash: MULTIHASHES[Number(hashCode)] ?? `unknown multihash 0x${Number(hashCode).toString(16)}`,
    digest: Buffer.from(digest),
    multihash: buffer.subarray(cursor),
  }
}

const sameContent = (a: DecodedCid, b: DecodedCid): boolean =>
  a.hashCode === b.hashCode && a.digest.equals(b.digest)

/**
 * Decode one CID: its version, multibase, multicodec, multihash function and
 * digest, so an opaque string becomes something a caller can reason about.
 */
export async function decodeCidTool(args: { cid: string }): Promise<string> {
  const cid = decodeCid(args.cid)
  return [
    `CID decode: ${shorten(cid.text, 68)}`,
    `  version     ${cid.version === 0 ? "CIDv0 (dag-pb and sha2-256 are implied)" : "CIDv1 (multicodec and hash are named)"}`,
    `  multibase   ${cid.multibase}`,
    `  multicodec  ${cid.codec}`,
    `  multihash   ${cid.hash}`,
    `  digest      ${cid.digest.length} bytes, ${digestHex(cid.digest, 24)}`,
    "",
    cid.version === 0
      ? "A CIDv0 is always dag-pb over sha2-256, so it can never point at a raw file or a libp2p key."
      : "A CIDv1 names its codec, so the same shape of address can be a raw file, a UnixFS node or a libp2p key.",
    "Decoded locally from the string; nothing was fetched.",
  ].join("\n")
}

/**
 * Check a list of CIDs for structure, spot duplicate strings, and show which
 * entries name the same content in more than one form (a v0 and its v1).
 */
export async function compareCids(args: { cids: string[] }): Promise<string> {
  const list = Array.isArray(args.cids) ? args.cids : []
  if (!list.length) throw new PinataError("Give at least one CID in the cids array.")
  const capped = list.slice(0, 25)
  const decoded: DecodedCid[] = []
  const failures: string[] = []
  for (const entry of capped) {
    try {
      decoded.push(decodeCid(String(entry)))
    } catch (e) {
      failures.push(`${shorten(String(entry), 34)}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  if (!decoded.length) {
    throw new PinataError(`None of the ${capped.length} CID(s) could be decoded. ${failures.slice(0, 3).join(" | ")}`)
  }

  const groups: DecodedCid[][] = []
  for (const cid of decoded) {
    const group = groups.find((g) => sameContent(g[0], cid))
    if (group) group.push(cid)
    else groups.push([cid])
  }
  const aliases = groups.filter((g) => g.length > 1)
  const seen = new Set<string>()
  const duplicateCount = decoded.filter((cid) => (seen.has(cid.text) ? true : (seen.add(cid.text), false))).length

  return [
    `CID comparison (${decoded.length} decoded of ${capped.length} given)`,
    `  ${groups.length} distinct piece(s) of content behind them`,
    "",
    ...decoded.map((cid, i) => {
      const group = groups.find((g) => sameContent(g[0], cid)) ?? [cid]
      const note = group.length > 1 ? `  [same content as ${group.length - 1} other form(s) in this list]` : ""
      return `${String(i + 1).padStart(2)}. v${cid.version}  ${cid.codec.padEnd(11)} ${cid.hash.padEnd(11)} ${digestHex(cid.digest, 20)}${note}`
    }),
    "",
    duplicateCount ? `  ${duplicateCount} exact duplicate string(s) in the list.` : "  No exact duplicate strings.",
    aliases.length
      ? `  ${aliases.length} group(s) name the same content twice: ${aliases.map((g) => g.map((c) => `v${c.version}`).join(" = ")).join("; ")}`
      : "  No content is named twice in different forms.",
    failures.length ? `  ${failures.length} could not be decoded: ${failures.slice(0, 3).join(" | ")}` : "",
    "Decoded locally from the strings; nothing was fetched.",
  ].join("\n")
}

/**
 * Re-encode one CID into another form, copying the multihash bytes unchanged,
 * so a v0 and its v1 equivalent can be compared or pasted side by side.
 */
export async function convertCid(args: { cid: string; to: string }): Promise<string> {
  const target = (args.to ?? "").trim().toLowerCase()
  if (!["v0", "v1", "base32", "base58"].includes(target)) {
    throw new PinataError("to must be one of: v0, v1, base32, base58.")
  }
  const cid = decodeCid(args.cid)
  const v1Body = Buffer.concat([Buffer.from([0x01]), encodeVarint(cid.codecCode), cid.multihash])
  const v0Body = cid.multihash

  const rows: string[] = []
  if (target === "v0" || target === "base58") {
    rows.push(`  as CIDv0 / base58btc:  ${encodeBase58(v0Body)}`)
  }
  if (target === "v1" || target === "base32") {
    rows.push(`  as CIDv1 / base32:     b${encodeBase32(v1Body)}`)
  }
  const roundTrip = decodeCid(target === "v0" || target === "base58" ? encodeBase58(v0Body) : `b${encodeBase32(v1Body)}`)

  return [
    `CID re-encoding: ${shorten(cid.text, 60)}`,
    `  source   v${cid.version}, ${cid.codec} over ${cid.hash}, ${cid.digest.length}-byte digest`,
    ...rows,
    "",
    `  reading back the ${target === "v0" || target === "base58" ? "CIDv0" : "CIDv1"} form gives v${roundTrip.version}, ${roundTrip.codec} over ${roundTrip.hash}.`,
    "The multihash bytes are copied unchanged; only the framing and encoding differ.",
  ].join("\n")
}
