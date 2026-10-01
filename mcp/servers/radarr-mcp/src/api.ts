export class RadarrError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RadarrError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.RADARR_URL;
  if (!b) throw new RadarrError("Set RADARR_URL (your Radarr base URL).");
  return b.replace(/\/$/, "");
}

function key(): string {
  const k = process.env.RADARR_API_KEY;
  if (!k) throw new RadarrError("Set RADARR_API_KEY (Settings > General).");
  return k;
}

async function get(path: string): Promise<string> {
  const sep = path.includes("?") ? "&" : "?";
  let res: Response;
  try {
    res = await fetch(`${base()}${path}${sep}apikey=${encodeURIComponent(key())}`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(30000),
    });
  } catch (e) {
    throw new RadarrError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new RadarrError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listMovies(): Promise<string> {
  return get("/api/v3/movie");
}

export function getQueue(): Promise<string> {
  return get("/api/v3/queue?page=1&pageSize=20&includeUnknownMovieItems=true");
}

export function getHealth(): Promise<string> {
  return get("/api/v3/health");
}

// ---- muxH tools:
// The tools above read a running Radarr instance. These two read film metadata
// from Wikidata, keylessly: the structured facts a library has to match on
// before it will accept a file, and the filmography behind a person or a studio.

const WIKIDATA_API = "https://www.wikidata.org/w/api.php"
const RADARR_UA = "radarr-mcp/1.1 (https://github.com/mcfentmen/radarr-mcp; contact radarr-mcp@example.com)"

interface WdSearchHit {
  id?: string
  label?: string
  description?: string
  match?: { type?: string; language?: string; text?: string }
}

interface WdSearchResponse {
  search?: WdSearchHit[]
  searchinfo?: { searchinfo?: string }
}

interface WdEntity {
  id?: string
  labels?: Record<string, { value?: string }>
  descriptions?: Record<string, { value?: string }>
  aliases?: Record<string, Array<{ value?: string }>>
  claims?: Record<string, WdClaim[]>
  sitelinks?: Record<string, { title?: string }>
}

interface WdClaim {
  mainsnak?: { snaktype?: string; datavalue?: Record<string, unknown> }
  rank?: string
}

interface WdEntitiesResponse {
  entities?: Record<string, WdEntity>
}

async function wdGet<T>(params: Record<string, string>): Promise<T> {
  const url = `${WIKIDATA_API}?${new URLSearchParams({ format: "json", ...params })}`
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": RADARR_UA },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 429) throw new RadarrError("Wikidata rate-limited this host. Try again shortly.")
  if (!res.ok) throw new RadarrError(`Wikidata API error ${res.status}: ${res.statusText}`)
  const body = (await res.json()) as T & { error?: { info?: string } }
  if (body?.error) throw new RadarrError(`Wikidata rejected the query: ${body.error.info ?? "unknown reason"}`)
  return body
}

const claimValue = (entity: WdEntity, property: string): unknown =>
  entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value

const itemId = (value: unknown): string | null => {
  if (typeof value !== "object" || value === null) return null
  const id = (value as { id?: string }).id
  return typeof id === "string" ? id : null
}

const quantity = (value: unknown): number | null => {
  if (typeof value !== "object" || value === null) return null
  const amount = (value as { amount?: string }).amount
  if (typeof amount !== "string") return null
  const parsed = Number(amount)
  return Number.isFinite(parsed) ? parsed : null
}

const yearOf = (value: unknown): string | null => {
  if (typeof value !== "object" || value === null) return null
  const time = (value as { time?: string }).time
  if (typeof time !== "string") return null
  const match = /^([+-])(\d{4})-(\d{2})-(\d{2})/.exec(time)
  if (!match) return null
  return match[1] === "-" ? `${match[2]}-${match[3]}-${match[4]} BCE` : `${match[2]}-${match[3]}-${match[4]}`
}

const valueText = (value: unknown): string | null => {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return null
}

async function labelsFor(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)].filter(Boolean)
  if (!unique.length) return new Map()
  const data = await wdGet<WdEntitiesResponse>({
    action: "wbgetentities",
    ids: unique.join("|").slice(0, 400),
    props: "labels",
    languages: "en",
  })
  const out = new Map<string, string>()
  for (const [id, entity] of Object.entries(data.entities ?? {})) {
    const label = entity.labels?.en?.value
    if (label) out.set(id, label)
  }
  return out
}

async function findFilm(title: string, year?: string): Promise<{ id: string; label: string; description: string }> {
  // The search endpoint matches on the label, so the title alone is the query;
  // a year is only used to prefer a hit whose description names that year.
  const data = await wdGet<WdSearchResponse>({
    action: "wbsearchentities",
    search: title,
    language: "en",
    uselang: "en",
    limit: "8",
  })
  const hits = data.search ?? []
  if (!hits.length) throw new RadarrError(`Wikidata has nothing matching "${title}".`)
  const byYear = year ? hits.find((hit) => String(hit.description ?? "").includes(year)) : undefined
  const exact =
    byYear ??
    hits.find((hit) => (hit.label ?? "").toLowerCase() === title.trim().toLowerCase()) ??
    hits[0]
  if (!exact.id || !exact.label) throw new RadarrError(`Wikidata returned no usable item for "${title}".`)
  return { id: exact.id, label: exact.label, description: String(exact.description ?? "") }
}

/**
 * The structured facts about a film from Wikidata, which is what a library has
 * to agree on before it will accept a file: release date, runtime, director,
 * cast, studio, country and the IMDb and TMDB identifiers.
 */
export async function filmFacts(args: { title: string; year?: string }): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) throw new RadarrError("Give a film title, e.g. 'The Shawshank Redemption'.")
  const year = (args.year ?? "").trim() || undefined

  const found = await findFilm(title, year)
  const data = await wdGet<WdEntitiesResponse>({
    action: "wbgetentities",
    ids: found.id,
    props: "labels|descriptions|claims|sitelinks|aliases",
    languages: "en",
  })
  const entity = data.entities?.[found.id]
  if (!entity) throw new RadarrError(`Wikidata has no entity record for ${found.id}.`)

  const directorIds = (entity.claims?.P57 ?? []).map((c) => itemId(c.mainsnak?.datavalue?.value)).filter((v): v is string => Boolean(v))
  const castIds = (entity.claims?.P161 ?? []).map((c) => itemId(c.mainsnak?.datavalue?.value)).filter((v): v is string => Boolean(v))
  const genreIds = (entity.claims?.P136 ?? []).map((c) => itemId(c.mainsnak?.datavalue?.value)).filter((v): v is string => Boolean(v))
  const studioId = itemId(claimValue(entity, "P272"))
  const names = await labelsFor([...directorIds, ...castIds, ...genreIds, ...(studioId ? [studioId] : [])])

  const released = yearOf(claimValue(entity, "P577"))
  const runtime = quantity(claimValue(entity, "P2047"))
  const imdb = valueText(claimValue(entity, "P345"))
  const tmdb = valueText(claimValue(entity, "P4985"))
  const country = itemId(claimValue(entity, "P495"))
  const language = itemId(claimValue(entity, "P364"))
  const budget = quantity(claimValue(entity, "P2130"))
  const boxOffice = quantity(claimValue(entity, "P2142"))
  const wikipedia = entity.sitelinks?.enwiki?.title
  const aliases = (entity.aliases?.en ?? []).map((a) => String(a.value ?? "")).filter(Boolean).slice(0, 6)

  return [
    `${entity.labels?.en?.value ?? found.label} (Wikidata ${found.id})`,
    `  ${String(entity.descriptions?.en?.value ?? found.description) || "no description"}`,
    `  also known as: ${aliases.length ? aliases.join(" | ") : "no aliases recorded"}`,
    "",
    "Dates and length:",
    `  release date: ${released ?? "not reported"}`,
    `  runtime: ${runtime === null ? "not reported" : `${runtime} minutes`}`,
    "",
    "People and categories:",
    `  director: ${directorIds.length ? names.get(directorIds[0]) ?? directorIds[0] : "not reported"}${directorIds.length > 1 ? ` and ${directorIds.length - 1} co-director(s)` : ""}`,
    `  cast (${castIds.length} credited on Wikidata): ${castIds.slice(0, 10).map((id) => names.get(id) ?? id).join(", ")}${castIds.length > 10 ? `, +${castIds.length - 10} more` : ""}`,
    `  genre: ${genreIds.length ? genreIds.map((id) => names.get(id) ?? id).join(", ") : "not reported"}`,
    `  production company: ${studioId ? names.get(studioId) ?? studioId : "not reported"}`,
    `  country: ${country ?? "not reported"}${language ? ` | original language: ${language}` : ""}`,
    "",
    "Identifiers a library matches on:",
    `  IMDb: ${imdb ?? "not reported"} | TMDB: ${tmdb ?? "not reported"}`,
    `  Wikipedia: ${wikipedia ? `https://en.wikipedia.org/wiki/${encodeURIComponent(wikipedia.replace(/ /g, "_"))}` : "no English article"}`,
    "",
    `Money: budget ${budget === null ? "not reported" : `$${budget.toLocaleString()}`}, box office ${boxOffice === null ? "not reported" : `$${boxOffice.toLocaleString()}`}.`,
    "Source: Wikidata. A claim with no statement here means Wikidata does not record it, not that the fact is false.",
  ].join("\n")
}

/**
 * A director's credits as Wikidata has them, every titled work with its earliest
 * release date and IMDb identifier. Wikidata stores "director" on the film, so
 * this is a real query over the graph rather than a lookup on the person item.
 */
export async function filmography(args: { name: string; limit?: number }): Promise<string> {
  const name = (args.name ?? "").trim()
  if (!name) throw new RadarrError("Give a person or studio name, e.g. 'Christopher Nolan'.")
  const size = Math.min(Math.max(Math.trunc(args.limit ?? 15), 1), 60)

  const search = await wdGet<WdSearchResponse>({
    action: "wbsearchentities",
    search: name,
    language: "en",
    uselang: "en",
    limit: "5",
  })
  const hit = (search.search ?? []).find((h) => (h.label ?? "").toLowerCase() === name.toLowerCase()) ?? search.search?.[0]
  if (!hit?.id) throw new RadarrError(`Wikidata has nothing matching "${name}".`)

  const person = await wdGet<WdEntitiesResponse>({
    action: "wbgetentities",
    ids: hit.id,
    props: "labels|descriptions",
    languages: "en",
  })
  const entity = person.entities?.[hit.id]
  const label = entity?.labels?.en?.value ?? hit.label ?? name

  const sparql = [
    "SELECT ?film ?filmLabel (MIN(?date) AS ?first) (SAMPLE(?imdb) AS ?imdb) WHERE {",
    `  ?film wdt:P57 wd:${hit.id} .`,
    "  OPTIONAL { ?film wdt:P577 ?date }",
    "  OPTIONAL { ?film wdt:P345 ?imdb }",
    '  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }',
    "}",
    "GROUP BY ?film ?filmLabel",
    "ORDER BY ?first",
    `LIMIT ${size + 5}`,
  ].join(" ")
  const results = await sparqlQuery(sparql)
  if (!results.length) {
    return [
      `${label} (Wikidata ${hit.id})`,
      `  ${String(entity?.descriptions?.en?.value ?? "") || "no description"}`,
      "Wikidata records no directed films for this item, so no filmography can be listed.",
    ].join("\n")
  }

  const undated = results.filter((r) => !r.first)
  const withImdb = results.filter((r) => r.imdb).length
  const years = results.map((r) => Number(r.first?.slice(0, 4) ?? NaN)).filter((n) => Number.isFinite(n))

  return [
    `Directed works on Wikidata: ${label} (${hit.id})`,
    `  ${String(entity?.descriptions?.en?.value ?? "") || "no description"}`,
    `  ${results.length} film(s) credit this person as director, ${withImdb} carry an IMDb id`,
    years.length ? `  earliest ${Math.min(...years)}, latest ${Math.max(...years)}, ${undated.length} with no release date recorded` : "  none carry a release date",
    "",
    ...results.slice(0, size).map(
      (row, i) => `  ${String(i + 1).padStart(2)}. ${(row.first ?? "undated").slice(0, 10).padEnd(10)} ${row.filmLabel.slice(0, 50).padEnd(50)} ${row.imdb ?? "IMDb not recorded"}`
    ),
    results.length > size ? `  (+${results.length - size} more)` : "",
    "",
    "Source: a Wikidata Query Service query over the P57 director property. Coverage is only as complete as Wikidata makes it.",
  ].join("\n")
}

interface SparqlRow {
  filmLabel: string
  first?: string
  imdb?: string
}

async function sparqlQuery(query: string): Promise<SparqlRow[]> {
  const url = `https://query.wikidata.org/sparql?${new URLSearchParams({ query, format: "json" })}`
  const res = await fetch(url, {
    headers: { Accept: "application/sparql-results+json", "User-Agent": RADARR_UA },
    signal: AbortSignal.timeout(45000),
  })
  if (res.status === 429) throw new RadarrError("The Wikidata query service rate-limited this host. Try again shortly.")
  if (!res.ok) throw new RadarrError(`Wikidata query service error ${res.status}: ${res.statusText}`)
  const body = (await res.json()) as { results?: { bindings?: Array<Record<string, { value?: string }>> } }
  const bindings = body.results?.bindings ?? []
  return bindings.map((row) => ({
    filmLabel: String(row.filmLabel?.value ?? row.film?.value ?? "untitled"),
    first: row.first?.value ? String(row.first.value) : undefined,
    imdb: row.imdb?.value ? String(row.imdb.value) : undefined,
  }))
}
