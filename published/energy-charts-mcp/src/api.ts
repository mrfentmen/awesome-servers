/**
 * Energy-Charts (Fraunhofer ISE) — keyless public API client.
 */
const BASE = "https://api.energy-charts.info"
const SOURCE = "Energy-Charts"
const UA = "energy-charts-mcp"

export class SourceError extends Error {}

async function request(path: string, init?: RequestInit, timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "user-agent": UA,
        accept: "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
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

export async function getJson(path: string, init?: RequestInit): Promise<any> {
  const res = await request(path, init)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, init?: RequestInit): Promise<string> {
  const res = await request(path, init)
  return await res.text()
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

function latestIndex(values: number[]): number {
  for (let i = values.length - 1; i >= 0; i--) if (Number.isFinite(values[i])) return i
  return values.length - 1
}

function mw(n: unknown): string {
  const v = Number(n)
  return Number.isFinite(v) ? `${v.toFixed(0)} MW` : "?"
}

export async function power_mix(a: { country?: string, limit?: number }): Promise<string> {
  const country = clean(a.country || "de").toLowerCase()
  if (!/^[a-z]{2}$/.test(country)) throw new SourceError("country must be two letters")
  const limit = clampLimit(a.limit, 12, 25)
  const d = await getJson(`/public_power?country=${country}`)
  const series: any[] = Array.isArray(d?.production_types) ? d.production_types : []
  if (!series.length) throw new SourceError(`No generation data for ${country}`)
  const idx = latestIndex(series[0]?.data ?? [])
  const rows = series
    .map((s) => ({ name: clean(s.name), value: Number(s.data?.[idx] ?? 0) }))
    .filter((s) => Number.isFinite(s.value) && s.value > 0)
    .sort((x, y) => y.value - x.value)
  const total = rows.reduce((n, r) => n + r.value, 0)
  const when = d?.unix_seconds?.[idx] ? new Date(Number(d.unix_seconds[idx]) * 1000).toISOString() : "latest"
  return section(`${country.toUpperCase()} generation mix at ${when} · total ${mw(total)}`, rows.slice(0, limit).map((r, i) => `${i + 1}. ${r.name}: ${mw(r.value)} (${((r.value / total) * 100).toFixed(1)}%)`))
}

export async function day_ahead_price(a: { bzn?: string, limit?: number }): Promise<string> {
  const bzn = clean(a.bzn || "DE-LU").toUpperCase()
  const limit = clampLimit(a.limit, 8, 48)
  const d = await getJson(`/price?bzn=${encodeURIComponent(bzn)}`)
  const prices: number[] = Array.isArray(d?.price) ? d.price : []
  if (!prices.length) throw new SourceError(`No price data for ${bzn}`)
  const unit = clean(d.unit) || "EUR / MWh"
  const times: number[] = Array.isArray(d.unix_seconds) ? d.unix_seconds : []
  const idx = latestIndex(prices)
  const start = Math.max(0, idx - limit + 1)
  const lines: string[] = []
  for (let i = start; i <= idx; i++) {
    const t = times[i] ? new Date(Number(times[i]) * 1000).toISOString().slice(5, 16).replace("T", " ") : `#${i}`
    lines.push(`${t} · ${Number(prices[i]).toFixed(2)} ${unit}`)
  }
  return section(`${bzn} day-ahead prices`, lines.reverse())
}

export async function installed_power(a: { country?: string, limit?: number }): Promise<string> {
  const country = clean(a.country || "de").toLowerCase()
  const limit = clampLimit(a.limit, 12, 25)
  const d = await getJson(`/installed_power?country=${country}`)
  const series: any[] = Array.isArray(d?.production_types) ? d.production_types : []
  const years: string[] = Array.isArray(d?.time) ? d.time : []
  if (!series.length) throw new SourceError(`No installed capacity for ${country}`)
  const nowYear = new Date().getUTCFullYear()
  let idx = years.length - 1
  for (let i = 0; i < years.length; i++) {
    if (Number(years[i]) <= nowYear) idx = i
  }
  const year = years[idx] ?? "latest"
  const rows = series.map((s) => ({ name: clean(s.name), value: Number(s.data?.[idx] ?? 0) }))
    .filter((s) => Number.isFinite(s.value))
    .sort((x, y) => y.value - x.value)
  return section(`${country.toUpperCase()} installed capacity in ${year}`, rows.slice(0, limit).map((r, i) => `${i + 1}. ${r.name}: ${mw(r.value)}`))
}

export async function renewable_share(a: { country?: string }): Promise<string> {
  const country = clean(a.country || "de").toLowerCase()
  const d = await getJson(`/ren_share_forecast?country=${country}`)
  const share: number[] = Array.isArray(d?.ren_share) ? d.ren_share : []
  if (!share.length) throw new SourceError(`No renewable share data for ${country}`)
  const idx = latestIndex(share)
  const pct = (v: unknown) => (Number.isFinite(Number(v)) ? `${Number(v).toFixed(1)}%` : "?")
  const when = d?.unix_seconds?.[idx] ? new Date(Number(d.unix_seconds[idx]) * 1000).toISOString() : "latest"
  return section(`${country.toUpperCase()} renewable share at ${when}`, [
    bullet("Renewable share", pct(share[idx])),
    bullet("Solar", pct(d?.solar_share?.[idx])),
    bullet("Wind onshore", pct(d?.wind_onshore_share?.[idx])),
    bullet("Wind offshore", pct(d?.wind_offshore_share?.[idx])),
  ])
}

export async function power_series(a: { country?: string, start: string, end: string, limit?: number }): Promise<string> {
  const country = clean(a.country || "de").toLowerCase()
  const limit = clampLimit(a.limit, 8, 20)
  const d = await getJson(`/public_power?country=${country}&start=${a.start}&end=${a.end}`)
  const series: any[] = Array.isArray(d?.production_types) ? d.production_types : []
  if (!series.length) throw new SourceError(`No generation data for ${country} between ${a.start} and ${a.end}`)
  const rows = series.map((s) => {
    const nums: number[] = Array.isArray(s.data) ? s.data.map(Number).filter((n: number) => Number.isFinite(n)) : []
    const avg = nums.length ? nums.reduce((x, y) => x + y, 0) / nums.length : NaN
    return { name: clean(s.name), avg, n: nums.length }
  }).filter((s) => Number.isFinite(s.avg) && s.avg > 0).sort((x, y) => y.avg - x.avg)
  return section(`${country.toUpperCase()} average generation ${a.start} to ${a.end}`, rows.slice(0, limit).map((r, i) => `${i + 1}. ${r.name}: ${r.avg.toFixed(0)} MW avg over ${r.n} intervals`))
}
