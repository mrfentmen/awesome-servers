export class DocspellError extends Error {
    constructor(message) {
        super(message);
        this.name = "DocspellError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function base() {
    return (process.env.DOCSPELL_BASE_URL ?? "http://localhost:7880").replace(/\/$/, "");
}
function authHeaders() {
    const tok = process.env.DOCSPELL_AUTH_TOKEN;
    if (!tok)
        throw new DocspellError("Set the DOCSPELL_AUTH_TOKEN environment variable (POST /open/auth/login).");
    return { "X-Docspell-Auth": tok };
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(path, auth) {
    const res = await fetch(base() + path, { headers: { ...UA, ...(auth ? authHeaders() : {}) } });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new DocspellError(`HTTP ${res.status}: ${detail}`);
    }
    return pretty(data);
}
export function getVersion() {
    return req("/api/info/version", false);
}
export function searchItems(query) {
    return req(`/api/v1/sec/item/search?q=${encodeURIComponent(query)}`, true);
}
export function getItem(itemId) {
    return req(`/api/v1/sec/item/${encodeURIComponent(itemId)}`, true);
}
