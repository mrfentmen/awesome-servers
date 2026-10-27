/**
 * Locale Format — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "Locale Format"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "locale-format-mcp", accept },
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

function localeOk(locale: string): string {
  const l = locale.trim()
  if (!/^[a-zA-Z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(l)) throw new SourceError(`"${locale}" is not a language tag like en-US`)
  try {
    new Intl.NumberFormat(l)
  } catch {
    throw new SourceError(`"${locale}" is not a locale this runtime knows`)
  }
  return l
}

function parseInstant(raw: string): Date {
  const d = new Date(raw.trim())
  if (Number.isNaN(d.getTime())) throw new SourceError(`"${raw}" is not a date or timestamp`)
  return d
}

export async function formatNumber(a: { value: number; locale: string; style: string; currency: string; unit: string; decimals?: number }): Promise<string> {
  const locale = localeOk(a.locale)
  if (!Number.isFinite(a.value)) throw new SourceError("value must be a finite number")
  const opts: Intl.NumberFormatOptions = { style: a.style as "decimal" | "currency" | "percent" | "unit" }
  if (a.style === "currency") {
    if (!/^[A-Za-z]{3}$/.test(a.currency)) throw new SourceError(`"${a.currency}" is not a 3-letter currency code`)
    opts.currency = a.currency.toUpperCase()
  }
  if (a.style === "unit") opts.unit = a.unit
  if (a.decimals !== undefined) {
    opts.minimumFractionDigits = a.decimals
    opts.maximumFractionDigits = a.decimals
  }
  let formatted: string
  try {
    formatted = new Intl.NumberFormat(locale, opts).format(a.value)
  } catch (e) {
    throw new SourceError(`cannot format: ${(e as Error).message}`)
  }
  return [
    `Locale: ${locale}`,
    `Style: ${a.style}`,
    `Formatted: ${formatted}`,
    `Parts: ${JSON.stringify(new Intl.NumberFormat(locale, opts).formatToParts(a.value).map((p) => [p.type, p.value]))}`,
  ].join("\n")
}

export async function formatDate(a: { value: string; locale: string; style: string; timeZone: string }): Promise<string> {
  const locale = localeOk(a.locale)
  const d = parseInstant(a.value)
  let formatted: string
  try {
    formatted = new Intl.DateTimeFormat(locale, { dateStyle: a.style as "short" | "medium" | "long" | "full", timeZone: a.timeZone }).format(d)
  } catch (e) {
    throw new SourceError(`cannot format date: ${(e as Error).message}`)
  }
  return [
    `Locale: ${locale}`,
    `Time zone: ${a.timeZone}`,
    `ISO: ${d.toISOString()}`,
    `Formatted: ${formatted}`,
  ].join("\n")
}

export async function formatRelative(a: { value: string; locale: string; base?: string }): Promise<string> {
  const locale = localeOk(a.locale)
  const d = parseInstant(a.value)
  const base = a.base ? parseInstant(a.base) : new Date()
  const diff = d.getTime() - base.getTime()
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000000], ["month", 2592000000], ["week", 604800000], ["day", 86400000],
    ["hour", 3600000], ["minute", 60000], ["second", 1000],
  ]
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  const [unit, size] = units.find(([, ms]) => Math.abs(diff) >= ms) ?? ["second", 1000]
  const value = Math.round(diff / size)
  return [
    `Locale: ${locale}`,
    `From: ${d.toISOString()}`,
    `To: ${base.toISOString()}`,
    `Relative: ${rtf.format(value, unit)}`,
  ].join("\n")
}
