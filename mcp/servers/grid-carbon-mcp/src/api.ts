/**
 * National Grid ESO Carbon Intensity — keyless public API client.
 */
const BASE = "https://api.carbonintensity.org.uk"
const SOURCE = "Carbon Intensity"
const UA = "grid-carbon-mcp"

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

export async function current_intensity(a: Record<string, never>): Promise<string> {
  const d = await getJson("/intensity")
  const x = Array.isArray(d?.data) ? d.data[0] : undefined
  if (!x) throw new SourceError("Carbon Intensity API returned no data")
  return section(`${clean(x.from)} → ${clean(x.to)}`, [
    bullet("Actual", `${clean(x.intensity?.actual)} gCO2/kWh`),
    bullet("Forecast", `${clean(x.intensity?.forecast)} gCO2/kWh`),
    bullet("Index", x.intensity?.index),
  ])
}

export async function generation_mix(a: Record<string, never>): Promise<string> {
  const d = await getJson("/generation")
  const x = d?.data
  if (!x) throw new SourceError("Carbon Intensity API returned no generation data")
  const mix: any[] = Array.isArray(x.generationmix) ? x.generationmix : []
  return section(`Generation mix ${clean(x.from)} → ${clean(x.to)}`, mix.map((m) => `${clean(m.fuel)}: ${clean(m.perc)}%`))
}

export async function intensity_history(a: { from: string, to: string }): Promise<string> {
  const from = clean(a.from)
  const to = clean(a.to)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/.test(from) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/.test(to)) throw new SourceError("from and to must look like 2026-10-27T00:00Z")
  const d = await getJson(`/intensity/${from}/${to}`)
  const list: any[] = Array.isArray(d?.data) ? d.data : []
  if (!list.length) return `No intensity data between ${from} and ${to}.`
  return section(`${list.length} half-hour period(s)`, list.slice(0, 48).map((x) => `${clean(x.from)} · actual ${clean(x.intensity?.actual)} · forecast ${clean(x.intensity?.forecast)} gCO2/kWh (${clean(x.intensity?.index)})`))
}

export async function intensity_for_date(a: { date: string }): Promise<string> {
  const date = clean(a.date)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new SourceError("date must be YYYY-MM-DD")
  const d = await getJson(`/intensity/date/${date}`)
  const list: any[] = Array.isArray(d?.data) ? d.data : []
  if (!list.length) return `No intensity data for ${date}.`
  const nums = list.map((x) => Number(x.intensity?.actual)).filter((n) => Number.isFinite(n))
  const avg = nums.length ? Math.round(nums.reduce((s, n) => s + n, 0) / nums.length) : undefined
  return section(`${date}: ${list.length} periods, average ${avg ?? "?"} gCO2/kWh`, list.slice(0, 48).map((x) => `${clean(x.from).slice(11, 16)} · ${clean(x.intensity?.actual)} (${clean(x.intensity?.index)})`))
}

export async function regional_intensity(a: Record<string, never>): Promise<string> {
  const d = await getJson("/regional")
  const x = Array.isArray(d?.data) ? d.data[0] : undefined
  const regions: any[] = Array.isArray(x?.regions) ? x.regions : []
  if (!regions.length) throw new SourceError("Carbon Intensity API returned no regions")
  return section(`${regions.length} regions at ${clean(x.from)}`, regions.map((r) => `${clean(r.shortname)}: forecast ${clean(r.intensity?.forecast)} (${clean(r.intensity?.index)})`))
}
