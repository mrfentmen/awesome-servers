/**
 * TOTP — keyless public API client.
 */

export class SourceError extends Error {}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

function base32Decode(input: string): Buffer {
  const s = input.toUpperCase().replace(/[\s-]/g, "").replace(/=+$/, "")
  if (!s) throw new SourceError("secret is required")
  if (/[^A-Z2-7]/.test(s)) throw new SourceError("secret must be base32: the characters A-Z and 2-7 only")
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of s) {
    value = (value << 5) | ALPHABET.indexOf(ch)
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  if (!out.length) throw new SourceError("secret is too short to hold a key")
  return Buffer.from(out)
}

function base32Encode(buf: Buffer): string {
  let bits = 0
  let value = 0
  let out = ""
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}

function hotp(key: Buffer, counter: number, digits: number, algorithm: string): string {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac(algorithm, key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3]
  return String(code % 10 ** digits).padStart(digits, "0")
}

function checkParams(digits: number, period: number, algorithm: string): void {
  if (!Number.isInteger(digits) || digits < 6 || digits > 10) throw new SourceError("digits must be between 6 and 10")
  if (!Number.isInteger(period) || period < 10 || period > 300) throw new SourceError("period must be between 10 and 300 seconds")
  if (!["sha1", "sha256", "sha512"].includes(algorithm)) throw new SourceError("algorithm must be sha1, sha256 or sha512")
}

export async function generateTotp(a: {
  secret: string
  digits?: number
  period?: number
  algorithm?: string
  at?: string
}): Promise<string> {
  const digits = Math.floor(a.digits ?? 6)
  const period = Math.floor(a.period ?? 30)
  const algorithm = clean(a.algorithm).toLowerCase() || "sha1"
  checkParams(digits, period, algorithm)
  const key = base32Decode(a.secret)
  const when = a.at ? new Date(a.at) : new Date()
  if (Number.isNaN(when.getTime())) throw new SourceError(`at must be an ISO 8601 date/time, got "${a.at}"`)
  const counter = Math.floor(when.getTime() / 1000 / period)
  const code = hotp(key, counter, digits, algorithm)
  const next = hotp(key, counter + 1, digits, algorithm)
  const elapsed = Math.floor(when.getTime() / 1000) % period
  return [
    `Code: ${code}`,
    "",
    bullet("valid for", `${period - elapsed} more second(s)`),
    bullet("next code", next),
    bullet("counter", counter),
    bullet("time", new Date(counter * period * 1000).toISOString()),
    bullet("parameters", `${algorithm.toUpperCase()}, ${digits} digits, ${period}s period`),
  ]
    .filter(Boolean)
    .join("\n")
}

export async function verifyTotp(a: {
  secret: string
  code: string
  digits?: number
  period?: number
  algorithm?: string
  window?: number
}): Promise<string> {
  const digits = Math.floor(a.digits ?? 6)
  const period = Math.floor(a.period ?? 30)
  const algorithm = clean(a.algorithm).toLowerCase() || "sha1"
  checkParams(digits, period, algorithm)
  const window = Math.floor(a.window ?? 1)
  if (!Number.isInteger(window) || window < 0 || window > 10) throw new SourceError("window must be between 0 and 10 steps")
  const code = clean(a.code)
  if (!new RegExp(`^[0-9]{${digits}}$`).test(code)) throw new SourceError(`code must be exactly ${digits} digits`)
  const key = base32Decode(a.secret)
  const counter = Math.floor(Date.now() / 1000 / period)
  for (let drift = -window; drift <= window; drift++) {
    const expected = hotp(key, counter + drift, digits, algorithm)
    if (expected.length === code.length && timingSafeEqual(Buffer.from(expected), Buffer.from(code))) {
      return [
        `Valid TOTP code.`,
        drift === 0 ? "The code matches the current time step." : `The code is ${Math.abs(drift)} step(s) ${drift < 0 ? "old" : "ahead"} (drift accepted by the ${window}-step window).`,
      ].join("\n")
    }
  }
  return [
    "Invalid TOTP code.",
    "",
    `The current code is ${hotp(key, counter, digits, algorithm)} — the supplied code matches no step between ${counter - window} and ${counter + window}.`,
  ].join("\n")
}

export async function generateSecret(a: { length?: number; account?: string; issuer?: string; digits?: number; period?: number }): Promise<string> {
  const length = Math.floor(a.length ?? 20)
  if (!Number.isInteger(length) || length < 10 || length > 64) throw new SourceError("length must be between 10 and 64 bytes")
  const digits = Math.floor(a.digits ?? 6)
  const period = Math.floor(a.period ?? 30)
  checkParams(digits, period, "sha1")
  const secret = base32Encode(randomBytes(length))
  const lines = [`Secret (base32, ${length} bytes): ${secret}`]
  if (a.account) {
    const account = clean(a.account)
    const issuer = clean(a.issuer)
    const label = issuer ? `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}` : encodeURIComponent(account)
    const params = new URLSearchParams({ secret, digits: String(digits), period: String(period), algorithm: "SHA1" })
    if (issuer) params.set("issuer", issuer)
    lines.push("", `otpauth URI:`, `otpauth://totp/${label}?${params.toString()}`)
  } else {
    lines.push("", "Pass an account (and optionally an issuer) to also get an otpauth:// URI for a QR code.")
  }
  lines.push("", "Keep this secret private — anyone holding it can generate your codes.")
  return lines.join("\n")
}
