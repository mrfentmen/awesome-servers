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
