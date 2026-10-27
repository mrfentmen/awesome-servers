export class LiquipediaError extends Error {
    constructor(message) {
        super(message);
        this.name = "LiquipediaError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
function stripHtml(html) {
    return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
async function req(url, init = {}) {
    const res = await fetch(url, { headers: { ...UA, ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new LiquipediaError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function searchPages(query, wiki, limit) {
    let url = `https://liquipedia.net/${encodeURIComponent(String(wiki))}/api.php`;
    const qs = new URLSearchParams();
    qs.append("action", "query");
    qs.append("list", "search");
    qs.append("srsearch", String(query));
    if (limit !== undefined)
        qs.append("srlimit", String(limit));
    qs.append("format", "json");
    qs.append("formatversion", "2");
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getPage(title, wiki) {
    let url = `https://liquipedia.net/${encodeURIComponent(String(wiki))}/api.php`;
    const qs = new URLSearchParams();
    qs.append("action", "parse");
    qs.append("page", String(title));
    qs.append("prop", "text");
    qs.append("format", "json");
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    if (typeof data === "object" && data !== null && "parse" in data) {
        const html = String(data.parse.text["*"]);
        return pretty(stripHtml(html));
    }
    return pretty(data);
}
export async function getRecentChanges(wiki, limit) {
    let url = `https://liquipedia.net/${encodeURIComponent(String(wiki))}/api.php`;
    const qs = new URLSearchParams();
    qs.append("action", "query");
    qs.append("list", "recentchanges");
    if (limit !== undefined)
        qs.append("rclimit", String(limit));
    qs.append("rcprop", "title|timestamp|user|comment");
    qs.append("format", "json");
    qs.append("formatversion", "2");
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getCategoryMembers(category, wiki, limit) {
    let url = `https://liquipedia.net/${encodeURIComponent(String(wiki))}/api.php`;
    const qs = new URLSearchParams();
    qs.append("action", "query");
    qs.append("list", "categorymembers");
    qs.append("cmtitle", "Category:" + category);
    if (limit !== undefined)
        qs.append("cmlimit", String(limit));
    qs.append("format", "json");
    qs.append("formatversion", "2");
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getBacklinks(title, wiki, limit) {
    let url = `https://liquipedia.net/${encodeURIComponent(String(wiki))}/api.php`;
    const qs = new URLSearchParams();
    qs.append("action", "query");
    qs.append("list", "backlinks");
    qs.append("bltitle", String(title));
    if (limit !== undefined)
        qs.append("bllimit", String(limit));
    qs.append("format", "json");
    qs.append("formatversion", "2");
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
// ---- muxC tools:
