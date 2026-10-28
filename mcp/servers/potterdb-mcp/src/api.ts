/**
 * Potter DB — keyless public API client.
 */
const BASE = "https://api.potterdb.com/v1"
const SOURCE = "Potter DB"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "potterdb-mcp", accept },
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

export async function getJson(path: string, accept = "application/json", timeoutMs = 25000): Promise<any> {
  const res = await request(path, accept, timeoutMs)
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

// Bracket query parameters must stay percent-encoded; the API rejects raw [ ].
const CHAR_FILTER = "filter%5Bname_cont%5D="
const PAGE_SIZE = "&page%5Bsize%5D="

function nameList(value: unknown, max = 6): string {
  if (!Array.isArray(value)) return ""
  return value
    .map((v: any) => clean(typeof v === "string" ? v : v?.name ?? v?.slug ?? ""))
    .filter(Boolean)
    .slice(0, max)
    .join(", ")
}

function wandList(value: unknown): string {
  if (!Array.isArray(value)) return ""
  return value
    .map((w: any) => [clean(w?.wood), clean(w?.core), clean(w?.length)].filter(Boolean).join(" "))
    .filter(Boolean)
    .join("; ")
}

export async function searchCharacters(a: { name: string; limit?: number }): Promise<string> {
  const name = clean(a.name)
  if (name.length < 2) throw new SourceError("name must be at least 2 characters")
  const limit = clampLimit(a.limit, 10, 25)
  const body = await getJson(
    `/characters?${CHAR_FILTER}${encodeURIComponent(name)}${PAGE_SIZE}${limit}`,
    "application/json",
    30000
  )
  const rows: any[] = Array.isArray(body?.data) ? body.data : []
  if (!rows.length) throw new SourceError(`Potter DB has no character whose name contains "${name}"`)
  const total = body?.meta?.pagination?.records
  return [
    `${total ?? rows.length} character(s) match "${name}" (showing ${rows.length}):`,
    "",
    ...rows.map((r: any) => {
      const attr = r?.attributes ?? {}
      const who = [clean(attr.house), clean(attr.species), clean(attr.born)].filter(Boolean).join(" · ")
      return `${clean(attr.slug || r?.id)}\n  ${clean(attr.name)}${who ? ` — ${who}` : ""}`
    }),
    "",
    "Pass a slug to character_detail for the full profile.",
  ].join("\n")
}

export async function characterDetail(a: { slug: string }): Promise<string> {
  const slug = clean(a.slug).toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{1,80}$/.test(slug)) throw new SourceError(`"${a.slug}" is not a valid character slug`)
  let body: any
  try {
    body = await getJson(`/characters/${encodeURIComponent(slug)}`, "application/json", 30000)
  } catch (e) {
    if (e instanceof SourceError && / 404$/.test(e.message)) throw new SourceError(`Potter DB has no character with slug "${slug}"`)
    throw e
  }
  const at = body?.data?.attributes
  if (!at) throw new SourceError(`Potter DB has no character with slug "${slug}"`)
  return [
    `${clean(at.name)} (${clean(at.slug)})`,
    "",
    ...[
      bullet("house", at.house),
      bullet("species", at.species),
      bullet("gender", at.gender),
      bullet("born", at.born),
      bullet("died", at.died),
      bullet("blood status", at.blood_status),
      bullet("patronus", at.patronus),
      bullet("boggart", at.boggart),
      bullet("animagus", at.animagus),
      bullet("nationality", at.nationality),
      bullet("hair / eyes", [clean(at.hair_color), clean(at.eye_color)].filter(Boolean).join(" / ") || ""),
      bullet("wands", wandList(at.wands)),
      bullet("titles", nameList(at.titles)),
      bullet("aliases", nameList(at.alias_names, 4)),
      bullet("family", nameList(at.family_members)),
      bullet("wiki", at.wiki),
    ].filter(Boolean),
  ].join("\n")
}

export async function searchSpells(a: { query: string; limit?: number }): Promise<string> {
  const query = clean(a.query)
  if (query.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = clampLimit(a.limit, 10, 25)
  // Spell names are like "Levitation Charm" while incantations are like
  // "Wingardium Leviosa", so search the name first and fall back to incantation.
  const byParam = async (param: string) => {
    const body = await getJson(
      `/spells?filter%5B${param}_cont%5D=${encodeURIComponent(query)}${PAGE_SIZE}${limit}`,
      "application/json",
      30000
    )
    return Array.isArray(body?.data) ? body.data : []
  }
  let rows = await byParam("name")
  let matchedBy = "name"
  if (!rows.length) {
    rows = await byParam("incantation")
    matchedBy = "incantation"
  }
  if (!rows.length) throw new SourceError(`Potter DB has no spell matching "${query}" by name or incantation`)
  return [
    `${rows.length} spell(s) matching "${query}" by ${matchedBy} (showing ${rows.length}):`,
    "",
    ...rows.map((r: any, i: number) => {
      const at = r?.attributes ?? {}
      const parts = [clean(at.incantation) ? `"${clean(at.incantation)}"` : "", clean(at.category)].filter(Boolean)
      return `${String(i + 1).padStart(3)}. ${clean(at.name)}${parts.length ? ` — ${parts.join(" · ")}` : ""}\n     ${clean(at.effect).slice(0, 180)}`
    }),
  ].join("\n")
}

export async function listBooks(a: { limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 8, 20)
  const body = await getJson(`/books?page%5Bsize%5D=${limit}`, "application/json", 30000)
  const rows: any[] = Array.isArray(body?.data) ? body.data : []
  if (!rows.length) throw new SourceError("Potter DB returned no books")
  return [
    `${body?.meta?.pagination?.records ?? rows.length} book(s) on record (showing ${rows.length}):`,
    "",
    ...rows.map((r: any) => {
      const at = r?.attributes ?? {}
      return `${clean(at.title)}\n  ${clean(at.release_date)}${at.pages ? ` · ${at.pages} pages` : ""}${at.author ? ` · by ${clean(at.author)}` : ""}\n  ${clean(at.summary).slice(0, 180)}`
    }),
  ].join("\n")
}
