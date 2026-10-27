export class DplaError extends Error {
    constructor(message) {
        super(message);
        this.name = "DplaError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new DplaError(`Set the ${name} environment variable.`);
    return v;
}
function apiKey() {
    return envStrict("DPLA_API_KEY");
}
async function authHeaders() {
    return {};
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(url, init = {}) {
    const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new DplaError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function searchItems(query, pageSize) {
    const key = apiKey();
    let url = `https://api.dp.la/v2/items`;
    const qs = new URLSearchParams();
    qs.append("q", String(query));
    if (pageSize !== undefined)
        qs.append("page_size", String(pageSize));
    qs.append("api_key", key);
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getItem(itemId) {
    const key = apiKey();
    let url = `https://api.dp.la/v2/items/${encodeURIComponent(String(itemId))}`;
    const qs = new URLSearchParams();
    qs.append("api_key", key);
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function searchCollections(query) {
    const key = apiKey();
    let url = `https://api.dp.la/v2/collections`;
    const qs = new URLSearchParams();
    qs.append("q", String(query));
    qs.append("api_key", key);
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getCollection(collectionId) {
    const key = apiKey();
    const data = await req(`https://api.dp.la/v2/collections/${encodeURIComponent(String(collectionId))}?api_key=${encodeURIComponent(key)}`);
    return pretty(data);
}
export async function titleSearch(title, pageSize) {
    const key = apiKey();
    const qs = new URLSearchParams({ "sourceResource.title": String(title), page_size: String(pageSize ?? 10), api_key: key });
    const data = await req(`https://api.dp.la/v2/items?${qs.toString()}`);
    return pretty(data);
}
export async function dateSearch(after, before, pageSize) {
    const key = apiKey();
    const qs = new URLSearchParams({ "sourceResource.date.after": String(after), "sourceResource.date.before": String(before), page_size: String(pageSize ?? 10), api_key: key });
    const data = await req(`https://api.dp.la/v2/items?${qs.toString()}`);
    return pretty(data);
}
export async function placeSearch(place, pageSize) {
    const key = apiKey();
    const qs = new URLSearchParams({ "sourceResource.spatial": String(place), page_size: String(pageSize ?? 10), api_key: key });
    const data = await req(`https://api.dp.la/v2/items?${qs.toString()}`);
    return pretty(data);
}
export async function sortedSearch(query, sortBy, pageSize) {
    const key = apiKey();
    const qs = new URLSearchParams({ q: String(query), sort_by: String(sortBy || "sourceResource.title"), page_size: String(pageSize ?? 10), api_key: key });
    const data = await req(`https://api.dp.la/v2/items?${qs.toString()}`);
    return pretty(data);
}
export async function facetSearch(query, facet) {
    const key = apiKey();
    const qs = new URLSearchParams({ q: String(query), facets: String(facet || "sourceResource.type"), page_size: "0", api_key: key });
    const data = await req(`https://api.dp.la/v2/items?${qs.toString()}`);
    return pretty(data);
}
