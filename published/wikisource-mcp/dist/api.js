const API = "https://en.wikisource.org/w/api.php";
const HEADERS = { "User-Agent": "mrfentmen-wikisource-mcp/1.0" };
export class WikisourceError extends Error {
}
async function get(params) {
    const url = new URL(API);
    Object.entries({ ...params, format: "json", origin: "*" }).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) });
    if (!response.ok)
        throw new WikisourceError(`Wikisource error ${response.status}`);
    return response.json();
}
export function searchTitles(query, limit = 10) {
    return get({ action: "query", list: "search", srsearch: query, srlimit: String(limit), srnamespace: "0", srprop: "snippet|timestamp" });
}
export function extract(title, introOnly, limit) {
    return get({ action: "query", prop: "extracts|info", explaintext: "1", ...(introOnly ? { exintro: "1" } : {}), exchars: String(limit), titles: title, inprop: "url" });
}
export function format(value) { return JSON.stringify(value, null, 2).slice(0, 16000); }
// ---- muxB tools:
const WS_REST = "https://en.wikisource.org/api/rest_v1";
// ---- gap4a4 tools:
async function gapQuery(params) {
    const query = new URLSearchParams({ action: 'query', format: 'json', ...params });
    const res = await fetch(`https://en.wikisource.org/w/api.php?${query}`, {
        headers: { 'User-Agent': 'mrfentmen-wikisource-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Wiki API returned ${res.status}`);
    const data = await res.json();
    if (data.error)
        throw new Error(data.error.info ?? 'Wiki API error');
    return data;
}
export async function pageBacklinks(args) {
    const limit = Math.max(1, Math.min(Math.round(args.limit ?? 10), 30));
    const title = args.title.trim();
    if (!title)
        throw new Error('Provide a page title.');
    const data = await gapQuery({ list: 'backlinks', bltitle: title, bllimit: String(limit) });
    const rows = data.query?.backlinks ?? [];
    return rows.length ? rows.slice(0, limit).map((r, i) => `${i + 1}. ${String(r.title ?? 'not reported').slice(0, 250)} | page ${r.pageid ?? 'not reported'} | namespace ${r.ns ?? 'not reported'}`).join('\n') : 'No backlinks returned.';
}
