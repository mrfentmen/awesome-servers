/**
 * TeleGeography Submarine Cable Map — keyless public API client.
 */
const BASE = "https://www.submarinecablemap.com"
const SOURCE = "TeleGeography"
const UA = "submarine-cables-mcp"

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

export async function list_cables(a: { limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 30, 100)
  const d = await getJson("/api/v3/cable/all.json")
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) throw new SourceError("No cables returned")
  return section(`${rows.length} submarine cable(s), showing ${Math.min(limit, rows.length)}`, rows.slice(0, limit).map((c, i) => `${i + 1}. ${clean(c.name)} (${clean(c.id)})`))
}

export async function search_cables(a: { query: string, limit?: number }): Promise<string> {
  const q = clean(a.query).toLowerCase()
  if (q.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = clampLimit(a.limit, 10, 50)
  const d = await getJson("/api/v3/cable/all.json")
  const rows: any[] = (Array.isArray(d) ? d : []).filter((c: any) => clean(c.name).toLowerCase().includes(q) || clean(c.id).includes(q))
  if (!rows.length) return `No cables match "${a.query}".`
  return section(`${rows.length} cable(s) matching "${a.query}"`, rows.slice(0, limit).map((c, i) => `${i + 1}. ${clean(c.name)} (${clean(c.id)})`))
}

export async function cable_detail(a: { id: string }): Promise<string> {
  const id = clean(a.id).toLowerCase()
  if (!/^[a-z0-9-]{2,80}$/.test(id)) throw new SourceError("id must be a cable slug")
  const d = await getJson(`/api/v3/cable/${encodeURIComponent(id)}.json`)
  if (!d?.name) throw new SourceError(`No cable ${id}`)
  const points: any[] = Array.isArray(d.landing_points) ? d.landing_points : []
  return section(`${clean(d.name)} (${clean(d.id)})`, [
    bullet("Length", d.length),
    bullet("Landing points", points.length),
    bullet("Countries", [...new Set(points.map((p) => clean(p.country)).filter(Boolean))].slice(0, 12).join(", ")),
    bullet("Owners", Array.isArray(d.owners) ? d.owners.map((o: any) => clean(o.name)).join(", ") : ""),
    bullet("Ready for service", d.rfs),
  ])
}

export async function cable_landing_points(a: { id: string, limit?: number }): Promise<string> {
  const id = clean(a.id).toLowerCase()
  const limit = clampLimit(a.limit, 25, 60)
  const d = await getJson(`/api/v3/cable/${encodeURIComponent(id)}.json`)
  const points: any[] = Array.isArray(d?.landing_points) ? d.landing_points : []
  if (!points.length) throw new SourceError(`No landing points for ${id}`)
  return section(`${points.length} landing point(s) for ${clean(d.name)}`, points.slice(0, limit).map((p, i) => `${i + 1}. ${clean(p.name)} · ${clean(p.country)}${p.is_tbd ? " · TBD" : ""}`))
}

export async function cable_route(a: { id: string }): Promise<string> {
  const id = clean(a.id).toLowerCase()
  const d = await getJson("/api/v3/cable/cable-geo.json")
  const features: any[] = Array.isArray(d?.features) ? d.features : []
  const f = features.find((x: any) => clean(x?.properties?.id) === id)
  if (!f) throw new SourceError(`No route geometry for ${id}`)
  const lines: any[] = Array.isArray(f.geometry?.coordinates) ? f.geometry.coordinates : []
  if (!lines.length) return `${clean(f.properties?.name)} runs overland or has no plotted route.`
  const first = lines[0]?.[0] ?? lines[0]
  const last = lines[lines.length - 1]?.[lines[lines.length - 1].length - 1] ?? lines[lines.length - 1]
  return section(`${clean(f.properties?.name)} route`, [
    bullet("Segments", lines.length),
    bullet("Points", lines.reduce((n: number, l: any) => n + (Array.isArray(l) ? l.length : 0), 0)),
    bullet("Start", Array.isArray(first) ? `${first[1]}, ${first[0]}` : "?"),
    bullet("End", Array.isArray(last) ? `${last[1]}, ${last[0]}` : "?"),
  ])
}
