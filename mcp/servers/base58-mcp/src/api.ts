/**
 * Base58 — keyless public API client.
 */

export class SourceError extends Error {}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

import { createHash } from "node:crypto"

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

function sha256(data: Buffer): Buffer {
  return createHash("sha256").update(data).digest()
}

function encodeRaw(bytes: Buffer): string {
  let num = 0n
  for (const byte of bytes) num = num * 256n + BigInt(byte)
  let out = ""
  while (num > 0n) {
    out = ALPHABET[Number(num % 58n)] + out
    num /= 58n
  }
  for (const byte of bytes) {
    if (byte !== 0) break
    out = "1" + out
  }
  return out || "1"
}

function decodeRaw(text: string): Buffer {
  let num = 0n
  for (const ch of text) {
    const index = ALPHABET.indexOf(ch)
    if (index < 0) throw new SourceError(`"${ch}" is not in the base58 alphabet`)
    num = num * 58n + BigInt(index)
  }
  const bytes: number[] = []
  while (num > 0n) {
    bytes.unshift(Number(num & 0xffn))
    num >>= 8n
  }
  for (const ch of text) {
    if (ch !== "1") break
    bytes.unshift(0)
  }
  return Buffer.from(bytes)
}

function bytesInput(data: string, format: string): Buffer {
  if (format === "hex") {
    const cleaned = data.replace(/[\s:]/g, "").replace(/^0x/i, "")
    if (cleaned.length % 2 || !/^[0-9a-fA-F]*$/.test(cleaned)) throw new SourceError("hex input needs an even count of hex digits")
    return Buffer.from(cleaned, "hex")
  }
  if (format === "base64") return Buffer.from(data.replace(/\s+/g, ""), "base64")
  if (format === "text") return Buffer.from(data, "utf8")
  throw new SourceError('format must be "hex", "base64" or "text"')
}

export async function base58Encode(a: { data: string; format?: string; check?: boolean; version?: string }): Promise<string> {
  const format = a.format ?? "text"
  const bytes = bytesInput(a.data, format)
  if (!bytes.length) throw new SourceError("the input has no bytes")
  let payload = bytes
  let versionNote = ""
  if (a.check) {
    let version: Buffer | null = null
    if (a.version !== undefined && clean(a.version) !== "") {
      const cleaned = clean(a.version).replace(/^0x/i, "")
      if (!/^[0-9a-fA-F]{1,2}$/.test(cleaned)) throw new SourceError("version must be one byte of hex, e.g. 00 or 80")
      version = Buffer.from(cleaned.padStart(2, "0"), "hex")
    }
    payload = version ? Buffer.concat([version, bytes]) : bytes
    versionNote = version ? `with version byte 0x${version.toString("hex")}` : "with no version byte"
  }
  const withChecksum = a.check ? Buffer.concat([payload, sha256(sha256(payload)).subarray(0, 4)]) : bytes
  const text = encodeRaw(withChecksum)
  return [
    text,
    "",
    bullet("input", `${bytes.length} byte(s) from ${format}`),
    a.check ? bullet("encoding", `base58check ${versionNote}`) : bullet("encoding", "plain base58 (no checksum)"),
    bullet("output length", text.length),
  ]
    .filter(Boolean)
    .join("\n")
}

export async function base58Decode(a: { text: string; check?: boolean }): Promise<string> {
  const text = clean(a.text)
  if (!text) throw new SourceError("text is required")
  if (/[^1-9A-HJ-NP-Za-km-z]/.test(text)) {
    const bad = text.match(/[^1-9A-HJ-NP-Za-km-z]/)?.[0]
    throw new SourceError(`"${bad}" is not in the base58 alphabet (0, O, I and l are excluded)`)
  }
  const raw = decodeRaw(text)
  let payload = raw
  let checksumNote = "no checksum expected"
  if (a.check) {
    if (raw.length < 5) throw new SourceError("base58check data needs at least 5 bytes (version, payload, 4-byte checksum)")
    const body = raw.subarray(0, raw.length - 4)
    const checksum = raw.subarray(raw.length - 4)
    const expected = sha256(sha256(body)).subarray(0, 4)
    if (!checksum.equals(expected)) throw new SourceError("the base58check checksum does not match")
    payload = body
    checksumNote = "checksum verified"
  }
  const asText = payload.toString("utf8")
  const printable = Array.from(payload).every((b) => b === 9 || b === 10 || b === 13 || (b >= 32 && b < 127))
  return [
    bullet("bytes", `${raw.length}`),
    bullet("payload hex", payload.toString("hex")),
    bullet("payload base64", payload.toString("base64")),
    a.check ? bullet("check", checksumNote) : "",
    a.check && payload.length >= 1 ? bullet("version byte", `0x${payload.subarray(0, 1).toString("hex")}`) : "",
    printable ? bullet("as text", JSON.stringify(asText)) : bullet("as text", "(not printable)"),
  ]
    .filter(Boolean)
    .join("\n")
}

export async function base58AlphabetInfo(): Promise<string> {
  return [
    "Base58 alphabet (Bitcoin flavour):",
    "",
    ALPHABET,
    "",
    "Excluded on purpose: 0 (zero), O (capital o), I (capital i) and l (lowercase L) — they are easy to confuse.",
    "",
    "Common version bytes when base58check is used:",
    "  0x00  P2PKH address (mainnet, starts with 1)",
    "  0x05  P2SH address (mainnet, starts with 3)",
    "  0x6f  P2PKH address (testnet, starts with m or n)",
    "  0x80  WIF private key",
    "  0x0488b21e  extended public key (xpub)",
    "  0x0488ade4  extended private key (xprv)",
  ].join("\n")
}
