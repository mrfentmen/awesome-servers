/**
 * Rick and Morty API — keyless public API client.
 */
const BASE = "https://rickandmortyapi.com"
const SOURCE = "Rick and Morty API"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "rickandmorty-mcp", accept },
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

function slice<T>(rows: T[], limit: number): T[] {
  return rows.slice(0, limit)
}

export async function searchCharacters(a: { name?: string; status?: string; species?: string; limit?: number }): Promise<string> {
  const limit = a.limit ?? 5
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new SourceError("limit must be between 1 and 20")
  const params = new URLSearchParams()
  if (a.name) params.set("name", clean(a.name))
  if (a.status) params.set("status", clean(a.status).toLowerCase())
  if (a.species) params.set("species", clean(a.species))
  if (a.status && !["alive", "dead", "unknown"].includes(clean(a.status).toLowerCase())) throw new SourceError("status must be alive, dead or unknown")
  if (![...params.keys()].length) throw new SourceError("give at least one of name, status or species")
  const d = await getJson(`/api/character/?${params.toString()}`)
  const rows: any[] = d?.results ?? []
  if (!rows.length) return `No character matches ${params.toString()}.`
  return [
    `${d.info?.count ?? rows.length} character(s) match, showing ${Math.min(limit, rows.length)}:`,
    "",
    ...slice(rows, limit).map((c) => `- ${clean(c.name)} (id ${c.id}) · ${clean(c.status)} ${clean(c.species)}${c.type ? `/${clean(c.type)}` : ""} · ${clean(c.gender)} · from ${clean(c.origin?.name) || "unknown"} · ${c.episode?.length ?? 0} episode(s)`),
  ].join("\n")
}

export async function characterDetail(a: { id: number }): Promise<string> {
  if (!Number.isInteger(a.id) || a.id < 1 || a.id > 1000) throw new SourceError("id must be between 1 and 1000")
  const c = await getJson(`/api/character/${a.id}`)
  if (!c || !c.name) throw new SourceError(`No character with id ${a.id}`)
  const episodes: string[] = Array.isArray(c.episode) ? c.episode : []
  return [
    `${clean(c.name)} (id ${c.id})`,
    `Status: ${clean(c.status)} · species: ${clean(c.species)}${c.type ? ` (${clean(c.type)})` : ""} · gender: ${clean(c.gender)}`,
    `Origin: ${clean(c.origin?.name) || "unknown"} · last seen: ${clean(c.location?.name) || "unknown"}`,
    `Episodes: ${episodes.length}${episodes.length ? ` - first ${episodes[0].split("/").pop()}, last ${episodes[episodes.length - 1].split("/").pop()}` : ""}`,
    c.image ? `Image: ${clean(c.image)}` : "",
    `Record: ${clean(c.url)}`,
  ].filter(Boolean).join("\n")
}

export async function searchLocations(a: { name: string; limit?: number }): Promise<string> {
  const name = clean(a.name)
  if (name.length < 2) throw new SourceError("name must be at least 2 characters")
  const limit = a.limit ?? 5
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new SourceError("limit must be between 1 and 20")
  const d = await getJson(`/api/location/?name=${encodeURIComponent(name)}`)
  const rows: any[] = d?.results ?? []
  if (!rows.length) return `No location matches "${name}".`
  return [
    `${d.info?.count ?? rows.length} location(s) match "${name}", showing ${Math.min(limit, rows.length)}:`,
    "",
    ...slice(rows, limit).map((l) => `- ${clean(l.name)} (id ${l.id}) · ${clean(l.type) || "type unknown"} · ${clean(l.dimension) || "dimension unknown"} · ${l.residents?.length ?? 0} resident(s)`),
  ].join("\n")
}

export async function searchEpisodes(a: { name: string; limit?: number }): Promise<string> {
  const name = clean(a.name)
  if (name.length < 2) throw new SourceError("name must be at least 2 characters")
  const limit = a.limit ?? 5
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new SourceError("limit must be between 1 and 20")
  const d = await getJson(`/api/episode/?name=${encodeURIComponent(name)}`)
  const rows: any[] = d?.results ?? []
  if (!rows.length) return `No episode matches "${name}".`
  return [
    `${d.info?.count ?? rows.length} episode(s) match "${name}", showing ${Math.min(limit, rows.length)}:`,
    "",
    ...slice(rows, limit).map((e) => `- ${clean(e.episode)} ${clean(e.name)} · aired ${clean(e.air_date) || "?"} · ${e.characters?.length ?? 0} characters`),
  ].join("\n")
}
