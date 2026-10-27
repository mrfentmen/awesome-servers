/**
 * Star Wars API (SWAPI). Keyless. swapi.dev is primary, swapi.py4e.com is the
 * community mirror and is used when the primary does not answer.
 */
const HOSTS = ["https://swapi.dev/api", "https://swapi.py4e.com/api"]

export class SwapiError extends Error {}

async function getJson(path: string, timeoutMs = 20000): Promise<any> {
  let lastError = "unknown error"
  for (const host of HOSTS) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetch(`${host}${path}`, {
        signal: ctrl.signal,
        headers: { "user-agent": "swapi-mcp", accept: "application/json" },
      })
      if (res.status === 404) throw new SwapiError("Not found in SWAPI")
      if (!res.ok) throw new Error(`responded ${res.status}`)
      return await res.json()
    } catch (e) {
      if (e instanceof SwapiError) throw e
      lastError = (e as Error).message
    } finally {
      clearTimeout(timer)
    }
  }
  throw new SwapiError(`SWAPI is unreachable right now (${lastError})`)
}

export const RESOURCES = ["people", "planets", "films", "starships", "vehicles", "species"] as const
export type Resource = (typeof RESOURCES)[number]

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

function personLine(p: any, i?: number): string {
  const prefix = typeof i === "number" ? `${i + 1}. ` : "• "
  return `${prefix}${p.name} — born ${p.birth_year ?? "unknown"}, ${p.gender ?? "unknown"}, ${p.height ?? "?"}cm, ${p.mass ?? "?"}kg (${urlId(p.url)})`
}

function urlId(url: unknown): string {
  const m = String(url ?? "").match(/\/(\d+)\/?$/)
  return m ? `id ${m[1]}` : "id unknown"
}

const lineFor = (resource: Resource, row: any, i?: number): string => {
  const prefix = typeof i === "number" ? `${i + 1}. ` : "• "
  if (resource === "people") return personLine(row, i)
  if (resource === "films") return `${prefix}${row.title} — episode ${row.episode_id}, ${String(row.release_date).slice(0, 4)} (${urlId(row.url)})`
  if (resource === "planets") {
    return `${prefix}${row.name} — ${row.climate ?? "?"} climate, ${row.terrain ?? "?"}, population ${row.population ?? "unknown"} (${urlId(row.url)})`
  }
  if (resource === "starships" || resource === "vehicles") {
    return `${prefix}${row.name} — ${row.model ?? "?"}, ${row.manufacturer ?? "?"} (${urlId(row.url)})`
  }
  return `${prefix}${row.name} — ${row.classification ?? "?"}, ${row.language ?? "?"} (${urlId(row.url)})`
}

export async function search(resource: Resource, query: string, limit: number): Promise<string> {
  const q = query.trim()
  if (q.length < 2) throw new SwapiError("Search term must be at least 2 characters")
  const d = await getJson(`/${resource}/?search=${encodeURIComponent(q)}`)
  const rows: any[] = d?.results ?? []
  if (rows.length === 0) return `No ${resource} match "${query}".`
  return [
    `SWAPI ${resource} matching "${query}" (${plural(Number(d.count ?? rows.length), "result")}):`,
    "",
    ...rows.slice(0, limit).map((r, i) => lineFor(resource, r, i)),
  ].join("\n")
}

export async function detail(resource: Resource, id: number): Promise<string> {
  const d = await getJson(`/${resource}/${id}/`)
  if (resource === "people") {
    return [
      `${d.name} (people id ${id})`,
      `Born: ${d.birth_year} · height ${d.height}cm · mass ${d.mass}kg · ${d.gender}`,
      `Hair: ${d.hair_color} · Eyes: ${d.eye_color} · Skin: ${d.skin_color}`,
      "",
      `Homeworld: ${d.homeworld ?? "unknown"}`,
      `Films: ${(d.films ?? []).length} · Starships: ${(d.starships ?? []).length} · Vehicles: ${(d.vehicles ?? []).length}`,
      `Films: ${(d.films ?? []).map((f: string) => urlId(f)).join(", ") || "none listed"}`,
    ].join("\n")
  }
  if (resource === "films") {
    return [
      `${d.title} (episode ${d.episode_id})`,
      `Released ${d.release_date} · director ${d.director} · producer ${d.producer}`,
      "",
      `${String(d.opening_crawl ?? "").replace(/\s+/g, " ").trim()}`,
      "",
      `Characters: ${(d.characters ?? []).length} · Planets: ${(d.planets ?? []).length} · Starships: ${(d.starships ?? []).length} · Vehicles: ${(d.vehicles ?? []).length}`,
    ].join("\n")
  }
  const fields = Object.entries(d)
    .filter(([k, v]) => !Array.isArray(v) && k !== "url" && k !== "created" && k !== "edited" && typeof v !== "object")
    .map(([k, v]) => `  ${k.replace(/_/g, " ")}: ${v}`)
    .join("\n")
  return [`${(d.name ?? d.title) as string} (${resource} id ${id})`, "", fields].join("\n")
}

export async function listAll(resource: Resource, limit: number): Promise<string> {
  const d = await getJson(`/${resource}/?page=1`)
  const rows: any[] = d?.results ?? []
  if (rows.length === 0) return `SWAPI returned no ${resource}.`
  return [
    `${plural(Number(d.count ?? rows.length), resource.replace(/s$/, ""))} in SWAPI (first page of ${d.next ? "many" : "one"}):`,
    "",
    ...rows.slice(0, limit).map((r, i) => lineFor(resource, r, i)),
  ].join("\n")
}

export async function personFilms(id: number): Promise<string> {
  const p = await getJson(`/people/${id}/`)
  const urls: string[] = Array.isArray(p.films) ? p.films : []
  if (urls.length === 0) return `${p.name} has no films listed in SWAPI.`
  const titles = await Promise.all(
    urls.map(async (u) => {
      try {
        const f = await getJson(String(u).replace(/^https?:\/\/[^/]+\/api/, ""))
        return `Episode ${f.episode_id} — ${f.title} (${String(f.release_date).slice(0, 4)})`
      } catch {
        return String(u)
      }
    })
  )
  return [`${p.name} appears in ${titles.length} films:`, "", ...titles.map((t) => `• ${t}`)].join("\n")
}

export async function filmChronicle(): Promise<string> {
  const d = await getJson("/films/")
  const rows: any[] = d?.results ?? []
  const sorted = rows.slice().sort((a, b) => Number(a.episode_id) - Number(b.episode_id))
  return [
    "Star Wars films, in story order:",
    "",
    ...sorted.map((f, i) => `${i + 1}. Episode ${f.episode_id} — ${f.title} (${String(f.release_date).slice(0, 4)}), dir. ${f.director}`),
  ].join("\n")
}
