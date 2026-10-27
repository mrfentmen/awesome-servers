/**
 * Nager.Date public holidays API v3 — keyless, documented, covers ~110 countries.
 * Docs: https://date.nager.at/swagger/index.html
 */
const BASE = "https://date.nager.at/api/v3"

export class HolidayError extends Error {}

interface Raw {
  status: number
  body: string
}

async function request(path: string, timeoutMs = 20000): Promise<Raw> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "public-holidays-mcp", accept: "application/json" },
    })
    return { status: res.status, body: await res.text() }
  } catch (e) {
    if ((e as Error).name === "AbortError") throw new HolidayError("Nager.Date request timed out")
    throw new HolidayError(`Nager.Date request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

async function getJson(path: string): Promise<any> {
  const { status, body } = await request(path)
  if (status === 404) throw new HolidayError(`Nager.Date has no data for that request`)
  if (status === 400) throw new HolidayError("Nager.Date rejected the country code or year")
  if (!res_ok(status)) throw new HolidayError(`Nager.Date responded ${status}`)
  try {
    return JSON.parse(body)
  } catch {
    throw new HolidayError("Nager.Date returned malformed JSON")
  }
}

const res_ok = (s: number): boolean => s >= 200 && s < 300

const cc = (c: string): string => {
  const v = c.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(v)) throw new HolidayError(`"${c}" is not a 2-letter country code, e.g. US`)
  return v
}

const yearNum = (y: number): number => {
  if (!Number.isInteger(y) || y < 1970 || y > 2100) throw new HolidayError("Year must be between 1970 and 2100")
  return y
}

interface Holiday {
  date: string
  localName: string
  name: string
  countryCode: string
  global?: boolean
  types?: string[]
  counties?: string[] | null
}

function line(h: Holiday, i?: number, today?: string): string {
  const prefix = typeof i === "number" ? `${i + 1}. ` : "• "
  const when = today ? whenUntil(h.date, today) : ""
  const scope = h.global === false ? " (regional)" : ""
  const names = h.localName && h.localName !== h.name ? ` — ${h.localName}` : ""
  return `${prefix}${h.date} · ${h.name}${names}${scope}${when}`
}

function whenUntil(date: string, today: string): string {
  const days = Math.round((Date.parse(date) - Date.parse(today)) / 86400000)
  if (!Number.isFinite(days)) return ""
  if (days === 0) return " · today"
  if (days === 1) return " · tomorrow"
  if (days > 1) return ` · in ${days} days`
  return ` · ${Math.abs(days)} days ago`
}

const todayIso = (): string => new Date().toISOString().slice(0, 10)

export async function listCountries(): Promise<string> {
  const d = await getJson("/AvailableCountries")
  const rows = Array.isArray(d) ? d : []
  if (rows.length === 0) return "Nager.Date returned no countries."
  return [
    `Nager.Date covers ${rows.length} countries:`,
    "",
    rows.map((c: any) => `${c.countryCode} ${c.name}`).join("\n"),
  ].join("\n")
}

export async function holidaysForYear(country: string, year: number): Promise<string> {
  const rows: Holiday[] = await getJson(`/PublicHolidays/${yearNum(year)}/${cc(country)}`)
  if (!Array.isArray(rows) || rows.length === 0) return `No holidays listed for ${country} in ${year}.`
  const today = todayIso()
  return [
    `Public holidays in ${cc(country)} for ${year} (${rows.length}):`,
    "",
    ...rows.map((h, i) => line(h, i, today)),
  ].join("\n")
}

export async function upcoming(country: string): Promise<string> {
  const rows: Holiday[] = await getJson(`/NextPublicHolidays/${cc(country)}`)
  if (!Array.isArray(rows) || rows.length === 0) return `No upcoming holidays for ${country}.`
  const today = todayIso()
  return [
    `Next public holidays in ${cc(country)}:`,
    "",
    ...rows.map((h, i) => line(h, i, today)),
  ].join("\n")
}

export async function isToday(country: string): Promise<string> {
  const code = cc(country)
  const { status } = await request(`/IsTodayPublicHoliday/${code}`)
  if (status === 200) {
    const rows: Holiday[] = await getJson(`/PublicHolidays/${new Date().getUTCFullYear()}/${code}`)
    const today = todayIso()
    const hit = Array.isArray(rows) ? rows.filter((h) => h.date === today) : []
    return hit.length
      ? `Yes — today (${today}) is a public holiday in ${code}:\n   ${hit.map((h) => h.name).join(", ")}`
      : `Yes — today (${today}) is a public holiday in ${code}.`
  }
  if (status === 204) return `No — today (${todayIso()}) is an ordinary working day in ${code}.`
  if (status === 404) throw new HolidayError(`Nager.Date has no holiday data for ${code}`)
  throw new HolidayError(`Nager.Date responded ${status} for ${code}`)
}

export async function longWeekends(country: string, year: number): Promise<string> {
  const rows: any[] = await getJson(`/LongWeekend/${yearNum(year)}/${cc(country)}`)
  if (!Array.isArray(rows) || rows.length === 0) return `No long weekends listed for ${country} in ${year}.`
  const lines = rows.map((w, i) => {
    const bridge = Array.isArray(w.bridgeDays) && w.bridgeDays.length ? ` · bridge day: ${w.bridgeDays.join(", ")}` : ""
    return `${i + 1}. ${w.startDate} → ${w.endDate} (${w.dayCount} days)${bridge}`
  })
  return [`Long weekends in ${cc(country)} for ${year} (${rows.length}):`, "", ...lines].join("\n")
}

export async function countryInfo(country: string): Promise<string> {
  const d = await getJson(`/CountryInfo/${cc(country)}`)
  const borders = Array.isArray(d?.borders)
    ? d.borders.map((b: any) => `${b.commonName} (${b.officialName ?? ""})`.trim()).join(", ")
    : "none listed"
  return [
    `${d.commonName} — ${cc(country)}`,
    `Official name: ${d.officialName ?? "unknown"}`,
    `Region: ${d.region ?? "unknown"}${d.subRegion ? ` · ${d.subRegion}` : ""}`,
    `Borders: ${borders}`,
  ].join("\n")
}

export async function holidayOnDate(country: string, date: string): Promise<string> {
  const day = date.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new HolidayError("Pass a date as YYYY-MM-DD")
  const rows: Holiday[] = await getJson(`/PublicHolidays/${day.slice(0, 4)}/${cc(country)}`)
  const hit = Array.isArray(rows) ? rows.filter((h) => h.date === day) : []
  if (hit.length === 0) return `${day} is not a public holiday in ${cc(country)}.`
  return [
    `${day} is a public holiday in ${cc(country)}:`,
    "",
    ...hit.map((h) => `• ${h.name}${h.localName && h.localName !== h.name ? ` (${h.localName})` : ""}${h.global === false ? " — regional" : ""}`),
  ].join("\n")
}
