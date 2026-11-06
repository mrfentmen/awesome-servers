/**
 * Nager.Date — public holidays for around 100 countries. Keyless, no signup.
 *
 * Endpoints used (all verified live): /AvailableCountries,
 * /PublicHolidays/{year}/{countryCode}, /NextPublicHolidays/{countryCode}.
 * An unknown country answers 404 with `{"title":"Unknown country code"}`, which
 * is turned into a plain message.
 */
const API = "https://date.nager.at/api/v3"

export class NagerError extends Error {}

interface Holiday {
  date?: string
  localName?: string
  name?: string
  countryCode?: string
  global?: boolean
  types?: string[]
  counties?: string[] | null
  launchYear?: number | null
}

async function get<T>(path: string, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "nager-date-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new NagerError("Nager.Date has no holiday data for that country or year")
    if (!res.ok) throw new NagerError(`Nager.Date responded ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof NagerError) throw e
    if ((e as Error).name === "AbortError") throw new NagerError("Nager.Date request timed out")
    throw new NagerError(`Nager.Date request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

function countryCode(input: string): string {
  const v = input.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(v)) throw new NagerError(`"${input}" is not a two-letter country code, e.g. "US" or "FR"`)
  return v
}

function render(list: Holiday[], title: string): string {
  const rows = list.map((h) => {
    const types = (h.types ?? []).join("/")
    const scope = h.global === false ? (h.counties && h.counties.length > 0 ? ` · ${h.counties.join(", ")}` : " · regional") : ""
    const label = h.name ?? h.localName ?? "(unnamed)"
    const local = h.localName && h.localName !== label ? ` (${h.localName})` : ""
    return `   ${h.date ?? "????-??-??"}  ${label}${local}${types ? ` [${types}]` : ""}${scope}`
  })
  return [`${title} — ${list.length}`, "", ...rows].join("\n")
}

export async function countries(): Promise<string> {
  const list = await get<Array<{ countryCode?: string; name?: string }>>("/AvailableCountries")
  if (!Array.isArray(list) || list.length === 0) throw new NagerError("Nager.Date returned no countries")
  return [
    `${list.length} countries with public holiday data`,
    "",
    ...list.map((c) => `   ${c.countryCode ?? "??"}  ${c.name ?? ""}`.trimEnd()),
  ].join("\n")
}

export async function holidays(country: string, year: number): Promise<string> {
  const code = countryCode(country)
  const y = Number.isInteger(year) && year >= 1900 && year <= 2200 ? year : new Date().getFullYear()
  const list = await get<Holiday[]>(`/PublicHolidays/${y}/${code}`)
  if (!Array.isArray(list) || list.length === 0) return `No public holidays listed for ${code} in ${y}.`
  return render(list, `Public holidays in ${code}, ${y}`)
}

export async function next(country: string): Promise<string> {
  const code = countryCode(country)
  const list = await get<Holiday[]>(`/NextPublicHolidays/${code}`)
  if (!Array.isArray(list) || list.length === 0) return `Nager.Date lists no upcoming holidays for ${code}.`
  return render(list, `Upcoming public holidays in ${code}`)
}
