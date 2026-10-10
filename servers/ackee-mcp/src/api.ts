export class AckeeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AckeeError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new AckeeError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("ACKEE_API_TOKEN") };
}
async function gql(query: string): Promise<unknown> {
  const base = envStrict("ACKEE_BASE_URL").replace(/\/$/, "");
  const data = await req(`${base}/api`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
  const body = data as { data?: unknown; errors?: Array<{ message?: string }> };
  if (body.errors && body.errors.length > 0) throw new AckeeError(body.errors.map((e) => e.message ?? "GraphQL error").join("; "));
  return body.data;
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new AckeeError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listDomains(): Promise<string> {
  const data = await gql("{ domains { id title } }");
  return pretty(data);
}

export async function getDomain(domainId: string): Promise<string> {
  const q = `query { domain(id: "${domainId}") { id title facts { activeVisitors } statistics { views(interval: YEARLY, type: UNIQUE) { id count } } } }`;
  const data = await gql(q);
  return pretty(data);
}

export async function getTopBrowsers(domainId: string): Promise<string> {
  const q = `query { domain(id: "${domainId}") { statistics { browsers(sorting: TOP, type: WITH_VERSION, range: LAST_6_MONTHS, limit: 10) { id count } } } }`;
  const data = await gql(q);
  return pretty(data);
}

// ---- muxB tools:

// The public iTunes/App Store web API serves app metadata and customer reviews
// with no key at all.
const ITUNES_SEARCH = "https://itunes.apple.com/search"
const ITUNES_REVIEWS = "https://itunes.apple.com/us/rss/customerreviews"
const ITUNES_UA = "ackee-mcp/1.0"

async function itunesGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": ITUNES_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  });
  if (res.status === 403 || res.status === 429) throw new AckeeError(`iTunes refused (${res.status}); it rate limits the public endpoints.`);
  if (res.status === 404) throw new AckeeError("Not found in the iTunes Store.");
  if (!res.ok) throw new AckeeError(`iTunes error ${res.status}`);
  return (await res.json()) as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Itunes = Record<string, any>

function itunesLabel(value: Itunes | undefined, fallback = "not reported"): string {
  const label = value?.label;
  return typeof label === "string" && label.trim() ? label.trim() : fallback;
}

function itunesDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "not reported";
  return value.slice(0, 10);
}

function itunesRating(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "not rated";
}

export async function appStoreSearch(args: { query: string; country?: string; limit?: number }): Promise<string> {
  const term = (args.query ?? "").trim();
  if (!term) throw new AckeeError("Search text is empty.");
  const country = (args.country ?? "us").trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(country)) throw new AckeeError(`country must be a two-letter store code, got "${args.country ?? ""}".`);
  const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);
  const params = new URLSearchParams({ term, entity: "software", country, limit: String(limit), sort: "rating" });
  const data = await itunesGet<Itunes>(`${ITUNES_SEARCH}?${params.toString()}`);
  const rows: Itunes[] = Array.isArray(data.results) ? data.results : [];
  if (rows.length === 0) return `No iOS apps match "${term}" in the ${country.toUpperCase()} store.`;
  return [
    `iOS apps for "${term}" in the ${country.toUpperCase()} store, best rated first - ${Number(data.resultCount ?? 0).toLocaleString()} match, showing ${rows.length}:`,
    ...rows.map((r, i) => {
      const genres: string[] = Array.isArray(r.genres) ? r.genres : [];
      return [
        `${i + 1}. ${r.trackName ?? "(unnamed app)"} - ${r.sellerName ?? "seller not reported"} [${r.trackId ?? "?"}]`,
        `   ${r.primaryGenreName ?? "genre not reported"}${genres.length > 1 ? ` (${genres.slice(1, 4).join(", ")})` : ""} · ${r.formattedPrice ?? "price not reported"}`,
        `   rated ${itunesRating(r.averageUserRating)} from ${Number(r.userRatingCount ?? 0).toLocaleString()} ratings`,
        `   version ${r.version ?? "not reported"}, updated ${itunesDate(r.currentVersionReleaseDate)}, ${r.contentAdvisoryRating ? `rated ${r.contentAdvisoryRating}` : "no content rating"}`,
        r.minimumOsVersion ? `   needs iOS ${r.minimumOsVersion}` : "",
        r.trackViewUrl ? `   ${r.trackViewUrl}` : "",
      ].filter(Boolean).join("\n");
    }),
  ].join("\n");
}

export async function appStoreReviews(args: { appId: string; page?: number; limit?: number }): Promise<string> {
  const id = (args.appId ?? "").trim();
  if (!/^\d{1,12}$/.test(id)) throw new AckeeError(`appId must be the numeric App Store id, got "${args.appId ?? ""}".`);
  const page = Math.min(Math.max(args.page ?? 1, 1), 10);
  const limit = Math.min(Math.max(args.limit ?? 10, 1), 20);
  const data = await itunesGet<Itunes>(`${ITUNES_REVIEWS}/id=${encodeURIComponent(id)}/sortBy=mostRecent/page=${page}/json`);
  const feed: Itunes = (data.feed ?? {}) as Itunes;
  const rows: Itunes[] = Array.isArray(feed.entry) ? feed.entry : [];
  if (rows.length === 0) return `No customer reviews on page ${page} for App Store app ${id}.`;
  return [
    `App Store app ${id}, page ${page} of most recent reviews - showing ${Math.min(limit, rows.length)} of ${rows.length}:`,
    ...rows.slice(0, limit).map((r, i) => {
      const text = String(r.content?.label ?? "").replace(/\s+/g, " ").trim();
      const votes = Number(r["im:voteCount"]?.label ?? 0);
      return [
        `${i + 1}. ${itunesLabel(r.title, "no title")} - ${itunesLabel(r["im:rating"], "?")} stars by ${itunesLabel(r.author?.name, "anonymous")}${votes > 0 ? ` (${votes} helpful votes)` : ""}`,
        `   version ${itunesLabel(r["im:version"])} · ${itunesDate(r.updated?.label)}`,
        `   ${text ? text.slice(0, 300) : "no review text"}`,
      ].join("\n");
    }),
  ].join("\n");
}
