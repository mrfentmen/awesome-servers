/**
 * Hex Dump — keyless public API client.
 */

export class SourceError extends Error {}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/

function bytesFrom(data: string, format: string): Buffer {
  if (format === "text") return Buffer.from(data, "utf8")
  if (format === "hex") {
    const cleaned = data.replace(/[\s:]/g, "").replace(/^0x/i, "")
    if (cleaned.length % 2 !== 0) throw new SourceError("hex input needs an even number of digits")
    if (!/^[0-9a-fA-F]*$/.test(cleaned)) throw new SourceError("hex input contains characters that are not hex digits")
    return Buffer.from(cleaned, "hex")
  }
  if (format === "base64") {
    const cleaned = data.replace(/\s+/g, "")
    if (!BASE64.test(cleaned)) throw new SourceError("base64 input has characters outside the alphabet")
    return Buffer.from(cleaned, "base64")
  }
  throw new SourceError('format must be "text", "hex" or "base64"')
}

function printable(byte: number): string {
  return byte >= 32 && byte < 127 ? String.fromCharCode(byte) : "."
}

export async function hexDump(a: { data: string; format?: string; width?: number; offset?: number }): Promise<string> {
  const format = a.format ?? "text"
  const width = Math.floor(a.width ?? 16)
  if (![8, 16].includes(width)) throw new SourceError("width must be 8 or 16")
  const offset = Math.floor(a.offset ?? 0)
  if (!Number.isInteger(offset) || offset < 0) throw new SourceError("offset must be 0 or more")
  const bytes = bytesFrom(a.data, format)
  if (!bytes.length) throw new SourceError("the input has no bytes")
  if (offset >= bytes.length) throw new SourceError(`offset ${offset} is past the end of the ${bytes.length}-byte input`)
  const lines: string[] = []
  for (let i = offset; i < bytes.length; i += width) {
    const slice = bytes.subarray(i, Math.min(i + width, bytes.length))
    const hex = Array.from(slice).map((b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(width * 3 - 1)
    const ascii = Array.from(slice).map(printable).join("")
    lines.push(`${i.toString(16).padStart(8, "0")}  ${hex}  |${ascii}|`)
  }
  return [
    `${bytes.length} byte(s) — "${format}" input, ${width}-byte rows from offset ${offset}:`,
    "",
    ...lines.slice(0, 200),
    lines.length > 200 ? `... ${lines.length - 200} more row(s)` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function convertBytes(a: { data: string; from?: string; to: string }): Promise<string> {
  const from = a.from ?? "text"
  const bytes = bytesFrom(a.data, from)
  let out: string
  if (a.to === "hex") out = bytes.toString("hex").replace(/(..)(?=.)/g, "$1 ")
  else if (a.to === "base64") out = bytes.toString("base64")
  else if (a.to === "text") out = bytes.toString("utf8")
  else if (a.to === "dec") out = Array.from(bytes).join(" ")
  else throw new SourceError('to must be "hex", "base64", "text" or "dec"')
  return [
    `${bytes.length} byte(s):`,
    "",
    out.length > 4000 ? out.slice(0, 4000) + " ... (truncated)" : out,
  ].join("\n")
}

export async function byteStats(a: { data: string; format?: string }): Promise<string> {
  const format = a.format ?? "text"
  const bytes = bytesFrom(a.data, format)
  if (!bytes.length) throw new SourceError("the input has no bytes")
  const counts = new Map<number, number>()
  for (const byte of bytes) counts.set(byte, (counts.get(byte) ?? 0) + 1)
  let entropy = 0
  for (const count of counts.values()) {
    const p = count / bytes.length
    entropy -= p * Math.log2(p)
  }
  const printableCount = Array.from(bytes).filter((b) => b >= 32 && b < 127).length
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const bits = (fn: () => string) => (bytes.length >= 1)
  const ints: string[] = []
  ints.push(`u8[0]:      ${bytes[0]}`)
  if (bytes.length >= 2) ints.push(`u16le[0]:   ${view.getUint16(0, true)}`, `u16be[0]:   ${view.getUint16(0, false)}`)
  if (bytes.length >= 4) ints.push(`u32le[0]:   ${view.getUint32(0, true)}`, `u32be[0]:   ${view.getUint32(0, false)}`, `f32le[0]:   ${view.getFloat32(0, true)}`)
  if (bytes.length >= 8) ints.push(`u64le[0]:   ${view.getBigUint64(0, true)}`, `f64le[0]:   ${view.getFloat64(0, true)}`)
  void bits
  const shown = Array.from(bytes.subarray(0, 32)).map((b) => b.toString(16).padStart(2, "0")).join(" ")
  return [
    `${bytes.length} byte(s)`,
    "",
    bullet("distinct byte values", counts.size),
    bullet("printable bytes", `${printableCount} (${Math.round((printableCount / bytes.length) * 100)}%)`),
    bullet("byte entropy", `${Math.round(entropy * 100) / 100} bits per byte (max 8)`),
    badge(shown, bytes.length),
    "",
    "First bytes read as numbers:",
    ...ints.map((line) => `  ${line}`),
  ]
    .filter(Boolean)
    .join("\n")
}

function badge(shown: string, total: number): string {
  return `first byte(s): ${shown}${total > 32 ? " ..." : ""}`
}
