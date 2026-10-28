/**
 * JWT Inspector — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "JWT Inspector"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "jwt-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

interface Decoded {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
  parts: number
}

function b64urlDecode(input: string, label: string): string {
  const text = clean(input)
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new SourceError(`${label} is not valid base64url`)
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4)
  try {
    return Buffer.from(padded, "base64").toString("utf8")
  } catch {
    throw new SourceError(`${label} could not be decoded as base64url`)
  }
}

function decode(token: string): Decoded {
  const parts = clean(token).split(".")
  if (parts.length < 2 || parts.length > 3) throw new SourceError("a JWT has two or three dot-separated parts")
  const parse = (raw: string, label: string): Record<string, unknown> => {
    const text = b64urlDecode(raw, label)
    if (!text.trim()) throw new SourceError(`${label} is empty`)
    try {
      const value = JSON.parse(text)
      if (typeof value !== "object" || value === null) throw new Error("not an object")
      return value as Record<string, unknown>
    } catch {
      throw new SourceError(`${label} is not valid JSON: ${text.slice(0, 120)}`)
    }
  }
  return {
    header: parse(parts[0], "the header"),
    payload: parse(parts[1], "the payload"),
    signature: parts[2] ?? "",
    parts: parts.length,
  }
}

function claimDate(value: unknown): Date | null {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN
  if (!Number.isFinite(n) || n <= 0) return null
  return new Date(n * 1000)
}

function stamp(d: Date): string {
  return `${d.toISOString().replace("T", " ").slice(0, 19)} UTC`
}

const KNOWN: Record<string, string> = {
  iss: "issuer",
  sub: "subject",
  aud: "audience",
  exp: "expires at",
  nbf: "not valid before",
  iat: "issued at",
  jti: "JWT id",
  scope: "scope",
  azp: "authorized party",
  email: "email",
  name: "name",
}

function claimLines(payload: Record<string, unknown>): string[] {
  return Object.entries(payload).map(([key, value]) => {
    const label = KNOWN[key] ? `${key} (${KNOWN[key]})` : key
    if (key === "exp" || key === "iat" || key === "nbf") {
      const d = claimDate(value)
      return `- ${label}: ${d ? stamp(d) : String(value)}`
    }
    const shown = typeof value === "object" ? JSON.stringify(value) : String(value)
    return `- ${label}: ${shown.length > 200 ? `${shown.slice(0, 200)}...` : shown}`
  })
}

export async function decodeJwt(a: { token: string }): Promise<string> {
  const d = decode(a.token)
  const warnings: string[] = ["The signature is NOT verified - this tool only reads the token."]
  const alg = String(d.header.alg ?? "")
  if (!alg) warnings.push("The header has no alg field.")
  if (alg === "none") warnings.push("alg is none: the token is unsigned.")
  if (!d.signature) warnings.push("The token has no signature part (two segments).")
  const exp = claimDate(d.payload.exp)
  if (!exp) warnings.push("The payload has no exp claim, so the token does not expire on its own.")
  else warnings.push(Date.now() > exp.getTime() ? `Expired at ${stamp(exp)}.` : `Valid until ${stamp(exp)}.`)
  return [
    "Header:",
    ...Object.entries(d.header).map(([k, v]) => `- ${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`),
    "",
    `Payload (${Object.keys(d.payload).length} claim(s)):`,
    ...claimLines(d.payload),
    "",
    "Checks:",
    ...warnings.map((w) => `- ${w}`),
  ].join("\n")
}

export async function tokenTimeline(a: { token: string; now?: string }): Promise<string> {
  const d = decode(a.token)
  let now = new Date()
  if (a.now) {
    const parsed = new Date(clean(a.now))
    if (Number.isNaN(parsed.getTime())) throw new SourceError("now must be an ISO 8601 timestamp")
    now = parsed
  }
  const iat = claimDate(d.payload.iat)
  const nbf = claimDate(d.payload.nbf)
  const exp = claimDate(d.payload.exp)
  const rows: string[] = [`Reference time: ${stamp(now)}`]
  if (iat) rows.push(`Issued at (iat): ${stamp(iat)} - ${iat.getTime() <= now.getTime() ? `${relative(now.getTime() - iat.getTime())} before` : `${relative(iat.getTime() - now.getTime())} after`} the reference time`)
  if (nbf) rows.push(`Not before (nbf): ${stamp(nbf)} - ${now.getTime() >= nbf.getTime() ? "already valid" : "not valid yet"}`)
  if (exp) rows.push(`Expires (exp): ${stamp(exp)} - ${now.getTime() > exp.getTime() ? `expired ${relative(now.getTime() - exp.getTime())} ago` : `expires in ${relative(exp.getTime() - now.getTime())}`}`)
  if (iat && exp) rows.push(`Lifetime: ${relative(exp.getTime() - iat.getTime())}`)
  if (!iat && !nbf && !exp) rows.push("No time claims (iat, nbf, exp) in the payload.")
  return rows.join("\n")
}

function relative(ms: number): string {
  const abs = Math.abs(ms)
  const minutes = Math.round(abs / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  const parts: string[] = []
  if (days) parts.push(`${days} day(s)`)
  if (hours) parts.push(`${hours} hour(s)`)
  if (!days && mins) parts.push(`${mins} minute(s)`)
  if (!parts.length) parts.push(`${Math.round(abs / 1000)} second(s)`)
  return parts.join(" ")
}
