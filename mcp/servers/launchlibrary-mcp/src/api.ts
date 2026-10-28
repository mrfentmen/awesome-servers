/**
 * Launch Library 2 — keyless public API client.
 */
const BASE = "https://ll.thespacedevs.com/2.2.0"
const SOURCE = "Launch Library 2"
const UA = "launchlibrary-mcp"

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

export async function upcoming_launches(a: { limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 5, 20)
  const d = await getJson(`/launch/upcoming/?limit=${limit}&mode=detailed`)
  const list: any[] = Array.isArray(d?.results) ? d.results : []
  if (!list.length) return "No upcoming launches are listed."
  return list.map((l, i) => section(`${i + 1}. ${clean(l.name)}`, [
    bullet("NET", l.net),
    bullet("Status", l.status?.name),
    bullet("Vehicle", l.rocket?.configuration?.full_name),
    bullet("Pad", [l.pad?.name, l.pad?.location?.name].filter(Boolean).join(" — ")),
    bullet("Provider", l.launch_service_provider?.name),
  ])).join("\n\n")
}

export async function launch_by_id(a: { id: string }): Promise<string> {
  const id = clean(a.id)
  if (id.length < 3) throw new SourceError("id is required")
  const l = await getJson(`/launch/${encodeURIComponent(id)}/`)
  if (!l?.id) throw new SourceError(`Launch Library has no launch ${id}`)
  return section(`${clean(l.name)}`, [
    bullet("Status", l.status?.name),
    bullet("NET", l.net),
    bullet("Window", `${clean(l.window_start)} → ${clean(l.window_end)}`),
    bullet("Vehicle", l.rocket?.configuration?.full_name),
    bullet("Pad", [l.pad?.name, l.pad?.location?.name].filter(Boolean).join(" — ")),
    bullet("Provider", l.launch_service_provider?.name),
    bullet("Mission", l.mission?.name),
    bullet("Description", clean(l.mission?.description || l.failreason)),
  ])
}

export async function search_launches(a: { query: string, limit?: number }): Promise<string> {
  const query = clean(a.query)
  if (query.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = clampLimit(a.limit, 5, 20)
  const d = await getJson(`/launch/?search=${encodeURIComponent(query)}&limit=${limit}`)
  const list: any[] = Array.isArray(d?.results) ? d.results : []
  if (!list.length) return `No launch matches "${query}".`
  return section(`${d?.count ?? list.length} launch(es) match "${query}"`, list.map((l, i) => `${i + 1}. ${clean(l.name)} · ${clean(l.net)} · ${clean(l.status?.name)}`))
}

export async function agencies(a: { limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 20, 50)
  const d = await getJson(`/agencies/?limit=${limit}`)
  const list: any[] = Array.isArray(d?.results) ? d.results : []
  if (!list.length) return "No agencies returned."
  return section(`${d?.count ?? list.length} agencies in the database`, list.map((x, i) => `${i + 1}. ${clean(x.name)}${x.abbrev ? " (" + clean(x.abbrev) + ")" : ""} · ${clean(x.type)} · ${clean(x.country_code)}`))
}

export async function pads(a: { limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 20, 50)
  const d = await getJson(`/pad/?limit=${limit}`)
  const list: any[] = Array.isArray(d?.results) ? d.results : []
  if (!list.length) return "No pads returned."
  return section(`${d?.count ?? list.length} launch pads`, list.map((p, i) => `${i + 1}. ${clean(p.name)} · ${clean(p.location?.name)} · ${clean(p.latitude)}, ${clean(p.longitude)}`))
}

export async function events(a: { limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 20)
  const d = await getJson(`/event/?limit=${limit}`)
  const list: any[] = Array.isArray(d?.results) ? d.results : []
  if (!list.length) return "No events returned."
  return section(`${d?.count ?? list.length} space events`, list.map((e, i) => `${i + 1}. ${clean(e.name)} · ${clean(e.date)} · ${clean(e.type?.name)}`))
}
