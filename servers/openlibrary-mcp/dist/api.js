export class OpenLibraryError extends Error {
    constructor(message) {
        super(message);
        this.name = "OpenLibraryError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = "mrfentmen-openlibrary-mcp/1.0 (https://github.com/mrfentmen)";
const BASE = "https://openlibrary.org";
const COVERS = "https://covers.openlibrary.org/b/id";
/**
 * Open Library answers some merged/deleted IDs with a 200 redirect record
 * ({"type":{"/type/redirect"},"location":"/works/OL...W"}) instead of a 404,
 * so follow those before giving up.
 */
async function req(path) {
    let target = path;
    for (let hop = 0; hop < 4; hop++) {
        let res;
        try {
            res = await fetch(BASE + target, {
                headers: { "User-Agent": UA, Accept: "application/json" },
                signal: AbortSignal.timeout(20000),
            });
        }
        catch (e) {
            throw new OpenLibraryError(`Network error: ${e.message}`);
        }
        if (res.status === 404)
            throw new OpenLibraryError(`Not found (404) for ${target}`);
        if (!res.ok) {
            const body = (await res.text()).slice(0, 300);
            throw new OpenLibraryError(`HTTP ${res.status}: ${body}`);
        }
        const data = await res.json();
        const location = typeof data?.location === "string" ? data.location : "";
        if (data?.type?.key === "/type/redirect" && location) {
            // location is a path like "/works/OL893414W"; strip a trailing .json if present.
            target = `${location.replace(/\.json$/, "")}.json`;
            continue;
        }
        return data;
    }
    throw new OpenLibraryError(`Too many redirects for ${path}`);
}
function textOf(value) {
    if (typeof value !== "object" || value === null)
        return "";
    const row = value;
    return "value" in row ? String(row.value) : "";
}
/** Open Library returns descriptions/bios as a string or as { value: string }. */
function asText(value, max = 800) {
    const raw = typeof value === "string" ? value : textOf(value);
    const clean = raw.replace(/\r/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\n{3,}/g, "\n\n").trim();
    if (!clean)
        return "";
    return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}
const idPart = (id, prefix) => id.replace(`${prefix}/`, "").replace(/^\//, "").trim();
const keyToString = (key) => (typeof key === "string" ? key.replace(/^\//, "") : "");
// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
async function search(params) {
    const d = await req(`/search.json?${params.toString()}`);
    const docs = Array.isArray(d?.docs) ? d.docs : [];
    if (!docs.length)
        return "No books found.";
    const head = `${(d?.numFound ?? docs.length).toLocaleString()} match(es), showing ${docs.length}:`;
    return (`${head}\n` +
        docs
            .map((b, i) => {
            const authors = (b.author_name ?? []).slice(0, 3).join(", ");
            const bits = [
                authors || "unknown author",
                b.first_publish_year ? `${b.first_publish_year}` : "",
                b.edition_count ? `${b.edition_count} edition(s)` : "",
            ].filter(Boolean);
            const cover = b.cover_i ? `\n   cover: ${COVERS}/${b.cover_i}-M.jpg` : "";
            return `${i + 1}. ${b.title ?? "Untitled"} — ${bits.join(" | ")}\n   work: ${b.key ?? "?"}${cover}`;
        })
            .join("\n"));
}
export function searchBooks(query, limit = 10) {
    const p = new URLSearchParams({ q: query, limit: String(Math.min(Math.max(limit, 1), 25)) });
    return search(p);
}
export function searchByAuthor(name, limit = 10) {
    const p = new URLSearchParams({ author: name, limit: String(Math.min(Math.max(limit, 1), 25)) });
    return search(p);
}
export function searchBySubject(subject, limit = 10) {
    const p = new URLSearchParams({ subject, limit: String(Math.min(Math.max(limit, 1), 25)) });
    return search(p);
}
// ---------------------------------------------------------------------------
// Single records
// ---------------------------------------------------------------------------
export async function getWork(workId) {
    const id = idPart(workId, "/works/");
    const w = await req(`/works/${encodeURIComponent(id)}.json`);
    const lines = [`${w?.title ?? "Untitled"} (works/${id})`];
    const desc = asText(w?.description);
    if (desc)
        lines.push("", desc);
    const subjects = Array.isArray(w?.subjects) ? w.subjects.slice(0, 12) : [];
    if (subjects.length)
        lines.push("", `Subjects: ${subjects.join(", ")}`);
    const meta = [];
    if (w?.first_publish_date)
        meta.push(`First published: ${w.first_publish_date}`);
    if (Array.isArray(w?.covers) && w.covers.length)
        meta.push(`Cover: ${COVERS}/${w.covers[0]}-L.jpg`);
    if (meta.length)
        lines.push("", meta.join("\n"));
    const first = asText(w?.first_sentence, 300);
    if (first)
        lines.push("", `First sentence: ${first}`);
    return lines.join("\n");
}
export async function getEdition(editionId) {
    const id = idPart(editionId, "/books/");
    const b = await req(`/books/${encodeURIComponent(id)}.json`);
    const lines = [`${b?.title ?? "Untitled"} (books/${id})`];
    const meta = [];
    const authors = Array.isArray(b?.authors)
        ? b.authors.map((a) => keyToString(a?.key)).filter(Boolean)
        : [];
    if (authors.length)
        meta.push(`Authors: ${authors.join(", ")}`);
    if (b?.publish_date)
        meta.push(`Published: ${b.publish_date}`);
    if (Array.isArray(b?.publishers) && b.publishers.length)
        meta.push(`Publisher: ${b.publishers.join(", ")}`);
    if (b?.number_of_pages)
        meta.push(`Pages: ${b.number_of_pages}`);
    const isbn = [...(b?.isbn_13 ?? []), ...(b?.isbn_10 ?? [])];
    if (isbn.length)
        meta.push(`ISBN: ${isbn.slice(0, 6).join(", ")}`);
    const langs = Array.isArray(b?.languages) ? b.languages.map((l) => keyToString(l?.key).replace("languages/", "")).filter(Boolean) : [];
    if (langs.length)
        meta.push(`Languages: ${langs.join(", ")}`);
    if (Array.isArray(b?.covers) && b.covers[0])
        meta.push(`Cover: ${COVERS}/${b.covers[0]}-L.jpg`);
    if (meta.length)
        lines.push("", ...meta);
    return lines.join("\n");
}
export async function getAuthor(authorId) {
    const id = idPart(authorId, "/authors/");
    const a = await req(`/authors/${encodeURIComponent(id)}.json`);
    const lines = [`${a?.name ?? "Unknown author"} (authors/${id})`];
    const meta = [];
    if (a?.birth_date)
        meta.push(`Born: ${a.birth_date}`);
    if (a?.death_date)
        meta.push(`Died: ${a.death_date}`);
    if (Array.isArray(a?.alternate_names) && a.alternate_names.length) {
        meta.push(`Also known as: ${a.alternate_names.slice(0, 5).join(", ")}`);
    }
    if (meta.length)
        lines.push("", ...meta);
    const bio = asText(a?.bio, 900);
    if (bio)
        lines.push("", bio);
    const links = Array.isArray(a?.links) ? a.links.filter((l) => l?.url).slice(0, 3) : [];
    if (links.length)
        lines.push("", "Links:", ...links.map((l) => `  ${l.title ?? l.url}: ${l.url}`));
    return lines.join("\n");
}
export async function authorWorks(authorId, limit = 20) {
    const id = idPart(authorId, "/authors/");
    const d = await req(`/authors/${encodeURIComponent(id)}/works.json?limit=${Math.min(Math.max(limit, 1), 50)}`);
    const entries = Array.isArray(d?.entries) ? d.entries : [];
    if (!entries.length)
        return `No works listed for ${id}.`;
    return (`${(d?.size ?? entries.length).toLocaleString()} work(s) by ${id}, showing ${entries.length}:\n` +
        entries
            .map((w, i) => {
            const year = typeof w?.first_publish_date === "string" ? ` (${w.first_publish_date.slice(0, 4)})` : "";
            return `${i + 1}. ${w?.title ?? "Untitled"}${year} — ${keyToString(w?.key)}`;
        })
            .join("\n"));
}
/**
 * An ISBN carries a check digit, so a mistyped one can be rejected before a
 * request is spent on it.
 */
function normalizeIsbn(input) {
    const clean = (input ?? "").replace(/[^0-9Xx]/g, "").toUpperCase();
    if (clean.length === 10) {
        if (!/^[0-9]{9}[0-9X]$/.test(clean))
            throw new OpenLibraryError(`"${input}" is not a valid ISBN-10.`);
        let sum = 0;
        for (let i = 0; i < 10; i++)
            sum += (clean[i] === "X" ? 10 : Number(clean[i])) * (10 - i);
        if (sum % 11 !== 0)
            throw new OpenLibraryError(`ISBN-10 "${clean}" fails its check digit, so it is a typo.`);
        return clean;
    }
    if (clean.length === 13) {
        if (!/^[0-9]{13}$/.test(clean))
            throw new OpenLibraryError(`"${input}" is not a valid ISBN-13.`);
        let sum = 0;
        for (let i = 0; i < 13; i++)
            sum += Number(clean[i]) * (i % 2 === 0 ? 1 : 3);
        if (sum % 10 !== 0)
            throw new OpenLibraryError(`ISBN-13 "${clean}" fails its check digit, so it is a typo.`);
        return clean;
    }
    throw new OpenLibraryError(`"${input}" has ${clean.length} digit(s); an ISBN has 10 or 13.`);
}
const asList = (value, max = 4) => (value ?? []).slice(0, max).join(", ");
const languageList = (languages) => (languages ?? [])
    .map((l) => (l.key ?? "").replace("/languages/", ""))
    .filter(Boolean)
    .slice(0, 8)
    .join(", ");
/** Resolve an ISBN to its edition record, without walking through search first. */
export async function editionByIsbn(args) {
    const isbn = normalizeIsbn(args.isbn);
    const edition = await req(`/isbn/${isbn}.json`);
    const authors = (edition.authors ?? []).map((a) => keyToString(a.key)).filter(Boolean);
    const cover = (edition.covers ?? []).find((id) => id > 0);
    return [
        `Edition for ISBN ${isbn}`,
        `  ${edition.title ?? "Untitled"}${edition.subtitle ? `: ${edition.subtitle}` : ""}`,
        `  format: ${edition.physical_format ?? edition.edition_name ?? "not stated"} | pages: ${edition.number_of_pages ?? "not stated"}`,
        `  published: ${edition.publish_date ?? "not stated"}${edition.publish_places?.length ? ` in ${asList(edition.publish_places, 3)}` : ""}`,
        `  publisher(s): ${asList(edition.publishers) || "not stated"}`,
        authors.length ? `  author record(s): ${authors.map((k) => `/${k}`).join(", ")}` : `  by: ${edition.by_statement ?? "not stated"}`,
        `  work: ${keyToString(edition.works?.[0]?.key) || "not linked"}`,
        `  ISBN-13: ${asList(edition.isbn_13, 3) || "none"} | ISBN-10: ${asList(edition.isbn_10, 2) || "none"}`,
        cover ? `  cover: ${COVERS}/${cover}-L.jpg` : "  no cover on this edition",
        edition.ocaid ? `  scanned copy: https://archive.org/details/${edition.ocaid}` : "",
    ].filter((line) => line !== "").join("\n");
}
/**
 * Every edition Open Library knows for a work — the answer to "is there a later
 * or translated printing", which a single work record does not contain.
 */
export async function workEditions(args) {
    const id = idPart(args.workId, "/works/");
    if (!id)
        throw new OpenLibraryError("Give a work id such as OL27448W.");
    const limit = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 50);
    const d = await req(`/works/${encodeURIComponent(id)}/editions.json?limit=${limit}`);
    const entries = Array.isArray(d.entries) ? d.entries : [];
    if (!entries.length)
        return `Work ${id} has no editions listed.`;
    const total = typeof d.size === "number" ? d.size : entries.length;
    const years = entries
        .map((e) => Number(String(e.publish_date ?? "").match(/\d{4}/)?.[0] ?? 0))
        .filter((y) => y > 0)
        .sort((a, b) => a - b);
    const publishers = [...new Set(entries.flatMap((e) => e.publishers ?? []))].slice(0, 10);
    return [
        `Editions of work ${id}: ${total.toLocaleString()} listed, showing ${entries.length}`,
        years.length ? `  publication years in this page: ${years[0]} to ${years[years.length - 1]}` : "  no dated editions in this page",
        publishers.length ? `  publishers: ${publishers.join(", ")}` : "",
        "",
        ...entries.map((e, i) => {
            const bits = [
                e.publish_date ?? "",
                asList(e.publishers, 1) || "",
                e.number_of_pages ? `${e.number_of_pages}pp` : "",
                languageList(e.languages) || "",
            ].filter(Boolean);
            return `${i + 1}. ${e.title ?? "Untitled"} — ${bits.join(" | ") || "no details"}\n   edition: ${keyToString(e.key) || "?"}`;
        }),
        total > entries.length ? `\nRaise limit (max 50) to see more than ${entries.length} of ${total.toLocaleString()}.` : "",
    ].filter((line) => line !== "").join("\n");
}
/** A subject as an entity: how many works it holds and which ones Open Library ranks first. */
export async function subjectOverview(args) {
    const slug = (args.subject ?? "").trim().toLowerCase().replace(/\s+/g, "_").replace(/^\/subjects\//, "");
    if (!slug)
        throw new OpenLibraryError("Give a subject, e.g. 'science fiction' or 'cooking'.");
    const limit = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 25);
    const d = await req(`/subjects/${encodeURIComponent(slug)}.json?limit=${limit}`);
    const works = Array.isArray(d.works) ? d.works : [];
    if (typeof d.work_count !== "number" && !works.length)
        throw new OpenLibraryError(`Open Library has no subject "${args.subject}".`);
    return [
        `Subject "${d.name ?? slug}" (${d.subject_type ?? "subject"})`,
        `  works: ${typeof d.work_count === "number" ? d.work_count.toLocaleString() : "unknown"}`,
        "",
        works.length ? "Top works:" : "No works listed for this subject.",
        ...works.map((w, i) => {
            const authors = (w.authors ?? []).map((a) => a.name).filter(Boolean).slice(0, 2).join(", ");
            return `${i + 1}. ${w.title ?? "Untitled"}${authors ? ` — ${authors}` : ""}${w.first_publish_year ? ` (${w.first_publish_year})` : ""}\n   work: ${keyToString(w.key) || "?"}`;
        }),
    ].join("\n");
}
// ---- muxG tools:
const OL_API = "https://openlibrary.org";
const OL_FACET_CAP = 8;
function olBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
async function olJson(url, accept = "application/json") {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept }, signal: AbortSignal.timeout(30000) });
    if (res.status === 404)
        throw new Error(`Open Library has no record at ${url.replace(OL_API, "")}`);
    if (!res.ok)
        throw new Error(`Open Library returned ${res.status}`);
    return (await res.json());
}
/** A real aggregation over a search: who publishes this, when it appears, in what language. */
export async function searchFacets(args) {
    const query = String(args.query ?? "").trim();
    if (!query)
        throw new Error("query is empty, for example \"time travel\" or \"sea monsters\".");
    const limit = olBound(args.limit, 5, 100, 40);
    const d = await olJson(`${OL_API}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=title,author_name,first_publish_year,publisher,language,subject,edition_count`);
    const docs = d.docs ?? [];
    if (!docs.length)
        return [`No Open Library work matches "${query}".`].join("\n");
    const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    const publishers = new Map();
    const languages = new Map();
    const subjects = new Map();
    const authors = new Map();
    const decades = new Map();
    let years = 0;
    let noYear = 0;
    let editions = 0;
    for (const doc of docs) {
        for (const p of toArray(doc.publisher))
            publishers.set(p, (publishers.get(p) ?? 0) + 1);
        for (const l of toArray(doc.language))
            languages.set(l, (languages.get(l) ?? 0) + 1);
        for (const s of toArray(doc.subject))
            subjects.set(s, (subjects.get(s) ?? 0) + 1);
        for (const a of toArray(doc.author_name))
            authors.set(a, (authors.get(a) ?? 0) + 1);
        if (typeof doc.first_publish_year === "number" && doc.first_publish_year > 1400) {
            const decade = Math.floor(doc.first_publish_year / 10) * 10;
            decades.set(decade, (decades.get(decade) ?? 0) + 1);
            years += 1;
        }
        else {
            noYear += 1;
        }
        editions += doc.edition_count ?? 0;
    }
    const top = (m, n = OL_FACET_CAP) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `  ${String(v).padStart(3)}  ${k.slice(0, 64)}`);
    const spread = decades.size ? `${Math.min(...decades.keys())}s to ${Math.max(...decades.keys())}s` : "not reported";
    const span = decades.size > 1 ? Math.max(...decades.keys()) - Math.min(...decades.keys()) : 0;
    return [
        `Open Library facets for "${query}"`,
        `${(d.numFound ?? docs.length).toLocaleString("en-US")} work(s) match; aggregated over the first ${docs.length}`,
        `First-publish years present for ${years} of them, ${noYear} with no year recorded, spanning ${spread} (${span} year(s) of decade buckets)`,
        `Editions across those works: ${editions.toLocaleString("en-US")}`,
        "",
        "Publishers in the sample:",
        ...top(publishers),
        "",
        "Languages in the sample:",
        ...top(languages),
        "",
        "Most frequent subjects:",
        ...top(subjects, 10),
        "",
        "Most frequent authors:",
        ...top(authors, 6),
        "",
        "When these works first appeared, by decade:",
        ...[...decades.entries()].sort((a, b) => a[0] - b[0]).map(([decade, n]) => `  ${String(n).padStart(3)}  ${decade}s`),
        "",
        "This is a sample, not the whole result set, and the sample is ordered by Open Library's own relevance, so these counts describe what it chose to show you. A publisher with many imprints shows up split across several rows.",
    ].join("\n");
}
