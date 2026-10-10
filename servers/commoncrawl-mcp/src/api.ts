const COLLECTIONS = "https://index.commoncrawl.org/collinfo.json"
const HEADERS = { "User-Agent": "mrfentmen-commoncrawl-mcp/1.0" }

export class CommonCrawlError extends Error {}

type Collection = { id?: string; name?: string; timegate?: string; cd?: string }

async function getJson(url: URL, timeout = 30000): Promise<unknown> {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeout) })
  if (!response.ok) throw new CommonCrawlError(`Common Crawl error ${response.status}`)
  return response.json()
}

export async function listCollections(): Promise<Collection[]> {
  return (await getJson(new URL(COLLECTIONS))) as Collection[]
}

export async function latestIndex(): Promise<string> {
  const collections = await listCollections()
  const id = collections[0]?.id
  if (!id) throw new CommonCrawlError("Common Crawl returned no index collections")
  return id
}

export async function searchCaptures(urlPattern: string, index: string | undefined, page: number, limit: number) {
  const selectedIndex = index || await latestIndex()
  const url = new URL(`https://index.commoncrawl.org/${encodeURIComponent(selectedIndex)}-index`)
  url.searchParams.set("url", urlPattern)
  url.searchParams.set("output", "json")
  url.searchParams.set("page", String(page))
  url.searchParams.set("fl", "url,timestamp,status,mime,mime-detected,digest,filename,offset,length")
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new CommonCrawlError(`Common Crawl index error ${response.status}`)
  const body = await response.text()
  const records = body.split("\\n").filter(Boolean).slice(0, limit).map((line) => {
    try { return JSON.parse(line) } catch { return { raw: line.slice(0, 1000) } }
  })
  return { index: selectedIndex, page, count: records.length, records }
}

export function format(value: unknown): string {
  return JSON.stringify(value, null, 2).slice(0, 16000)
}

// ---- muxA tools:

const CC = "https://index.commoncrawl.org";

function ccLine(raw: string): Record<string, any> | null {
  try {
    const d = JSON.parse(raw) as Record<string, any>;
    return typeof d?.url === "string" ? d : null;
  } catch {
    return null;
  }
}

async function cdx(
  index: string,
  params: Record<string, string>,
  limit: number,
): Promise<{ rows: Array<Record<string, any>>; pagesFetched: number }> {
  const query = new URLSearchParams({ ...params, output: "json" });
  const url = `${CC}/${index}-index?${query.toString()}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "mrfentmen-commoncrawl-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Common Crawl index returned ${res.status}. ${body.slice(0, 200)}`.trim());
  }
  const text = await res.text();
  const rows: Array<Record<string, any>> = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const d = ccLine(line);
    if (d) rows.push(d);
    if (rows.length >= limit) break;
  }
  return { rows, pagesFetched: 1 };
}

export interface HistoryArgs {
  url: string;
  index?: string;
  match_type?: string;
  from_year?: number;
  to_year?: number;
  limit?: number;
}

export interface StatsArgs {
  url: string;
  index?: string;
  match_type?: string;
  sample?: number;
}

function crawlWindow(hit: unknown): string {
  const raw = hit as Record<string, unknown>;
  if (raw.from && raw.to) return `Crawl window: ${String(raw.from)} to ${String(raw.to)}`;
  return "Crawl window not reported";
}

function indexSize(hit: unknown): string {
  const raw = hit as Record<string, unknown>;
  const value = raw["total-index-size"];
  return value != null ? `${String(value)} bytes` : "not reported";
}

export interface CollectionArgs {
  id: string;
}

export async function collectionDetails(args: CollectionArgs): Promise<string> {
  const id = (args.id ?? "").trim();
  if (!id) throw new Error("Provide a collection id, e.g. CC-MAIN-2026-39.");
  const d = (await listCollections()) as unknown as Array<Record<string, unknown>>;
  const hit = d.find((c) => c.id === id);
  if (!hit) {
    return `"${id}" is not in the Common Crawl collection list. The newest collections are ${d.slice(0, 5).map((c) => c.id).join(", ")}.`;
  }
  return [
    `Common Crawl collection ${String(hit.id)}: ${String(hit.name ?? "unnamed")}`,
    `Timegate: ${hit.timegate ?? "not reported"}`,
    `CDX API: ${hit["cdx-api"] ?? "not reported"}`,
    crawlWindow(hit),
    `Total index size: ${indexSize(hit)}`,
    `This collection is index number ${d.indexOf(hit) + 1} of ${d.length} listed.`,
    "The index only holds metadata and offsets; the captured bytes live in WARC files on S3 and are fetched by range request using the filename and offset in each record.",
  ].join("\n");
}
