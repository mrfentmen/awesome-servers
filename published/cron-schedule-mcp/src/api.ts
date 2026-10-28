/**
 * Cron Schedules — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "Cron Schedules"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "cron-schedule-mcp", accept },
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

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

interface Field {
  raw: string
  values: number[]
  wildcard: boolean
}

interface Schedule {
  minute: Field
  hour: Field
  dom: Field
  month: Field
  dow: Field
}

function namesFor(values: string[], names: string[]): string[] {
  return values.map((v) => {
    const upper = v.toUpperCase()
    const idx = names.indexOf(upper)
    return idx >= 0 ? String(idx === 0 && names === DAYS ? 0 : idx) : v
  })
}

function expandField(raw: string, min: number, max: number, label: string, names: string[] = []): Field {
  const text = clean(raw)
  if (!text) throw new SourceError(`${label} field is empty`)
  if (/^[*/]$/.test(text)) return { raw: text, values: rangeOf(min, max), wildcard: true }
  const values = new Set<number>()
  for (const chunk of text.split(",")) {
    const piece = chunk.trim()
    if (!piece) throw new SourceError(`${label} has an empty list entry`)
    const [rangePart, stepPart] = piece.split("/")
    let step = 1
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart) || Number(stepPart) < 1) throw new SourceError(`${label} step "${stepPart}" must be a positive whole number`)
      step = Number(stepPart)
    }
    let start = min
    let end = max
    if (rangePart !== "*") {
      const bits = rangePart.split("-")
      if (bits.length > 2) throw new SourceError(`${label} range "${rangePart}" has too many dashes`)
      const from = resolveValue(bits[0], min, max, label, names)
      start = from
      end = bits.length === 2 ? resolveValue(bits[1], min, max, label, names) : stepPart !== undefined ? max : from
      if (end < start) throw new SourceError(`${label} range "${rangePart}" runs backwards`)
    }
    for (let v = start; v <= end; v += step) values.add(v)
  }
  const list = [...values].sort((a, b) => a - b)
  if (!list.length) throw new SourceError(`${label} matches no value`)
  for (const v of list) {
    if (v < min || v > max) throw new SourceError(`${label} value ${v} is outside ${min}-${max}`)
  }
  return { raw: text, values: list, wildcard: text === "*" }
}

function resolveValue(token: string, min: number, max: number, label: string, names: string[]): number {
  const t = clean(token).toUpperCase()
  const nameIdx = names.indexOf(t)
  if (nameIdx >= 0) return nameIdx
  if (/^\d+$/.test(t)) {
    const n = Number(t)
    if (n < min || n > max) throw new SourceError(`${label} value ${n} is outside ${min}-${max}`)
    return n
  }
  throw new SourceError(`${label} value "${token}" is not a number${names.length ? ` or name (${names.join(", ")})` : ""}`)
}

function rangeOf(min: number, max: number): number[] {
  const out: number[] = []
  for (let v = min; v <= max; v++) out.push(v)
  return out
}

function parseSchedule(expression: string): Schedule {
  const parts = clean(expression).split(/\s+/)
  if (parts.length !== 5) {
    throw new SourceError(`cron needs 5 fields (minute hour day-of-month month day-of-week), got ${parts.length}`)
  }
  return {
    minute: expandField(parts[0], 0, 59, "minute"),
    hour: expandField(parts[1], 0, 23, "hour"),
    dom: expandField(parts[2], 1, 31, "day-of-month"),
    month: expandField(parts[3], 1, 12, "month", MONTHS),
    dow: expandField(namesFor(parts[4].split(","), DAYS).join(","), 0, 6, "day-of-week", DAYS),
  }
}

function matches(s: Schedule, d: Date): boolean {
  if (!s.minute.values.includes(d.getMinutes())) return false
  if (!s.hour.values.includes(d.getHours())) return false
  if (!s.month.values.includes(d.getMonth() + 1)) return false
  const domOk = s.dom.values.includes(d.getDate())
  const dowOk = s.dow.values.includes(d.getDay())
  if (s.dom.wildcard && s.dow.wildcard) return true
  if (s.dom.wildcard) return dowOk
  if (s.dow.wildcard) return domOk
  return domOk || dowOk
}

function fieldText(f: Field, label: string, max: number, names?: string[]): string {
  if (f.wildcard) return `every ${label}`
  const shown = f.values.slice(0, 12).join(", ")
  const suffix = f.values.length > 12 ? `, ... (${f.values.length} values)` : ""
  const named = names ? f.values.map((v) => names[v] ?? String(v)).join(", ") : shown
  return `at ${names ? named : shown}${suffix}`
}

export async function describeCron(a: { expression: string }): Promise<string> {
  const s = parseSchedule(a.expression)
  const minutes = s.minute.values.length
  const hours = s.hour.values.length
  const perDay = minutes * hours
  const dayText = s.dom.wildcard && s.dow.wildcard
    ? "every day"
    : s.dom.wildcard
      ? `on ${s.dow.values.map((v) => DAYS[v]).join(", ")}`
      : `on day(s) ${s.dom.values.join(", ")} of the month${s.dow.wildcard ? "" : ` or on ${s.dow.values.map((v) => DAYS[v]).join(", ")}`}`
  return [
    `Cron: ${clean(a.expression)}`,
    "",
    `Minutes: ${fieldText(s.minute, "minute", 59)}`,
    `Hours:   ${fieldText(s.hour, "hour", 23)}`,
    `Days:    ${dayText}`,
    `Months:  ${fieldText(s.month, "month", 12, MONTHS)}`,
    "",
    `This runs ${perDay === 1 ? "once" : `${perDay} times`} a day on matching days.`,
    s.dom.wildcard || s.dow.wildcard ? "" : "Because both day-of-month and day-of-week are set, a day matches if either one matches.",
  ].filter(Boolean).join("\n")
}

export async function nextRuns(a: { expression: string; count?: number; from?: string }): Promise<string> {
  const s = parseSchedule(a.expression)
  const count = a.count ?? 5
  if (!Number.isInteger(count) || count < 1 || count > 20) throw new SourceError("count must be between 1 and 20")
  let cursor: Date
  if (a.from) {
    const parsed = new Date(clean(a.from))
    if (Number.isNaN(parsed.getTime())) throw new SourceError("from must be an ISO 8601 timestamp, e.g. 2026-11-01T00:00:00Z")
    cursor = parsed
  } else {
    cursor = new Date()
  }
  cursor = new Date(cursor.getTime() - (cursor.getTime() % 60000) + 60000)
  const found: Date[] = []
  const limit = 60 * 24 * 366 * 4
  for (let i = 0; i < limit && found.length < count; i++) {
    if (matches(s, cursor)) found.push(new Date(cursor))
    cursor = new Date(cursor.getTime() + 60000)
  }
  if (!found.length) throw new SourceError("no run time found in the next four years - check the expression")
  const gaps = found.map((d, i) => (i === 0 ? null : (d.getTime() - found[i - 1].getTime()) / 60000))
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "local"
  const offset = formatOffset(-new Date().getTimezoneOffset())
  return [
    `Next ${found.length} run(s) for "${clean(a.expression)}" in ${zone} (UTC${offset}):`,
    "",
    ...found.map((d, i) => `${String(i + 1).padStart(2)}. ${localStamp(d)} ${zone}${gapText(gaps[i]) ? ` (${gapText(gaps[i])})` : ""}`),
    "",
    `Weekdays: ${found.map((d) => DAYS[d.getDay()]).join(", ")}`,
    "Cron fields are matched against local time on this machine.",
  ].join("\n")
}

function localStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+"
  const abs = Math.abs(minutes)
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`
}

function gapText(gap: number | null): string {
  if (gap === null) return "first"
  if (gap < 90) return `+${gap} min`
  const hours = gap / 60
  if (hours < 48) return `+${Number(hours.toFixed(1))} h`
  return `+${Number((hours / 24).toFixed(1))} days`
}

export async function parseCron(a: { expression: string }): Promise<string> {
  const s = parseSchedule(a.expression)
  const rows = [
    ["minute", s.minute],
    ["hour", s.hour],
    ["day-of-month", s.dom],
    ["month", s.month],
    ["day-of-week", s.dow],
  ] as Array<[string, Field]>
  return [
    `Fields for ${clean(a.expression)}:`,
    "",
    ...rows.map(([label, f]) => `- ${label}: ${f.wildcard ? "every value" : `${f.values.length} value(s) - ${f.values.join(", ")}`}`),
    "",
    "Several ranges, lists and steps are allowed per field, e.g. 0,30 8-10/2 * * MON-FRI.",
  ].join("\n")
}
