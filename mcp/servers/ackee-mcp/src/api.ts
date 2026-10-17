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

// ---- The iTunes/App Store premium tools moved to the licence gateway
// (src/gateway.ts); what remains here is the free Ackee GraphQL client.


// ---- App Store (public iTunes API, no key required) ----

interface AppStoreResult {
  trackName?: string;
  artistName?: string;
  primaryGenreName?: string;
  price?: number;
  currency?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  version?: string;
  releaseDate?: string;
  trackId?: number;
}

export async function appStoreSearch(args: { query: string; country?: string; limit?: number }): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide a search query.';
  const country = (args.country ?? 'us').trim().toLowerCase();
  const limit = Math.max(1, Math.min(20, args.limit ?? 5));
  const url = 'https://itunes.apple.com/search?term=' + encodeURIComponent(query) + '&country=' + encodeURIComponent(country) + '&entity=software&limit=' + limit;
  const res = await fetch(url, { headers: { 'User-Agent': 'awesome-mcps/1.0' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new AckeeError('iTunes search returned ' + res.status);
  const data = (await res.json()) as { resultCount?: number; results?: AppStoreResult[] };
  const results = data.results ?? [];
  if (!results.length) return 'No apps found for "' + query + '" in ' + country + '.';
  const lines = ['App Store search for "' + query + '" (' + country + '), ' + results.length + ' result(s):'];
  for (const r of results) {
    lines.push('• ' + (r.trackName ?? 'unnamed') + ' by ' + (r.artistName ?? 'unknown'));
    lines.push('  Genre: ' + (r.primaryGenreName ?? 'n/a') + ' | Price: ' + (r.price != null ? r.price + ' ' + (r.currency ?? '') : 'free') + ' | Rating: ' + (r.averageUserRating != null ? r.averageUserRating.toFixed(1) + '/5' : 'n/a') + ' (' + (r.userRatingCount ?? 0) + ' ratings)');
    lines.push('  Version: ' + (r.version ?? 'n/a') + ' | Released: ' + (r.releaseDate ? r.releaseDate.slice(0, 10) : 'n/a') + ' | ID: ' + (r.trackId ?? 'n/a'));
  }
  return lines.join('\n');
}

interface ReviewEntry {
  title?: { label?: string };
  content?: { label?: string };
  author?: { name?: { label?: string } };
  'im:rating'?: { label?: string };
  updated?: { label?: string };
}

export async function appStoreReviews(args: { appId: string; country?: string; limit?: number }): Promise<string> {
  const appId = (args.appId ?? '').trim();
  if (!appId) return 'Provide an app ID.';
  const country = (args.country ?? 'us').trim().toLowerCase();
  const limit = Math.max(1, Math.min(20, args.limit ?? 5));
  const url = 'https://itunes.apple.com/' + country + '/rss/customerreviews/id=' + encodeURIComponent(appId) + '/sortBy=mostRecent/json';
  const res = await fetch(url, { headers: { 'User-Agent': 'awesome-mcps/1.0' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new AckeeError('iTunes reviews returned ' + res.status);
  const data = (await res.json()) as { feed?: { entry?: ReviewEntry[] } };
  const entries = (data.feed?.entry ?? []).slice(0, limit);
  if (!entries.length) return 'No reviews found for app ' + appId + ' in ' + country + '.';
  const lines = ['App Store reviews for app ' + appId + ' (' + country + '), ' + entries.length + ' review(s):'];
  for (const e of entries) {
    const title = e.title?.label ?? 'Untitled';
    const content = (e.content?.label ?? '').slice(0, 300);
    const author = e.author?.name?.label ?? 'Anonymous';
    const rating = e['im:rating']?.label ?? 'n/a';
    const updated = e.updated?.label ? e.updated.label.slice(0, 10) : 'n/a';
    lines.push('★ ' + rating + '/5 — "' + title + '" by ' + author + ' (' + updated + ')');
    lines.push('  ' + content);
  }
  return lines.join('\n');
}
