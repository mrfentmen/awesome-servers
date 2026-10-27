const COLLECTIONS = "https://index.commoncrawl.org/collinfo.json";
const HEADERS = { "User-Agent": "mrfentmen-commoncrawl-mcp/1.0" };
export class CommonCrawlError extends Error {
}
async function getJson(url, timeout = 30000) {
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeout) });
    if (!response.ok)
        throw new CommonCrawlError(`Common Crawl error ${response.status}`);
    return response.json();
}
export async function listCollections() {
    return (await getJson(new URL(COLLECTIONS)));
}
export async function latestIndex() {
    const collections = await listCollections();
    const id = collections[0]?.id;
    if (!id)
        throw new CommonCrawlError("Common Crawl returned no index collections");
    return id;
}
export async function searchCaptures(urlPattern, index, page, limit) {
    const selectedIndex = index || await latestIndex();
    const url = new URL(`https://index.commoncrawl.org/${encodeURIComponent(selectedIndex)}-index`);
    url.searchParams.set("url", urlPattern);
    url.searchParams.set("output", "json");
    url.searchParams.set("page", String(page));
    url.searchParams.set("fl", "url,timestamp,status,mime,mime-detected,digest,filename,offset,length");
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) });
    if (!response.ok)
        throw new CommonCrawlError(`Common Crawl index error ${response.status}`);
    const body = await response.text();
    const records = body.split("\\n").filter(Boolean).slice(0, limit).map((line) => {
        try {
            return JSON.parse(line);
        }
        catch {
            return { raw: line.slice(0, 1000) };
        }
    });
    return { index: selectedIndex, page, count: records.length, records };
}
export function format(value) {
    return JSON.stringify(value, null, 2).slice(0, 16000);
}
// ---- muxA tools:
const CC = "https://index.commoncrawl.org";
function ccLine(raw) {
    try {
        const d = JSON.parse(raw);
        return typeof d?.url === "string" ? d : null;
    }
    catch {
        return null;
    }
}
async function cdx(index, params, limit) {
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
    const rows = [];
    for (const line of text.split("\n")) {
        if (!line.trim())
            continue;
        const d = ccLine(line);
        if (d)
            rows.push(d);
        if (rows.length >= limit)
            break;
    }
    return { rows, pagesFetched: 1 };
}
function crawlWindow(hit) {
    const raw = hit;
    if (raw.from && raw.to)
        return `Crawl window: ${String(raw.from)} to ${String(raw.to)}`;
    return "Crawl window not reported";
}
function indexSize(hit) {
    const raw = hit;
    const value = raw["total-index-size"];
    return value != null ? `${String(value)} bytes` : "not reported";
}
export async function collectionDetails(args) {
    const id = (args.id ?? "").trim();
    if (!id)
        throw new Error("Provide a collection id, e.g. CC-MAIN-2026-39.");
    const d = (await listCollections());
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
