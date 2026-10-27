/**
 * Random User Generator — keyless public API client.
 */
const BASE = "https://randomuser.me"
const SOURCE = "Random User Generator"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "randomuser-mcp", accept },
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

const NATIONS = ["AU", "BR", "CA", "CH", "DE", "DK", "ES", "FI", "FR", "GB", "IE", "IN", "IR", "MX", "NL", "NO", "NZ", "RS", "TR", "UA", "US"]

function normalizeNat(value: string | undefined): string {
  if (!value) return ""
  const nat = clean(value).toUpperCase()
  if (!NATIONS.includes(nat)) throw new SourceError(`nat must be one of ${NATIONS.join(", ")}`)
  return nat
}

function render(u: any): string {
  const loc = u.location ?? {}
  const street = loc.street ? `${loc.street.number} ${clean(loc.street.name)}` : ""
  const address = [street, clean(loc.city), clean(loc.state), clean(loc.postcode), clean(loc.country)].filter(Boolean).join(", ")
  return [
    `${clean(u.name?.title)} ${clean(u.name?.first)} ${clean(u.name?.last)} (${clean(u.gender)}, ${clean(u.nat)})`,
    `  ${clean(u.email)} · username ${clean(u.login?.username)} · age ${u.dob?.age ?? "?"}`,
    address ? `  ${address}` : "",
    `  ${clean(u.phone)} · registered ${clean(u.registered?.date)?.slice(0, 10) || "?"}`,
    u.picture?.thumbnail ? `  ${clean(u.picture.thumbnail)}` : "",
  ].filter(Boolean).join("\n")
}

export async function randomUsers(a: { count?: number; nat?: string }): Promise<string> {
  const count = a.count ?? 3
  if (!Number.isInteger(count) || count < 1 || count > 20) throw new SourceError("count must be between 1 and 20")
  const nat = normalizeNat(a.nat)
  const qs = new URLSearchParams({ results: String(count) })
  if (nat) qs.set("nat", nat.toLowerCase())
  const d = await getJson(`/api/?${qs.toString()}`)
  const rows: any[] = Array.isArray(d?.results) ? d.results : []
  if (!rows.length) throw new SourceError("randomuser.me returned nobody")
  return [
    `${rows.length} generated user(s)${nat ? ` from ${nat}` : ""} - synthetic, not real people:`,
    "",
    ...rows.map(render),
  ].join("\n")
}

export async function usersByGender(a: { gender: "male" | "female"; count?: number; nat?: string }): Promise<string> {
  const gender = clean(a.gender).toLowerCase()
  if (gender !== "male" && gender !== "female") throw new SourceError("gender must be male or female")
  const count = a.count ?? 3
  if (!Number.isInteger(count) || count < 1 || count > 20) throw new SourceError("count must be between 1 and 20")
  const nat = normalizeNat(a.nat)
  const qs = new URLSearchParams({ results: String(count), gender })
  if (nat) qs.set("nat", nat.toLowerCase())
  const d = await getJson(`/api/?${qs.toString()}`)
  const rows: any[] = Array.isArray(d?.results) ? d.results : []
  if (!rows.length) throw new SourceError("randomuser.me returned nobody")
  return [
    `${rows.length} generated ${gender} user(s)${nat ? ` from ${nat}` : ""} - synthetic, not real people:`,
    "",
    ...rows.map(render),
  ].join("\n")
}
