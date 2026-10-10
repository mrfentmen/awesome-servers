export class BraveError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BraveError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.BRAVE_API_KEY;
  if (!k) throw new BraveError("Set BRAVE_API_KEY (free Brave Search key).");
  return { ...UA, Accept: "application/json", "X-Subscription-Token": k };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.search.brave.com/res/v1" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new BraveError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new BraveError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function webSearch(query: string, count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 5) || 5, 20);
  return get(`/web/search?q=${encodeURIComponent(query)}&count=${n}`);
}

export function newsSearch(query: string, count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 5) || 5, 20);
  return get(`/news/search?q=${encodeURIComponent(query)}&count=${n}`);
}



export function imageSearch(query: string, count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 5) || 5, 20);
  return get(`/images/search?q=${encodeURIComponent(query)}&count=${n}`);
}

export function videoSearch(query: string, count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 5) || 5, 20);
  return get(`/videos/search?q=${encodeURIComponent(query)}&count=${n}`);
}

export function suggestQueries(query: string): Promise<string> {
  return get(`/suggest/search?q=${encodeURIComponent(query)}&count=5`);
}

export function spellcheck(query: string): Promise<string> {
  return get(`/spellcheck/check?q=${encodeURIComponent(query)}`);
}

export function listGoggles(): Promise<string> {
  return get("/goggles/list").then((t) => t.slice(0, 6000));
}

export function faqSearch(query: string, count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 5) || 5, 20);
  return get(`/web/search?q=${encodeURIComponent(query)}&count=${n}&result_filter=faq`);
}

export function discussionSearch(query: string, count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 5) || 5, 20);
  return get(`/web/search?q=${encodeURIComponent(query)}&count=${n}&result_filter=discussions`);
}

export function localizedSearch(query: string, country: string, count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 5) || 5, 20);
  return get(`/web/search?q=${encodeURIComponent(query)}&count=${n}&country=${encodeURIComponent(country)}`);
}

// ---- muxD tools:

interface BraveQuery { q?: string; more_results_available?: boolean; original?: string }
interface BraveWebResult {
  title?: string; url?: string; description?: string; age?: string; page_age?: string;
  extra_snippets?: string[];
}
interface BraveNewsResult { title?: string; url?: string; description?: string; age?: string; meta_entropy?: string; extra_snippets?: string[] }

/** Same request as get(), but parsed, so a caller can read individual fields. */
async function getJson(path: string): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch("https://api.search.brave.com/res/v1" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new BraveError(`Network error: ${errorMessage(e)}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new BraveError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

const FRESHNESS: Record<string, string> = {
  day: "pd",
  week: "pw",
  month: "pm",
  year: "py",
};

export interface FreshnessArgs {
  query: string;
  window?: string;
  count?: string;
}

/**
 * GET /web/search and GET /news/search with the documented `freshness` filter
 * (pd / pw / pm / py), plus extra_snippets and result_filter.
 */
export async function freshnessSweep(args: FreshnessArgs): Promise<string> {
  const q = (args.query ?? "").trim();
  if (!q) throw new BraveError("Provide a search query.");
  const windowKey = (args.window ?? "week").trim().toLowerCase();
  const fresh = FRESHNESS[windowKey];
  if (!fresh) throw new BraveError("Window must be day, week, month or year.");
  const n = Math.min(Math.max(Number(args.count ?? 8) || 8, 1), 20);
  const common = `q=${encodeURIComponent(q)}&count=${n}&freshness=${fresh}&extra_snippets=true`;

  const [webData, newsData] = await Promise.all([
    getJson(`/web/search?${common}&result_filter=web`),
    getJson(`/news/search?${common}`),
  ]);
  const wq = (webData.query ?? {}) as BraveQuery;
  const nq = (newsData.query ?? {}) as BraveQuery;
  const web = ((webData.web ?? {}) as { results?: BraveWebResult[] }).results ?? [];
  const news = ((newsData.news ?? {}) as { results?: BraveNewsResult[] }).results ?? [];

  const lines = [`Brave recency sweep for "${q}" — window: last ${windowKey} (freshness=${fresh}), ${n} per vertical`];
  lines.push(`Web query: "${wq.q ?? q}"${wq.original && wq.original !== wq.q ? ` (rewritten from "${wq.original}")` : ""} | more pages available: ${wq.more_results_available === true ? "yes" : "no"}`);
  lines.push(`News query: "${nq.q ?? q}"${nq.original && nq.original !== nq.q ? ` (rewritten from "${nq.original}")` : ""}`);
  lines.push("", `Web results (${web.length}):`);
  if (!web.length) lines.push("  (none in this window)");
  web.forEach((r, i) => {
    lines.push(`  ${i + 1}. ${r.title ?? "(untitled)"}`)
    if (r.url) lines.push(`     ${r.url}`)
    const extras = Array.isArray(r.extra_snippets) ? r.extra_snippets.filter(Boolean) : []
    if (r.description) lines.push(`     ${String(r.description).slice(0, 300)}`)
    for (const s of extras.slice(0, 2)) lines.push(`     alt: ${String(s).slice(0, 220)}`)
    if (r.age || r.page_age) lines.push(`     age: ${r.age ?? r.page_age ?? "not reported"}`)
  })
  lines.push("", `News results (${news.length}):`);
  if (!news.length) lines.push("  (none in this window)")
  news.forEach((r, i) => {
    lines.push(`  ${i + 1}. ${r.title ?? "(untitled)"}`)
    if (r.url) lines.push(`     ${r.url}`)
    if (r.description) lines.push(`     ${String(r.description).slice(0, 300)}`)
    if (r.age) lines.push(`     age: ${r.age}`)
    if (typeof r.meta_entropy === "number") lines.push(`     Brave news score: ${r.meta_entropy}`)
  })
  return lines.join("\n")
}

export interface GoggleArgs {
  query: string;
  goggles: string;
  count?: string;
}

/**
 * GET /web/search with the `goggles` parameter: a hosted Goggle URL, an inline
 * Goggle spec ($boost / $downrank / $discard with site= rules), or up to 3 of
 * them separated by newlines.
 */
export async function goggleSearch(args: GoggleArgs): Promise<string> {
  const q = (args.query ?? "").trim();
  if (!q) throw new BraveError("Provide a search query.");
  const goggle = (args.goggles ?? "").trim();
  if (!goggle) throw new BraveError("Provide a Goggle: a hosted .goggle URL or an inline spec like '$boost,site=dev.to'.");
  const n = Math.min(Math.max(Number(args.count ?? 10) || 10, 1), 20);
  const parts = goggle.split(/\n+/).map((s) => s.trim()).filter(Boolean).slice(0, 3);
  const params = new URLSearchParams({ q, count: String(n), result_filter: "web" });
  for (const p of parts) params.append("goggles", p);
  const data = await getJson(`/web/search?${params.toString()}`);
  const wq = (data.query ?? {}) as BraveQuery;
  const web = ((data.web ?? {}) as { results?: BraveWebResult[] }).results ?? [];
  const lines = [`Brave Goggle search for "${q}" using ${parts.length} goggle value(s)`];
  lines.push(`Rules applied:`)
  for (const p of parts) lines.push(`  ${p}`)
  if (wq.original && wq.original !== q) lines.push(`Brave rewrote the query to: ${wq.original}`)
  lines.push("")
  if (!web.length) {
    lines.push("No results survived the Goggle rules - check whether a $discard rule excluded everything.")
    return lines.join("\n")
  }
  lines.push(`Results (${web.length}):`)
  for (const r of web) {
    lines.push(`  - ${r.title ?? "(untitled)"}${r.url ? `\n    ${r.url}` : ""}`)
    if (r.description) lines.push(`    ${String(r.description).slice(0, 200)}`)
  }
  return lines.join("\n")
}

export interface DiveArgs {
  query: string;
  pages?: string;
  count?: string;
}

/**
 * GET /web/search walked through offset 0..pages, following the documented
 * `query.more_results_available` flag rather than paging blindly.
 */
export async function pagedDive(args: DiveArgs): Promise<string> {
  const q = (args.query ?? "").trim();
  if (!q) throw new BraveError("Provide a search query.");
  const perPage = Math.min(Math.max(Number(args.count ?? 10) || 10, 1), 20);
  const pages = Math.min(Math.max(Math.floor(Number(args.pages ?? 2) || 2), 1), 10);
  const seen = new Set<string>();
  const rows: { rank: number; page: number; r: BraveWebResult }[] = []
  const lines = [`Brave deep dive for "${q}": up to ${pages} page(s) of ${perPage} web results`]
  let stopped = ""
  let lastQuery = ""
  for (let page = 0; page < pages; page += 1) {
    const params = new URLSearchParams({
      q, count: String(perPage), offset: String(page), result_filter: "web", extra_snippets: "true",
    });
    const data = await getJson(`/web/search?${params.toString()}`);
    const wq = (data.query ?? {}) as BraveQuery
    lastQuery = wq.q ?? q
    const web = ((data.web ?? {}) as { results?: BraveWebResult[] }).results ?? []
    lines.push(`Page ${page + 1}: ${web.length} result(s)${wq.more_results_available === true ? ", more pages available" : ", no further pages"}`)
    for (const r of web) {
      const key = r.url ?? r.title ?? ""
      if (!key || seen.has(key)) continue
      seen.add(key)
      rows.push({ rank: rows.length + 1, page: page + 1, r })
    }
    if (wq.more_results_available !== true) {
      stopped = `Brave reported no further pages after page ${page + 1}.`
      break
    }
  }
  if (!stopped) stopped = `Stopped at the ${pages}-page limit you asked for; Brave may have more results.`
  lines.push("")
  lines.push(`Unique results collected: ${rows.length}`)
  if (lastQuery && lastQuery !== q) lines.push(`Brave's final query spelling: ${lastQuery}`)
  for (const { rank, page, r } of rows.slice(0, 40)) {
    lines.push(`  ${rank}. (p${page}) ${r.title ?? "(untitled)"}`)
    if (r.url) lines.push(`     ${r.url}`)
    const extras = Array.isArray(r.extra_snippets) ? r.extra_snippets.filter(Boolean) : []
    for (const s of extras.slice(0, 1)) lines.push(`     alt: ${String(s).slice(0, 200)}`)
  }
  if (rows.length > 40) lines.push(`  ...and ${rows.length - 40} more result(s) collected.`)
  lines.push("")
  lines.push(stopped)
  return lines.join("\n")
}
