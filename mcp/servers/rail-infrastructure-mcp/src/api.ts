/**
 * USDOT BTS rail data — keyless public API client.
 */
const BASE = "https://datahub.transportation.gov"
const SOURCE = "USDOT BTS"
const UA = "rail-infrastructure-mcp"

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

const CROSSINGS = "/resource/fccg-bjqh.json"
const BRIDGES = "/resource/bvag-c3cn.json"

function num(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function crossingLine(r: any, i: number): string {
  return `${i + 1}. ${clean(r.crossing)} · ${clean(r.railroad)} · ${clean(r.street) || clean(r.highway)} · ${clean(r.cityname)}, ${clean(r.statename)} · AADT ${clean(r.aadt) || "?"}`
}

function bridgeLine(r: any, i: number): string {
  return `${i + 1}. ${clean(r.uniqueid)} · ${clean(r.name) || "unnamed"} · ${clean(r.rrowner)} · ${clean(r.county)}, ${clean(r.state)} · ${clean(r.bridge_type)}`
}

export async function crossings_by_state(a: { state: string, limit?: number }): Promise<string> {
  const st = clean(a.state).toUpperCase()
  if (!/^[A-Z]{2}$/.test(st)) throw new SourceError("state must be two letters")
  const limit = clampLimit(a.limit, 15, 50)
  const where = encodeURIComponent(`stateab='${st}'`)
  const d = await getJson(`${CROSSINGS}?$limit=${limit}&$where=${where}&$order=crossing`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `No rail crossings found for ${st}.`
  return section(`${rows.length} crossing(s) in ${st}`, rows.map(crossingLine))
}

export async function crossing_detail(a: { crossingId: string }): Promise<string> {
  const id = clean(a.crossingId).toUpperCase()
  if (!/^[0-9A-Z]{6,8}$/.test(id)) throw new SourceError("crossingId looks invalid")
  const where = encodeURIComponent(`crossing='${id}'`)
  const d = await getJson(`${CROSSINGS}?$limit=1&$where=${where}`)
  const r = Array.isArray(d) ? d[0] : null
  if (!r) throw new SourceError(`No crossing ${id}`)
  return section(`Crossing ${clean(r.crossing)}`, [
    bullet("Railroad", [r.railroad, r.rrdiv, r.rrsubdiv].map(clean).filter(Boolean).join(" / ")),
    bullet("Location", [r.street, r.cityname, r.countyname, r.statename].map(clean).filter(Boolean).join(", ")),
    bullet("Milepost", r.milepost),
    bullet("Type", r.typexing),
    bullet("AADT", r.aadt),
    bullet("Trains per day", r.daythru),
    bullet("Whistle ban", r.whistban),
    bullet("Signals", r.signals),
    bullet("Last update", r.lastupdate),
    bullet("Coordinates", `${r.latitude}, ${r.longitude}`),
  ])
}

export async function bridges_by_state(a: { state: string, limit?: number }): Promise<string> {
  const st = clean(a.state).toUpperCase()
  if (!/^[A-Z]{2}$/.test(st)) throw new SourceError("state must be two letters")
  const limit = clampLimit(a.limit, 15, 50)
  const where = encodeURIComponent(`state='${st}'`)
  const d = await getJson(`${BRIDGES}?$limit=${limit}&$where=${where}&$order=uniqueid`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `No railroad bridges found for ${st}.`
  return section(`${rows.length} railroad bridge(s) in ${st}`, rows.map(bridgeLine))
}

export async function bridge_search(a: { query: string, limit?: number }): Promise<string> {
  const q = clean(a.query)
  if (q.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = clampLimit(a.limit, 15, 50)
  const d = await getJson(`${BRIDGES}?$limit=${limit}&$q=${encodeURIComponent(q)}`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `No railroad bridges match "${q}".`
  return section(`${rows.length} railroad bridge(s) matching "${q}"`, rows.map(bridgeLine))
}

export async function rail_summary(a: { state: string }): Promise<string> {
  const st = clean(a.state).toUpperCase()
  if (!/^[A-Z]{2}$/.test(st)) throw new SourceError("state must be two letters")
  const countOf = async (path: string, field: string) => {
    const where = encodeURIComponent(`${field}='${st}'`)
    const d = await getJson(`${path}?$select=count(*)&$where=${where}`)
    const row = Array.isArray(d) ? d[0] : null
    return num(row?.count) ?? 0
  }
  const crossings = await countOf(CROSSINGS, "stateab")
  const bridges = await countOf(BRIDGES, "state")
  return section(`Rail infrastructure in ${st}`, [
    bullet("Highway-rail crossings", crossings),
    bullet("Railroad bridges", bridges),
    bullet("Source", "USDOT Bureau of Transportation Statistics"),
  ])
}
