/**
 * Checksums — keyless public API client.
 */

export class SourceError extends Error {}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/

function bytesInput(data: string, format: string): Buffer {
  if (format === "text") return Buffer.from(data, "utf8")
  if (format === "hex") {
    const cleaned = data.replace(/[\s:]/g, "").replace(/^0x/i, "")
    if (cleaned.length % 2 || !/^[0-9a-fA-F]*$/.test(cleaned)) throw new SourceError("hex input needs an even count of hex digits")
    return Buffer.from(cleaned, "hex")
  }
  if (format === "base64") {
    const cleaned = data.replace(/\s+/g, "")
    if (!BASE64.test(cleaned)) throw new SourceError("base64 input has characters outside the alphabet")
    return Buffer.from(cleaned, "base64")
  }
  throw new SourceError('format must be "text", "hex" or "base64"')
}

function reflect(value: number, bits: number): number {
  let out = 0
  for (let i = 0; i < bits; i++) {
    if (value & (1 << i)) out |= 1 << (bits - 1 - i)
  }
  return out
}

function crc32Raw(bytes: Buffer, poly: number, init: number, xorout: number, refin: boolean): number {
  const table = new Uint32Array(256)
  const reflected = reflect(poly, 32)
  for (let i = 0; i < 256; i++) {
    let crc = refin ? i : i << 24
    for (let bit = 0; bit < 8; bit++) {
      const mask = 0x80000000
      if (refin) {
        crc = crc & 1 ? (crc >>> 1) ^ reflected : crc >>> 1
      } else {
        crc = crc & mask ? ((crc << 1) ^ poly) >>> 0 : (crc << 1) >>> 0
      }
    }
    table[i] = crc >>> 0
  }
  let crc = init >>> 0
  for (const byte of bytes) {
    crc = refin ? (table[(crc ^ byte) & 0xff] ^ (crc >>> 8)) >>> 0 : (table[((crc >>> 24) ^ byte) & 0xff] ^ (crc << 8)) >>> 0
  }
  return (crc ^ xorout) >>> 0
}

function crc16Raw(bytes: Buffer, poly: number, init: number, refin: boolean, xorout: number): number {
  let crc = init
  for (const byte of bytes) {
    crc ^= refin ? byte : byte << 8
    for (let bit = 0; bit < 8; bit++) {
      if (refin) crc = crc & 1 ? (crc >>> 1) ^ reflect(poly, 16) : crc >>> 1
      else crc = crc & 0x8000 ? ((crc << 1) ^ poly) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return (crc ^ xorout) & 0xffff
}

function adler32(bytes: Buffer): number {
  let a = 1
  let b = 0
  for (const byte of bytes) {
    a = (a + byte) % 65521
    b = (b + a) % 65521
  }
  return ((b << 16) | a) >>> 0
}

const CRC32_VARIANTS: Record<string, { poly: number; init: number; xorout: number; refin: boolean }> = {
  "crc32": { poly: 0x04c11db7, init: 0xffffffff, xorout: 0xffffffff, refin: true },
  "crc32c": { poly: 0x1edc6f41, init: 0xffffffff, xorout: 0xffffffff, refin: true },
  "crc32/bzip2": { poly: 0x04c11db7, init: 0xffffffff, xorout: 0xffffffff, refin: false },
  "crc32/mpeg2": { poly: 0x04c11db7, init: 0xffffffff, xorout: 0x00000000, refin: false },
}

const CRC16_VARIANTS: Record<string, { poly: number; init: number; refin: boolean; xorout: number }> = {
  "crc16/arc": { poly: 0x8005, init: 0x0000, refin: true, xorout: 0x0000 },
  "crc16/ccitt-false": { poly: 0x1021, init: 0xffff, refin: false, xorout: 0x0000 },
  "crc16/xmodem": { poly: 0x1021, init: 0x0000, refin: false, xorout: 0x0000 },
  "crc16/modbus": { poly: 0x8005, init: 0xffff, refin: true, xorout: 0x0000 },
  "crc16/x25": { poly: 0x1021, init: 0xffff, refin: true, xorout: 0xffff },
}

export async function crc32(a: { data: string; format?: string; variant?: string }): Promise<string> {
  const bytes = bytesInput(a.data, a.format ?? "text")
  const variant = clean(a.variant).toLowerCase() || "crc32"
  if (variant === "adler32") {
    const value = adler32(bytes)
    return [`adler32(${bytes.length} byte(s)) = 0x${value.toString(16).toUpperCase().padStart(8, "0")} (${value})`].join("\n")
  }
  const spec = CRC32_VARIANTS[variant]
  if (!spec) throw new SourceError(`variant must be one of: ${Object.keys(CRC32_VARIANTS).join(", ")}, adler32`)
  const value = crc32Raw(bytes, spec.poly, spec.init, spec.xorout, spec.refin)
  return [
    `${variant}(${bytes.length} byte(s))`,
    "",
    bullet("hex", `0x${value.toString(16).toUpperCase().padStart(8, "0")}`),
    bullet("decimal", value),
    bullet("bytes (BE)", Buffer.from([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]).toString("hex")),
  ]
    .filter(Boolean)
    .join("\n")
}

export async function crc16(a: { data: string; format?: string; variant?: string }): Promise<string> {
  const bytes = bytesInput(a.data, a.format ?? "text")
  const variant = clean(a.variant).toLowerCase() || "crc16/arc"
  const spec = CRC16_VARIANTS[variant]
  if (!spec) throw new SourceError(`variant must be one of: ${Object.keys(CRC16_VARIANTS).join(", ")}`)
  const value = crc16Raw(bytes, spec.poly, spec.init, spec.refin, spec.xorout)
  return [
    `${variant}(${bytes.length} byte(s))`,
    "",
    bullet("hex", `0x${value.toString(16).toUpperCase().padStart(4, "0")}`),
    bullet("decimal", value),
    bullet("bytes (BE)", Buffer.from([(value >>> 8) & 0xff, value & 0xff]).toString("hex")),
  ]
    .filter(Boolean)
    .join("\n")
}

export async function checksumAll(a: { data: string; format?: string }): Promise<string> {
  const bytes = bytesInput(a.data, a.format ?? "text")
  const { createHash } = await import("node:crypto")
  const rows: string[] = []
  for (const [name, spec] of Object.entries(CRC32_VARIANTS)) {
    rows.push(`${name.padEnd(14)} 0x${crc32Raw(bytes, spec.poly, spec.init, spec.xorout, spec.refin).toString(16).toUpperCase().padStart(8, "0")}`)
  }
  rows.push(`adler32`.padEnd(14) + `0x${adler32(bytes).toString(16).toUpperCase().padStart(8, "0")}`)
  for (const [name, spec] of Object.entries(CRC16_VARIANTS)) {
    rows.push(`${name.padEnd(14)} 0x${crc16Raw(bytes, spec.poly, spec.init, spec.refin, spec.xorout).toString(16).toUpperCase().padStart(4, "0")}`)
  }
  rows.push(`md5`.padEnd(14) + createHash("md5").update(bytes).digest("hex"))
  rows.push(`sha1`.padEnd(14) + createHash("sha1").update(bytes).digest("hex"))
  rows.push(`sha256`.padEnd(14) + createHash("sha256").update(bytes).digest("hex"))
  return [
    `Checksums for ${bytes.length} byte(s):`,
    "",
    ...rows,
  ].join("\n")
}
