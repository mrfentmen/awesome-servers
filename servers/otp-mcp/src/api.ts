import { createHmac } from "node:crypto"

export class OtpError extends Error {}

function base32decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/=+$/, "").replace(/\s/g, "")
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let bits = ""
  for (const c of clean) {
    const v = alphabet.indexOf(c)
    if (v < 0) throw new OtpError("Secret must be valid base32")
    bits += v.toString(2).padStart(5, "0")
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

function hotp(secret: string, counter: number, digits = 6): string {
  const key = base32decode(secret)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac("sha1", key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const bin = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3]
  return String(bin % Math.pow(10, digits)).padStart(digits, "0")
}

export async function generateTotp(args: { secret?: string }): Promise<string> {
  const secret = (args.secret ?? "").trim()
  if (!secret) throw new OtpError("Provide a base32 secret")
  const counter = Math.floor(Date.now() / 30000)
  const code = hotp(secret, counter)
  const remaining = 30 - Math.floor((Date.now() / 1000) % 30)
  return `TOTP: ${code}\nSeconds remaining: ${remaining}`
}

export async function generateHotp(args: { secret?: string; counter?: number }): Promise<string> {
  const secret = (args.secret ?? "").trim()
  if (!secret) throw new OtpError("Provide a base32 secret")
  const counter = args.counter ?? 0
  if (counter < 0) throw new OtpError("Counter must be non negative")
  return `HOTP: ${hotp(secret, counter)}\nCounter: ${counter}`
}

// ---- muxF tools:
import { timingSafeEqual } from "node:crypto"

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

function base32encode(buf: Buffer): string {
  let bits = ""
  for (const byte of buf) bits += byte.toString(2).padStart(8, "0")
  let out = ""
  for (let i = 0; i < bits.length; i += 5) {
    out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)]
  }
  while (out.length % 8 !== 0) out += "="
  return out
}

export async function provisioningUri(args: {
  secret?: string
  label?: string
  issuer?: string
  type?: string
  digits?: number
  period?: number
  counter?: number
}): Promise<string> {
  const secret = (args.secret ?? "").toUpperCase().replace(/=+$/, "").replace(/\s/g, "")
  if (!secret) throw new OtpError("Provide a base32 secret")
  const key = base32decode(secret)
  const label = (args.label ?? "").trim()
  if (!label) throw new OtpError("Provide a label, usually the account or issuer colon account")
  const type = (args.type ?? "totp").toLowerCase() === "hotp" ? "hotp" : "totp"
  const digits = Math.max(6, Math.min(Math.floor(args.digits ?? 6), 10))
  const period = Math.max(15, Math.min(Math.floor(args.period ?? 30), 300))
  const issuer = (args.issuer ?? "").trim()
  const labelPart = issuer ? `${issuer}:${label}` : label
  const params = [`secret=${secret}`, `digits=${digits}`, "algorithm=SHA1"]
  if (type === "totp") {
    params.push(`period=${period}`)
  } else {
    params.push(`counter=${Math.max(0, Math.floor(args.counter ?? 0))}`)
  }
  if (issuer) params.push(`issuer=${encodeURIComponent(issuer)}`)
  return [
    `Provisioning URI (${type}, SHA1):`,
    `otpauth://${type}/${encodeURIComponent(labelPart)}?${params.join("&")}`,
    `Secret re-encoded to canonical base32: ${base32encode(key)}`,
    `Key material: ${key.length} bytes (${key.length * 8} bits)`,
    `Type: ${type}${type === "totp" ? `, ${period} second period` : ", counter based"}`,
    `Digits: ${digits}, algorithm: SHA1`,
    `Label: ${labelPart}`,
  ].join("\n")
}

