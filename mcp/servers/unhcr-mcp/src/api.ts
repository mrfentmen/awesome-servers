/**
 * UNHCR Refugee Data — keyless public API client.
 */
const BASE = "https://api.unhcr.org/population/v1"
const SOURCE = "UNHCR Refugee Data"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "unhcr-mcp", accept },
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

const NUMBERS = ["refugees", "asylum_seekers", "returned_refugees", "idps", "returned_idps", "stateless", "others", "ooc", "oip"] as const

function iso3(value: string, label: string): string {
  const code = clean(value).toUpperCase()
  if (!/^[A-Z]{3}$/.test(code)) throw new SourceError(`${label} must be a three-letter ISO3 code, e.g. AFG`)
  return code
}

function rowLine(r: any): string {
  const bits = NUMBERS.filter((k) => r[k] !== undefined && r[k] !== null && r[k] !== "").map((k) => `${k.replace(/_/g, " ")} ${Number(r[k]).toLocaleString("en-US")}`)
  const total = NUMBERS.reduce((sum, k) => sum + Number(r[k] ?? 0), 0)
  const from = clean(r.coo_name) || clean(r.coo)
  const to = clean(r.coa_name) || clean(r.coa)
  return `- ${from} → ${to}: ${bits.join(" · ")}\n  total ${total.toLocaleString("en-US")}`
}

async function fetchRows(path: string): Promise<{ rows: any[]; meta: any }> {
  const d = await getJson(path)
  return { rows: Array.isArray(d?.items) ? d.items : [], meta: d }
}

export async function populationByOrigin(a: { year: number; origin: string; limit?: number }): Promise<string> {
  const year = a.year
  if (!Number.isInteger(year) || year < 1951 || year > 2100) throw new SourceError("year must be between 1951 and 2100")
  const origin = iso3(a.origin, "origin")
  const limit = a.limit ?? 10
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new SourceError("limit must be between 1 and 25")
  const { rows } = await fetchRows(`/population/?year=${year}&coo=${origin}&limit=${limit}`)
  if (!rows.length) return `UNHCR lists no displacement rows from ${origin} in ${year}. Try another year or origin.`
  const total = rows.reduce((sum, r) => sum + NUMBERS.reduce((s, k) => s + Number(r[k] ?? 0), 0), 0)
  return [
    `UNHCR displacement from ${clean(rows[0].coo_name) || origin} in ${year} - ${rows.length} row(s):`,
    "",
    ...rows.map(rowLine),
    "",
    `Rows here total ${total.toLocaleString("en-US")} people.`,
    `Source: https://api.unhcr.org/population/v1/`,
  ].join("\n")
}

export async function asylumByCountry(a: { year: number; asylum: string; limit?: number }): Promise<string> {
  const year = a.year
  if (!Number.isInteger(year) || year < 1951 || year > 2100) throw new SourceError("year must be between 1951 and 2100")
  const asylum = iso3(a.asylum, "asylum")
  const limit = a.limit ?? 10
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new SourceError("limit must be between 1 and 25")
  const { rows } = await fetchRows(`/population/?year=${year}&coa=${asylum}&limit=${limit}`)
  if (!rows.length) return `UNHCR lists no displacement rows hosted by ${asylum} in ${year}. Countries with large hosted populations, e.g. TUR, COL or UGA, usually have rows.`
  const total = rows.reduce((sum, r) => sum + NUMBERS.reduce((s, k) => s + Number(r[k] ?? 0), 0), 0)
  return [
    `UNHCR displacement hosted by ${clean(rows[0].coa_name) || asylum} in ${year} - ${rows.length} row(s):`,
    "",
    ...rows.map(rowLine),
    "",
    `Rows here total ${total.toLocaleString("en-US")} people.`,
  ].join("\n")
}

export async function trends(a: { origin: string; yearFrom: number; yearTo: number }): Promise<string> {
  const origin = iso3(a.origin, "origin")
  const from = a.yearFrom
  const to = a.yearTo
  if (!Number.isInteger(from) || !Number.isInteger(to)) throw new SourceError("yearFrom and yearTo must be whole years")
  if (from < 1951 || to > 2100) throw new SourceError("years must be between 1951 and 2100")
  if (to < from) throw new SourceError("yearTo must not be before yearFrom")
  if (to - from > 30) throw new SourceError("ask for at most 31 years at a time")
  const { rows } = await fetchRows(`/population/?yearFrom=${from}&yearTo=${to}&coo=${origin}&limit=500`)
  if (!rows.length) return `UNHCR lists no displacement rows from ${origin} between ${from} and ${to}.`
  const byYear = new Map<number, number>()
  let name = origin
  for (const r of rows) {
    name = clean(r.coo_name) || name
    const sum = NUMBERS.reduce((s, k) => s + Number(r[k] ?? 0), 0)
    byYear.set(Number(r.year), (byYear.get(Number(r.year)) ?? 0) + sum)
  }
  const years = [...byYear.keys()].sort((a2, b2) => a2 - b2)
  const peak = years.reduce((best, y) => ((byYear.get(y) ?? 0) > (byYear.get(best) ?? 0) ? y : best), years[0])
  return [
    `UNHCR forced displacement from ${name} (${origin}), ${from}-${to}:`,
    "",
    ...years.map((y) => `- ${y}: ${(byYear.get(y) ?? 0).toLocaleString("en-US")}`),
    "",
    `Peak year: ${peak} with ${(byYear.get(peak) ?? 0).toLocaleString("en-US")} people.`,
    `These are the rows UNHCR returns for the origin, summed across host countries.`,
  ].join("\n")
}
