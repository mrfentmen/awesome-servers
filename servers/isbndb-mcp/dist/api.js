export class IsbndbError extends Error {
    constructor(message) {
        super(message);
        this.name = "IsbndbError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new IsbndbError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    return { Authorization: envStrict("ISBNDB_API_KEY") };
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
        throw new IsbndbError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getBook(isbn) {
    let url = `https://api2.isbndb.com/book/${encodeURIComponent(String(isbn))}`;
    const data = await req(url);
    return pretty(data);
}
export async function searchBooks(query, page) {
    let url = `https://api2.isbndb.com/books/${encodeURIComponent(String(query))}`;
    const qs = new URLSearchParams();
    if (page !== undefined)
        qs.append("page", String(page));
    qs.append("pageSize", "20");
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getBooksBatch(isbns) {
    let url = `https://api2.isbndb.com/books`;
    const list = isbns.split(',').map((x) => x.trim()).filter(Boolean);
    const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isbns: list }) });
    return pretty(data);
}
