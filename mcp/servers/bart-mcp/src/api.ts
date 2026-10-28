/**
 * BART — keyless public API client.
 */
const BASE = "https://api.bart.gov/api"
const SOURCE = "BART"
const UA = "bart-mcp"

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

const KEY = "MW9S-E7SL-26DU-VV8V"
function arr(x: any): any[] {
  return Array.isArray(x) ? x : x ? [x] : []
}

export async function departures(a: { station: string }): Promise<string> {
  const station = clean(a.station).toUpperCase()
  if (!/^[A-Z0-9]{2,6}$/.test(station)) throw new SourceError("station must be a BART abbreviation")
  const d = await getJson(`/etd.aspx?cmd=etd&orig=${encodeURIComponent(station)}&key=${KEY}&json=y`)
  const st = arr(d?.root?.station)[0]
  if (!st) throw new SourceError(`BART has no station ${station}`)
  const rows: string[] = []
  for (const e of arr(st.etd)) {
    const est = arr(e.estimate).slice(0, 3).map((x: any) => `${clean(x.minutes)} min`)
    rows.push(`${clean(e.destination)}: ${est.join(", ")}`)
  }
  if (!rows.length) return `No departures listed for ${clean(st.name)}.`
  return section(`${clean(st.name)} — ${clean(d.root.date)} ${clean(d.root.time)}`, rows)
}

export async function stations(a: Record<string, never>): Promise<string> {
  const d = await getJson(`/stn.aspx?cmd=stns&key=${KEY}&json=y`)
  const list = arr(d?.root?.stations?.station)
  if (!list.length) throw new SourceError("BART returned no stations")
  return section(`${list.length} stations`, list.map((s, i) => `${i + 1}. ${clean(s.name)} (${clean(s.abbr)}) · ${clean(s.gtfs_latitude)}, ${clean(s.gtfs_longitude)}`))
}

export async function routes(a: Record<string, never>): Promise<string> {
  const d = await getJson(`/route.aspx?cmd=routes&key=${KEY}&json=y`)
  const list = arr(d?.root?.routes?.route)
  if (!list.length) throw new SourceError("BART returned no routes")
  return section(`${list.length} routes`, list.map((r, i) => `${i + 1}. ${clean(r.name)} · route ${clean(r.number)} · ${clean(r.hexcolor)}`))
}

export async function advisories(a: Record<string, never>): Promise<string> {
  const d = await getJson(`/bsa.aspx?cmd=bsa&key=${KEY}&json=y`)
  const list = arr(d?.root?.bsa)
  if (!list.length) return "No BART advisories right now."
  return section(`${list.length} advisory(ies)`, list.map((x, i) => `${i + 1}. ${clean(x.type)} · ${clean(x.station)}\n   ${clean(x.description?.["#cdata-section"] || x.description)}`))
}

export async function station_info(a: { station: string }): Promise<string> {
  const station = clean(a.station).toUpperCase()
  const d = await getJson(`/stn.aspx?cmd=stninfo&orig=${encodeURIComponent(station)}&key=${KEY}&json=y`)
  const s = arr(d?.root?.stations?.station)[0]
  if (!s) throw new SourceError(`BART has no station ${station}`)
  return section(clean(s.name), [
    bullet("Abbreviation", s.abbr),
    bullet("Address", [s.address, s.city, s.county, s.state, s.zipcode].filter(Boolean).map(clean).join(", ")),
    bullet("Coordinates", `${clean(s.gtfs_latitude)}, ${clean(s.gtfs_longitude)}`),
    bullet("Platforms", s.platform_info),
    bullet("Transit", s.transit_info),
  ])
}
