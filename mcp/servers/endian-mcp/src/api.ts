/**
 * Endian & Integers — keyless public API client.
 */

export class SourceError extends Error {}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

function parseBigInt(text: string, label: string): bigint {
  const value = clean(text).replace(/_/g, "")
  try {
    if (/^-?0x[0-9a-f]+$/i.test(value)) {
      const negative = value.startsWith("-")
      const magnitude = BigInt(negative ? value.slice(1) : value)
      return negative ? -magnitude : magnitude
    }
    return BigInt(value)
  } catch {
    throw new SourceError(`${label} must be a decimal or 0x-hex integer, got "${text}"`)
  }
}

function bytesOf(value: bigint, size: number): number[] {
  const bytes: number[] = []
  let rest = value < 0n ? value + (1n << BigInt(size * 8)) : value
  for (let i = 0; i < size; i++) {
    bytes.push(Number(rest & 0xffn))
    rest >>= 8n
  }
  return bytes
}

function hexBytes(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ")
}

function signedOf(value: bigint, bits: number): bigint {
  const limit = 1n << BigInt(bits - 1)
  return value >= limit ? value - (1n << BigInt(bits)) : value
}

function checkRange(value: bigint, bits: number, label: string): void {
  const lower = -(1n << BigInt(bits - 1))
  const upper = (1n << BigInt(bits)) - 1n
  if (value < lower || value > upper) {
    throw new SourceError(`${label} does not fit in ${bits} bits (range ${lower} to ${upper})`)
  }
}

export async function swapEndian(a: { value: string; bits: number }): Promise<string> {
  const bits = Math.floor(a.bits)
  if (![16, 32, 64].includes(bits)) throw new SourceError("bits must be 16, 32 or 64")
  const value = parseBigInt(a.value, "value")
  const size = bits / 8
  checkRange(value, bits, "value")
  const bytes = bytesOf(value, size)
  const swapped = bytes.slice().reverse()
  const swappedValue = bytesToBigInt(swapped)
  return [
    `Swapped ${bits}-bit value.`,
    "",
    bullet("input decimal", value.toString()),
    bullet("input hex", `0x${bytes.slice().reverse().map((b) => b.toString(16).padStart(2, "0")).join("")}`),
    bullet("little endian bytes", hexBytes(bytes)),
    bullet("big endian bytes", hexBytes(bytes.slice().reverse())),
    "",
    bullet("swapped decimal (unsigned)", swappedValue.toString()),
    bullet("swapped decimal (signed)", signedOf(swappedValue, bits).toString()),
    bullet("swapped hex", `0x${swapped.slice().reverse().map((b) => b.toString(16).padStart(2, "0")).join("")}`),
  ]
    .filter(Boolean)
    .join("\n")
}

function bytesToBigInt(bytes: number[]): bigint {
  let value = 0n
  for (let i = bytes.length - 1; i >= 0; i--) value = (value << 8n) | BigInt(bytes[i])
  return value
}

function byteInput(data: string, format: string): Buffer {
  if (format === "hex") {
    const cleaned = data.replace(/[\s:]/g, "").replace(/^0x/i, "")
    if (cleaned.length % 2 || !/^[0-9a-fA-F]*$/.test(cleaned)) throw new SourceError("hex input needs an even count of hex digits")
    return Buffer.from(cleaned, "hex")
  }
  if (format === "base64") return Buffer.from(data.replace(/\s+/g, ""), "base64")
  if (format === "text") return Buffer.from(data, "utf8")
  throw new SourceError('format must be "hex", "base64" or "text"')
}

export async function interpretBytes(a: { data: string; format?: string; offset?: number }): Promise<string> {
  const format = a.format ?? "hex"
  const offset = Math.floor(a.offset ?? 0)
  if (offset < 0) throw new SourceError("offset must be 0 or more")
  const bytes = byteInput(a.data, format)
  if (offset >= bytes.length) throw new SourceError(`offset ${offset} is past the end of the ${bytes.length}-byte input`)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const rows: string[] = []
  const at = offset
  rows.push(`byte ${at}`.padEnd(16) + `0x${bytes[at].toString(16).padStart(2, "0")}  ${bytes[at]}`)
  if (at + 2 <= bytes.length) {
    rows.push("u16 big endian".padEnd(16) + view.getUint16(at, false))
    rows.push("u16 little".padEnd(16) + view.getUint16(at, true))
  }
  if (at + 4 <= bytes.length) {
    rows.push("u32 big endian".padEnd(16) + view.getUint32(at, false))
    rows.push("u32 little".padEnd(16) + view.getUint32(at, true))
    rows.push("i32 signed".padEnd(16) + view.getInt32(at, true) + " (little)")
    rows.push("f32 little".padEnd(16) + view.getFloat32(at, true))
    rows.push("f32 big endian".padEnd(16) + view.getFloat32(at, false))
  }
  if (at + 8 <= bytes.length) {
    rows.push("u64 big endian".padEnd(16) + view.getBigUint64(at, false))
    rows.push("u64 little".padEnd(16) + view.getBigUint64(at, true))
    rows.push("f64 little".padEnd(16) + view.getFloat64(at, true))
  }
  return [
    `${bytes.length} byte(s), interpretations from offset ${offset}:`,
    "",
    `bytes: ${Array.from(bytes.subarray(at, Math.min(at + 16, bytes.length))).map((b) => b.toString(16).padStart(2, "0")).join(" ")}`,
    "",
    ...rows,
  ].join("\n")
}

export async function intInfo(a: { value: string; bits?: number }): Promise<string> {
  const bits = Math.floor(a.bits ?? 32)
  if (![8, 16, 32, 64].includes(bits)) throw new SourceError("bits must be 8, 16, 32 or 64")
  const value = parseBigInt(a.value, "value")
  checkRange(value, bits, "value")
  const unsigned = value < 0n ? value + (1n << BigInt(bits)) : value
  const binary = unsigned.toString(2).padStart(bits, "0")
  const grouped = binary.replace(/(.{4})(?=.)/g, "$1 ")
  return [
    `Integer ${value} as ${bits} bits:`,
    "",
    bullet("unsigned", unsigned.toString()),
    bullet("signed", signedOf(unsigned, bits).toString()),
    bullet("hex", `0x${unsigned.toString(16).toUpperCase()}`),
    bullet("binary", grouped),
    bullet("bytes big endian", hexBytes(bytesOf(unsigned, bits / 8).slice().reverse())),
    bullet("bytes little endian", hexBytes(bytesOf(unsigned, bits / 8))),
    "",
    bullet("signed range", `${-(1n << BigInt(bits - 1))} to ${(1n << BigInt(bits - 1)) - 1n}`),
    bullet("unsigned range", `0 to ${(1n << BigInt(bits)) - 1n}`),
  ]
    .filter(Boolean)
    .join("\n")
}
