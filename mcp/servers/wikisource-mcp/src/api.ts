const API = "https://en.wikisource.org/w/api.php"
const HEADERS = { "User-Agent": "mrfentmen-wikisource-mcp/1.0" }

export class WikisourceError extends Error {}

async function get(params: Record<string, string>) {
  const url = new URL(API)
  Object.entries({ ...params, format: "json", origin: "*" }).forEach(([key, value]) => url.searchParams.set(key, value))
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new WikisourceError(`Wikisource error ${response.status}`)
  return response.json() as Promise<unknown>
}

export function searchTitles(query: string, limit = 10) {
  return get({ action: "query", list: "search", srsearch: query, srlimit: String(limit), srnamespace: "0", srprop: "snippet|timestamp" })
}

export function extract(title: string, introOnly: boolean, limit: number) {
  return get({ action: "query", prop: "extracts|info", explaintext: "1", ...(introOnly ? { exintro: "1" } : {}), exchars: String(limit), titles: title, inprop: "url" })
}

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, 16000) }

// ---- muxB tools:

const WS_REST = "https://en.wikisource.org/api/rest_v1"

export interface PageSummaryArgs {
  title?: string;
  maxCharacters?: number;
}

export async function pageSummary(args: PageSummaryArgs): Promise<string> {
  const title = (args.title ?? "").trim();
  if (!title) throw new WikisourceError("Provide a page title");
  const maxChars = Math.max(200, Math.min(args.maxCharacters ?? 1200, 6000));
  const url = `${WS_REST}/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  const response = await fetch(url, {
    headers: { ...HEADERS, Accept: "application/json" },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  if (response.status === 404) return `No Wikisource page titled "${title}".`;
  if (response.status === 429) throw new WikisourceError("Wikisource rate limit hit, wait and retry");
  if (!response.ok) throw new WikisourceError(`Wikisource error ${response.status}`);
  const d = (await response.json()) as {
    title?: string;
    description?: string;
    extract?: string;
    wikibase_item?: string;
    timestamp?: string;
    content_urls?: { desktop?: { page?: string } };
    thumbnail?: { url?: string };
  };
  const extract = String(d.extract ?? "").replace(/\s+/g, " ").trim();
  const lines = [
    `${d.title ?? title} (Wikisource page)`,
    `Description: ${d.description && d.description.trim() ? d.description.trim() : "not reported"}`,
    `Wikidata item: ${d.wikibase_item ?? "not reported"}`,
    `Last edited: ${String(d.timestamp ?? "not reported").replace("T", " ").replace("Z", " UTC")}`,
    `Page: ${d.content_urls?.desktop?.page ?? "not reported"}`,
  ];
  if (d.thumbnail?.url) lines.push(`Thumbnail: ${d.thumbnail.url}`);
  lines.push("", extract ? extract.slice(0, maxChars) : "Wikisource reported no lead extract for this page.");
  if (extract.length > maxChars) lines.push(`... (${extract.length} characters in total)`);
  return lines.join("\n");
}

export interface PageCategoriesArgs {
  title?: string;
  limit?: number;
}

export async function pageCategories(args: PageCategoriesArgs): Promise<string> {
  const title = (args.title ?? "").trim();
  if (!title) throw new WikisourceError("Provide a page title");
  const limit = Math.max(1, Math.min(args.limit ?? 20, 100));
  const d = (await get({
    action: "query",
    prop: "categories",
    titles: title,
    cllimit: String(limit),
    formatversion: "2",
  })) as { query?: { pages?: Array<{ title?: string; missing?: boolean; categories?: Array<{ title?: string }> }> } };
  const page = (d.query?.pages ?? [])[0];
  if (!page || page.missing) return `No Wikisource page titled "${title}".`;
  const cats = (page.categories ?? []).map((c) => String(c.title ?? "").replace(/^Category:/, "")).filter(Boolean);
  if (!cats.length) return `${page.title ?? title} is in no categories on Wikisource.`;
  return `Wikisource categories for ${page.title ?? title} (${cats.length} shown):\n` +
    cats.slice(0, limit).map((c, i) => `${i + 1}. ${c}`).join("\n");
}
