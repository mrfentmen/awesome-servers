/**
 * Date Maths — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "Date Maths"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "date-math-mcp", accept },
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

const DAY = 86400000

function parseDate(raw: string, label: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) throw new SourceError(`${label} must be YYYY-MM-DD, got "${raw}"`)
  const d = new Date(`${raw.trim()}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) throw new SourceError(`${label} "${raw}" is not a real date`)
  return d
}

const iso = (d: Date): string => d.toISOString().slice(0, 10)
const isWeekend = (d: Date): boolean => d.getUTCDay() === 0 || d.getUTCDay() === 6

function holidaySet(list: string[]): Set<string> {
  const set = new Set<string>()
  for (const h of list) set.add(iso(parseDate(h, "holiday")))
  return set
}

export async function businessDaysBetween(a: { start: string; end: string; holidays: string[] }): Promise<string> {
  const s = parseDate(a.start, "start")
  const e = parseDate(a.end, "end")
  if (s > e) throw new SourceError("start must not be after end")
  const hol = holidaySet(a.holidays)
  let days = 0
  for (let t = s.getTime(); t < e.getTime(); t += DAY) {
    const d = new Date(t)
    if (!isWeekend(d) && !hol.has(iso(d))) days++
  }
  const total = Math.round((e.getTime() - s.getTime()) / DAY)
  return [
    `${iso(s)} to ${iso(e)}`,
    `Calendar days: ${total}`,
    `Business days: ${days}`,
    `Weekend days: ${total - days - a.holidays.length}`,
    `Holidays skipped: ${a.holidays.length}`,
  ].join("\n")
}

export async function addBusinessDays(a: { date: string; days: number; holidays: string[] }): Promise<string> {
  const d = parseDate(a.date, "date")
  const hol = holidaySet(a.holidays)
  const step = a.days >= 0 ? 1 : -1
  let left = Math.abs(a.days)
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + step)
    if (!isWeekend(d) && !hol.has(iso(d))) left--
  }
  return `${iso(parseDate(a.date, "date"))} ${a.days >= 0 ? "+" : "-"} ${Math.abs(a.days)} business days = ${iso(d)} (${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getUTCDay()]})`
}

export async function dateDifference(a: { from: string; to: string }): Promise<string> {
  const f = parseDate(a.from, "from")
  const t = parseDate(a.to, "to")
  if (f > t) throw new SourceError("from must not be after to")
  let years = t.getUTCFullYear() - f.getUTCFullYear()
  let months = t.getUTCMonth() - f.getUTCMonth()
  let days = t.getUTCDate() - f.getUTCDate()
  if (days < 0) {
    months--
    const prev = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 0))
    days += prev.getUTCDate()
  }
  if (months < 0) { years--; months += 12 }
  const totalDays = Math.round((t.getTime() - f.getTime()) / DAY)
  return [
    `${iso(f)} -> ${iso(t)}`,
    `Difference: ${years} years, ${months} months, ${days} days`,
    `Total days: ${totalDays}`,
    `Total weeks: ${(totalDays / 7).toFixed(2)}`,
    `Total months (approx): ${(totalDays / 30.436875).toFixed(2)}`,
    `Weekdays only: ${Math.round((totalDays / 7) * 5)} (approx)`,
  ].join("\n")
}
