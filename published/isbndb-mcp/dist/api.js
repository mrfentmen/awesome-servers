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
const clean = (value) => value.replace(/_/g, " ").replace(/\s+/g, " ").trim();
// ---- muxF tools:
const LOC_BASE = "https://www.loc.gov/books/";
const WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const WIKI_SEARCH = "https://en.wikipedia.org/w/api.php";
// These two tools use sources that need no ISBNdb key, so they must not go
// through req(), which insists on ISBNDB_API_KEY.
async function publicJson(url, label) {
    let res;
    try {
        res = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { ...UA, Accept: "application/json" } });
    }
    catch (e) {
        throw new IsbndbError(`${label} could not be reached: ${errorMessage(e)}`);
    }
    if (res.status === 404)
        return null;
    if (!res.ok)
        throw new IsbndbError(`${label} returned HTTP ${res.status}`);
    return res.json();
}
function asArray(value) {
    if (Array.isArray(value))
        return value.map((x) => String(x).trim()).filter(Boolean);
    if (value === undefined || value === null)
        return [];
    const s = String(value).trim();
    return s ? [s] : [];
}
function isRestricted(value) {
    if (typeof value === "boolean")
        return value;
    return String(value ?? "").toLowerCase() === "true";
}
export async function locCatalog(query, limit) {
    const q = String(query ?? "").trim();
    if (!q)
        throw new IsbndbError("Give a title, author or subject to search the Library of Congress for.");
    const n = Math.min(Math.max(Number(limit ?? 5) || 5, 1), 20);
    const url = `${LOC_BASE}?q=${encodeURIComponent(q)}&fo=json&c=${n}`;
    const data = await publicJson(url, "The Library of Congress");
    const results = Array.isArray(data?.results) ? data.results : [];
    if (!results.length)
        throw new IsbndbError(`The Library of Congress has no catalog record matching "${q}".`);
    const records = results.slice(0, n).map((r) => ({
        title: r.title ?? null,
        contributors: asArray(r.contributor).slice(0, 6),
        date: r.date ?? null,
        subjects: asArray(r.subject).slice(0, 8),
        lccn: r.item?.lccn ?? r.lccn ?? null,
        language: asArray(r.language),
        access_restricted: isRestricted(r.access_restricted),
        url: r.id ?? r.url ?? null,
    }));
    const matched = Number(data?.pagination?.of ?? results.length);
    return pretty({
        source: "Library of Congress",
        query: q,
        matched,
        returned: records.length,
        records,
        note: "Bibliographic records from the Library of Congress catalogue; access_restricted marks records the library restricts to on-site use.",
    });
}
async function wikiSummary(title) {
    const page = await publicJson(`${WIKI_SUMMARY}${encodeURIComponent(title.replace(/\s+/g, "_"))}`, "Wikipedia");
    if (page && page.extract)
        return page;
    const found = await publicJson(`${WIKI_SEARCH}?action=query&list=search&srsearch=${encodeURIComponent(title)}&format=json&srlimit=1`, "Wikipedia");
    const hit = found?.query?.search?.[0]?.title;
    if (!hit)
        return null;
    const fallback = await publicJson(`${WIKI_SUMMARY}${encodeURIComponent(hit.replace(/\s+/g, "_"))}`, "Wikipedia");
    return fallback && fallback.extract ? fallback : null;
}
export async function bookBackground(title) {
    const t = String(title ?? "").trim();
    if (!t)
        throw new IsbndbError("Give a book title or an author name, e.g. The Dispossessed.");
    const page = await wikiSummary(t);
    if (!page)
        throw new IsbndbError(`Wikipedia has no article for "${t}", so there is no background to summarise.`);
    const heading = page.description ? `${page.title} — ${page.description}` : String(page.title ?? t);
    const extract = String(page.extract ?? "").trim();
    const edited = page.timestamp ? String(page.timestamp).slice(0, 10) : "unknown";
    const parts = [
        heading,
        extract.slice(0, 1500) + (extract.length > 1500 ? " …" : ""),
        `Last edited ${edited} (revision ${page.revision ?? "n/a"}).`,
        page.content_urls?.desktop?.page ? `Read more: ${page.content_urls.desktop.page}` : "",
        "Text from Wikipedia, licensed CC BY-SA 4.0.",
    ].filter(Boolean);
    return parts.join("\n\n");
}
