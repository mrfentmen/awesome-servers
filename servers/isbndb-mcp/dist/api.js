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
    const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init });
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
// ---- muxG tools:
const LOC_BOOKS = "https://www.loc.gov/books/";
const WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary";
async function isbndbJson(url, accept = "application/json") {
    const res = await fetch(url, { headers: { ...UA, Accept: accept }, signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new Error(`Upstream returned ${res.status}`);
    const text = await res.text();
    if (!text.trim())
        throw new Error("Upstream returned an empty body.");
    return JSON.parse(text);
}
/** Catalog records from the Library of Congress, which publishes its MARC data without a key. */
export async function locCatalog(args) {
    const query = String(args?.query ?? "").trim();
    if (!query)
        throw new Error("Provide a title, author or subject to search for.");
    const n = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
    const url = `${LOC_BOOKS}?q=${encodeURIComponent(query)}&fo=json&c=${n}&sp=1`;
    const data = await isbndbJson(url);
    const rows = Array.isArray(data.results) ? data.results : [];
    if (!rows.length)
        return `The Library of Congress catalog has no book record for "${query}".`;
    const lines = [`Library of Congress catalog results for "${query}": ${data.pagination?.total ?? rows.length} match(es), showing ${rows.length}`];
    for (const [i, row] of rows.entries()) {
        lines.push(`  ${i + 1}. ${row.title ?? "title not reported"}${row.date ? ` (${row.date})` : ""}`);
        if (row.contributor?.length)
            lines.push(`     contributor: ${row.contributor.slice(0, 3).join("; ")}`);
        if (row.description?.length)
            lines.push(`     ${row.description.slice(0, 2).join(" | ").slice(0, 200)}`);
        if (row.subject?.length)
            lines.push(`     subjects: ${row.subject.slice(0, 6).join("; ")}`);
        lines.push(`     LCCN ${row.number_lccn ?? "not reported"} · language ${(row.language ?? []).join(", ") || "not reported"}${row.access_restricted === true ? " · access restricted in the reading room" : ""}`);
        lines.push(`     ${row.id ?? "record id not reported"}`);
    }
    return lines.join("\n");
}
const clean = (value) => value.replace(/_/g, " ").replace(/\s+/g, " ").trim();
/** The short encyclopaedia summary of a book or an author, for context an ISBN record never carries. */
export async function bookBackground(args) {
    const title = String(args?.title ?? "").trim();
    if (!title)
        throw new Error("Provide a book title or an author name to look up on Wikipedia.");
    const slug = encodeURIComponent(title.replace(/\s+/g, "_"));
    const data = await isbndbJson(`${WIKI_SUMMARY}/${slug}`);
    if (!data || !data.title)
        throw new Error(`Wikipedia has no article at that title: "${title}".`);
    const page = data.content_urls?.desktop?.page;
    return [
        `${data.title}${data.description ? ` - ${data.description}` : ""}`,
        `${data.extract ?? "No extract published."}`,
        "",
        `Language ${data.lang ?? "not reported"} · article revision ${data.revision ?? "not reported"} · edited ${data.timestamp ?? "not reported"}`,
        page ? `Read more: ${page}` : "Read more: link not reported",
        "Wikipedia is crowd-written; treat this as a pointer, not as a bibliographic fact.",
    ].join("\n");
}
