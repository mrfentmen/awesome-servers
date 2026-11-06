/**
 * legislation.gov.uk — Fetch UK Acts of Parliament as plain text. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against www.legislation.gov.uk.
 */
const API = "https://www.legislation.gov.uk"

export class LegislationError extends Error {}

type Row = Record<string, unknown>

const val = (v: unknown): string => {
  if (typeof v === "string") return v
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : ""
  if (Array.isArray(v)) return v.length > 0 ? val(v[0]) : ""
  if (v && typeof v === "object") {
    const o = v as Row
    if ("en" in o) return val(o.en)
    const first = Object.values(o)[0]
    return first === undefined ? "" : val(first)
  }
  return ""
}

const at = (o: unknown, path: string): unknown =>
  path === "" ? o : path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Row)[k] : undefined), o)

const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : [])

async function get<T>(url: string, init?: RequestInit, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "user-agent": "legislation-gov-uk-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new LegislationError(`legislation.gov.uk returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof LegislationError) throw e
    if ((e as Error).name === "AbortError") throw new LegislationError("legislation.gov.uk request timed out")
    throw new LegislationError(`legislation.gov.uk request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

async function getText(url: string, timeoutMs = 30000): Promise<string> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "legislation-gov-uk-mcp", accept: "*/*" } })
    if (!res.ok) throw new LegislationError(`legislation.gov.uk returned HTTP ${res.status}`)
    return await res.text()
  } catch (e) {
    if (e instanceof LegislationError) throw e
    if ((e as Error).name === "AbortError") throw new LegislationError("legislation.gov.uk request timed out")
    throw new LegislationError(`legislation.gov.uk request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function act(kind = "ukpga", year = 2018, number = 12): Promise<string> {
  const type = kind.trim().toLowerCase()
  if (!/^[a-z]{2,6}$/.test(type)) throw new LegislationError("kind must be a short act type such as ukpga")
  const xml = await getText(`${API}/${type}/${year}/${number}/data.xml`)
  const plain = xml.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim()
  if (plain === "") throw new LegislationError(`no text found for ${type}/${year}/${number}`)
  const head = `${type.toUpperCase()} ${year} chapter ${number}`
  return [head, "", plain.slice(0, 1500) + (plain.length > 1500 ? " …" : "")].join("\n")
}
