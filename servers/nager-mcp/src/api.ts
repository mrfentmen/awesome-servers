/**
 * Nager.Date public holiday API client, keyless.
 * Covers 100+ countries: holidays, next holidays, long weekends.
 */

export class NagerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NagerError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = "mrfentmen-nager-mcp/1.0"
const BASE = "https://date.nager.at/api/v3"

let countriesCache: Country[] | null = null

export interface Country {
  countryCode: string
  name: string
}

export interface Holiday {
  date: string
  localName: string
  name: string
  countryCode: string
  global?: boolean
  counties?: string[] | null
  types?: string[]
}

export interface CountryInfo {
  commonName: string
  officialName: string
  countryCode: string
  region: string
  borders?: Array<{ commonName: string; officialName: string; countryCode: string }> | null
}

export interface LongWeekend {
  startDate: string
  endDate: string
  dayCount: number
  needBridgeDay: boolean
  bridgeDays?: string[]
}

interface RawResponse {
  status: number
  body: string
}

async function call(path: string): Promise<RawResponse> {
  let res: Response
  try {
    res = await fetch(BASE + path, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    })
  } catch (e) {
    throw new NagerError(`Could not reach date.nager.at: ${errorMessage(e)}`)
  }
  const body = (await res.text()).slice(0, 200000)
  if (res.status === 204 || res.status === 404) return { status: res.status, body }
  if (!res.ok) {
    throw new NagerError(`date.nager.at returned HTTP ${res.status}: ${body.slice(0, 200)}`)
  }
  return { status: res.status, body }
}

async function getJson<T>(path: string): Promise<T> {
  const { body } = await call(path)
  if (!body) throw new NagerError("date.nager.at returned an empty response.")
  try {
    return JSON.parse(body) as T
  } catch {
    throw new NagerError("date.nager.at returned a non-JSON response.")
  }
}

export async function countries(): Promise<Country[]> {
  if (countriesCache) return countriesCache
  countriesCache = await getJson<Country[]>("/AvailableCountries")
  return countriesCache
}

export async function countryInfo(country: string): Promise<CountryInfo> {
  const code = normaliseCountry(country)
  return getJson<CountryInfo>(`/CountryInfo/${encodeURIComponent(code)}`)
}

export async function holidays(year: string, country: string): Promise<Holiday[]> {
  const y = normaliseYear(year)
  const code = normaliseCountry(country)
  return getJson<Holiday[]>(`/PublicHolidays/${y}/${encodeURIComponent(code)}`)
}

export async function nextHolidays(country: string): Promise<Holiday[]> {
  const code = normaliseCountry(country)
  return getJson<Holiday[]>(`/NextPublicHolidays/${encodeURIComponent(code)}`)
}

export async function worldwideHolidays(): Promise<Holiday[]> {
  return getJson<Holiday[]>("/NextPublicHolidaysWorldwide")
}

export async function longWeekends(year: string, country: string): Promise<LongWeekend[]> {
  const y = normaliseYear(year)
  const code = normaliseCountry(country)
  return getJson<LongWeekend[]>(`/LongWeekend/${y}/${encodeURIComponent(code)}`)
}

export type TodayResult =
  | { isHoliday: true; holiday: Holiday }
  | { isHoliday: false }

export async function isTodayHoliday(country: string): Promise<TodayResult> {
  const code = normaliseCountry(country)
  const { status, body } = await call(`/IsTodayPublicHoliday/${encodeURIComponent(code)}`)
  if (status === 204) return { isHoliday: false }
  if (!body) return { isHoliday: false }
  try {
    const parsed = JSON.parse(body) as Holiday | Holiday[]
    const holiday = Array.isArray(parsed) ? parsed[0] : parsed
    return holiday && holiday.name ? { isHoliday: true, holiday } : { isHoliday: false }
  } catch {
    return { isHoliday: false }
  }
}

function normaliseYear(year: string): string {
  const y = year.trim()
  if (!/^\d{4}$/.test(y)) throw new NagerError(`"${year}" is not a four-digit year.`)
  const n = Number(y)
  if (n < 1975 || n > 2100) throw new NagerError(`Year ${n} is outside the supported range 1975-2100.`)
  return y
}

export function normaliseCountry(country: string): string {
  const c = country.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(c)) {
    throw new NagerError(`"${country}" is not a two-letter country code - call list_countries for the list.`)
  }
  return c
}

export function formatHoliday(h: Holiday): string {
  const types = (h.types ?? []).join("/")
  const scope = h.global === false ? "regional" : "national"
  return `  ${h.date}  ${h.localName}${h.name !== h.localName ? ` (${h.name})` : ""} - ${types || scope}`
}

export function formatHolidays(list: Holiday[], title: string): string {
  if (list.length === 0) return `No holidays found for ${title}.`
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date))
  return `${title} (${sorted.length}):\n\n${sorted.map(formatHoliday).join("\n")}`
}

export function formatCountryInfo(info: CountryInfo): string {
  const borders = (info.borders ?? []).map((b) => `${b.commonName} (${b.countryCode})`)
  return [
    `${info.commonName} (${info.countryCode})`,
    `  official name  ${info.officialName}`,
    `  region         ${info.region}`,
    `  borders        ${borders.length ? borders.join(", ") : "none - island or no land border"}`,
  ].join("\n")
}

export function formatLongWeekends(list: LongWeekend[], title: string): string {
  if (list.length === 0) return `No long weekends found for ${title}.`
  const lines = list.map(
    (w) =>
      `  ${w.startDate} -> ${w.endDate}  ${w.dayCount} day(s)${w.needBridgeDay ? `  needs bridge day: ${(w.bridgeDays ?? []).join(", ")}` : "  no bridge day needed"}`
  )
  return `${title} (${list.length}):\n\n${lines.join("\n")}`
}
