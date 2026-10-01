export class OmdbError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OmdbError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://www.omdbapi.com";

async function req(path: string, params: Record<string, string | number | undefined>): Promise<string> {
  void params;
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new OmdbError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new OmdbError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

function key(): string {
  const k = process.env.OMDB_API_KEY;
  if (!k) throw new OmdbError("Set OMDB_API_KEY (free at omdbapi.com/apikey.aspx, 1,000 req/day).");
  return k;
}

function check(text: string): Record<string, unknown> {
  const d = JSON.parse(text) as Record<string, unknown>;
  if (d.Response === "False") throw new OmdbError(`OMDb: ${String(d.Error ?? "unknown error").slice(0, 200)}`);
  return d;
}

export function searchMovies(query: string, page?: string): Promise<string> {
  return req(`/?apikey=${encodeURIComponent(key())}&s=${encodeURIComponent(query)}&page=${encodeURIComponent(page ?? "1")}`, {}).then((t) => {
    const d = check(t);
    return JSON.stringify({ totalResults: d.totalResults ?? null, results: d.Search ?? [] }, null, 2);
  });
}

export function getMovie(idOrTitle: string): Promise<string> {
  const byId = /^(tt\d+)$/.test(idOrTitle.trim());
  const q = byId ? `i=${encodeURIComponent(idOrTitle.trim())}` : `t=${encodeURIComponent(idOrTitle.trim())}`;
  return req(`/?apikey=${encodeURIComponent(key())}&${q}&plot=full`, {}).then((t) =>
    JSON.stringify(check(t), null, 2));
}

// ---- muxG tools:
const OMDB_WIKIDATA_API = "https://www.wikidata.org/w/api.php"

const OMDB_LIST_CAP = 12

async function omdbWikiJson<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ format: "json", formatversion: "2", ...params })
  const res = await fetch(`${OMDB_WIKIDATA_API}?${qs}`, {
    headers: { "User-Agent": "awesome-mcps/1.0 (film metadata)", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new OmdbError(`Wikidata returned ${res.status}`)
  const d = (await res.json()) as { error?: { info?: string } }
  if (d.error) throw new OmdbError(`Wikidata: ${d.error.info ?? "request failed"}`)
  return d as T
}

interface OmdbSearchHit {
  id: string
  label: string
  description?: string
  match?: { type?: string; text?: string }
}

function omdbClaimValue(
  claims: Record<string, { mainsnak?: { snaktype?: string; datavalue?: { value?: unknown } } }[]>,
  property: string,
): unknown {
  return claims[property]?.[0]?.mainsnak?.datavalue?.value
}

function omdbBound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

/** Which film did you mean? Wikidata candidates for a title, each with its IMDb id. */
export async function findFilmIds(args: { title?: string; limit?: number }): Promise<string> {
  const title = String(args.title ?? "").trim()
  if (!title) throw new OmdbError("title is empty, for example \"Blade Runner\".")
  const limit = omdbBound(args.limit, 1, OMDB_LIST_CAP, 6)
  const d = await omdbWikiJson<{ search?: OmdbSearchHit[] }>({
    action: "wbsearchentities",
    search: title,
    language: "en",
    uselang: "en",
    type: "item",
    limit: String(limit * 2),
  })
  const hits = d.search ?? []
  if (!hits.length) {
    return [`No Wikidata item matches "${title}".`, "Wikidata covers most notable films, so an obscure or very recent title may be absent."].join("\n")
  }

  const qids = hits.slice(0, limit).map((h) => h.id)
  const entities = await omdbWikiJson<{
    entities?: Record<string, { claims?: Record<string, { mainsnak?: { datavalue?: { value?: unknown } } }[]> }>
  }>({ action: "wbgetentities", ids: qids.join("|"), props: "claims" })
  const imdbByQid = new Map<string, string>()
  const yearByQid = new Map<string, string>()
  for (const [qid, e] of Object.entries(entities.entities ?? {})) {
    const imdb = omdbClaimValue(e.claims ?? {}, "P345")
    if (typeof imdb === "string") imdbByQid.set(qid, imdb)
    const published = omdbClaimValue(e.claims ?? {}, "P577") as { time?: string } | undefined
    const m = /^([+-])(\d{4})/.exec(String(published?.time ?? ""))
    if (m) yearByQid.set(qid, `${m[1] === "-" ? "before " : ""}${m[2]}`)
  }

  return [
    `Wikidata candidates for "${title}"`,
    `${hits.length} item(s) found; the first ${Math.min(limit, hits.length)} with their IMDb id where Wikidata has one.`,
    "",
    ...hits.slice(0, limit).map((h) => {
      const imdb = imdbByQid.get(h.id) ?? "no IMDb id on Wikidata"
      const year = yearByQid.get(h.id)
      return [
        `${h.id}${year ? ` (${year})` : ""} ${h.label ?? "(no label)"}`,
        `  ${h.description ?? "no description"}`,
        `  ${imdb}${imdb !== "no IMDb id on Wikidata" ? " -> pass this to cinemeta_details" : ""}${h.match?.type === "alias" ? "  [matched on an alias, not the label]" : ""}`,
      ].join("\n")
    }),
    "",
    "Pick the Q-id whose description matches the film you meant, then pass it to wikidata_facts, or pass the IMDb id to cinemeta_details.",
  ].join("\n")
}

