/**
 * Trove (National Library of Australia) API v3 client. Needs TROVE_API_KEY
 * (free at https://trove.nla.gov.au/about/create-something/using-api).
 * Docs: https://trove.nla.gov.au/about/create-something/using-api
 */
const BASE = "https://api.trove.nla.gov.au/v3";
export class TroveError extends Error {
}
function headers() {
    const key = process.env.TROVE_API_KEY;
    if (!key)
        throw new TroveError("Set TROVE_API_KEY first (free at trove.nla.gov.au).");
    return { "User-Agent": "trove-mcp/1.0", Accept: "application/json", "X-API-KEY": key };
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: headers(),
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 401 || res.status === 403)
        throw new TroveError("Trove refused (401/403). Check TROVE_API_KEY.");
    if (res.status === 404)
        throw new TroveError("Not found.");
    if (!res.ok)
        throw new TroveError(`Trove error ${res.status}`);
    return (await res.json());
}
export async function searchRecords(query, category = "all", limit = 5) {
    if (!query.trim())
        throw new TroveError("Query is empty.");
    const qs = new URLSearchParams({ q: query.trim(), limit: String(Math.min(Math.max(limit, 1), 100)) });
    if (category.trim() && category.trim() !== "all")
        qs.set("category", category.trim());
    const data = await getJson(`/result?${qs}`);
    const cats = Array.isArray(data.category) ? data.category : [];
    const out = [];
    for (const c of cats) {
        const rows = Array.isArray(c.records?.work) ? c.records.work : [];
        for (const w of rows.slice(0, limit)) {
            out.push({
                id: w.id,
                title: w.title,
                category: c.name ?? c.code,
                date: w.issued ? String(w.issued).slice(0, 10) : undefined,
                snippet: w.snippet ? String(w.snippet).replace(/<[^>]+>/g, "").slice(0, 160) : undefined,
            });
            if (out.length >= limit)
                return out;
        }
    }
    return out;
}
export function formatRecord(r, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${r.id ?? "?"}] ${r.title ?? "(untitled)"}${r.category ? ` (${r.category})` : ""}${r.date ? ` — ${r.date}` : ""}${r.snippet ? `\n   ${r.snippet}` : ""}`;
}
// ---- muxB tools:
// Open Library is the Internet Archive's open catalogue. It needs no key and
// covers the same Australian books, editions and authors Trove holds.
const OL_BASE = "https://openlibrary.org";
async function olGet(path) {
    const res = await fetch(`${OL_BASE}${path}`, {
        headers: { "User-Agent": "trove-mcp/1.0 (openlibrary public API)", Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 429)
        throw new TroveError("Open Library rate limit reached, try again shortly.");
    if (res.status === 404)
        throw new TroveError("Not found in Open Library.");
    if (!res.ok)
        throw new TroveError(`Open Library error ${res.status}`);
    return (await res.json());
}
function olList(value, limit) {
    return Array.isArray(value) ? value.slice(0, limit).map((v) => String(v)) : [];
}
export async function catalogueSearch(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new TroveError("Query is empty.");
    const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);
    const fields = "key,title,author_name,first_publish_year,publisher,isbn,edition_count,language,has_fulltext,subject,number_of_pages_median,ratings_average,ratings_count";
    const data = await olGet(`/search.json?q=${encodeURIComponent(q)}&limit=${limit}&fields=${encodeURIComponent(fields)}`);
    const rows = Array.isArray(data.docs) ? data.docs : [];
    if (rows.length === 0)
        return `No books match "${q}".`;
    return [
        `Open Library books for "${q}" - ${Number(data.numFound ?? 0).toLocaleString()} match, showing ${rows.length}:`,
        ...rows.map((d, i) => {
            const authors = olList(d.author_name, 3);
            const publishers = olList(d.publisher, 2);
            const subjects = olList(d.subject, 3);
            const isbns = olList(d.isbn, 2);
            const rating = typeof d.ratings_average === "number" && d.ratings_average > 0
                ? `${d.ratings_average.toFixed(2)} from ${Number(d.ratings_count ?? 0).toLocaleString()} ratings`
                : "not rated";
            return [
                `${i + 1}. ${d.title ?? "(untitled)"}${authors.length ? ` by ${authors.join(", ")}${olList(d.author_name, 4).length > 3 ? ", +more" : ""}` : " (author not reported)"}`,
                `   first published ${d.first_publish_year ?? "not reported"} · ${Number(d.edition_count ?? 0).toLocaleString()} editions · ${d.language ? `language ${olList(d.language, 2).join(", ")}` : "language not reported"} · ${d.number_of_pages_median ? `${d.number_of_pages_median} pages` : "page count not reported"}`,
                `   publishers: ${publishers.length ? publishers.join("; ") : "not reported"}`,
                `   subjects: ${subjects.length ? subjects.join("; ") : "not reported"}`,
                `   ${d.has_fulltext === true ? "readable online" : "no readable copy"} · ${rating} · isbn ${isbns.length ? isbns.join(", ") : "not reported"}`,
                `   ${d.key ?? ""}`,
            ].join("\n");
        }),
    ].join("\n");
}
export async function authorSearch(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new TroveError("Query is empty.");
    const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);
    const data = await olGet(`/search/authors.json?q=${encodeURIComponent(q)}&limit=${limit}`);
    const rows = Array.isArray(data.docs) ? data.docs : [];
    if (rows.length === 0)
        return `No authors match "${q}".`;
    return [
        `Open Library authors for "${q}" - ${Number(data.numFound ?? 0).toLocaleString()} match, showing ${rows.length}:`,
        ...rows.map((a, i) => {
            const subjects = olList(a.top_subjects, 4);
            const rate = typeof a.ratings_average === "number" && a.ratings_average > 0 ? a.ratings_average.toFixed(2) : "not rated";
            return [
                `${i + 1}. ${a.name ?? "(unnamed author)"} [${a.key ?? "?"}]`,
                `   ${Number(a.work_count ?? 0).toLocaleString()} works · ${rate} from ${Number(a.ratings_count ?? 0).toLocaleString()} ratings`,
                `   best known work: ${a.top_work ?? "not reported"}`,
                `   subjects: ${subjects.length ? subjects.join("; ") : "not reported"}`,
                `   readers: ${Number(a.want_to_read_count ?? 0).toLocaleString()} want to read, ${Number(a.already_read_count ?? 0).toLocaleString()} finished, ${Number(a.currently_reading_count ?? 0).toLocaleString()} reading now`,
            ].join("\n");
        }),
    ].join("\n");
}
