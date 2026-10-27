export class GBooksError extends Error {
    constructor(message) {
        super(message);
        this.name = "GBooksError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://www.googleapis.com/books/v1";
async function req(path, params) {
    void params;
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json" } });
    }
    catch (e) {
        throw new GBooksError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new GBooksError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
function keyParams() {
    const k = process.env.GOOGLE_BOOKS_API_KEY;
    return k ? `&key=${encodeURIComponent(k)}` : "";
}
function slimVolume(v) {
    const info = (v.volumeInfo ?? {});
    const img = (info.imageLinks ?? {});
    return { id: v.id, title: info.title, authors: info.authors, publishedDate: info.publishedDate,
        description: typeof info.description === "string" ? info.description.slice(0, 600) : null,
        pageCount: info.pageCount, categories: info.categories, language: info.language,
        thumbnail: img.thumbnail ?? null, infoLink: info.infoLink ?? null };
}
export function searchBooks(query, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 40);
    return req(`/volumes?q=${encodeURIComponent(query)}&maxResults=${n}${keyParams()}`, {}).then((t) => {
        const d = JSON.parse(t);
        return JSON.stringify({ totalItems: d.totalItems ?? 0,
            volumes: ((d.items ?? []).map(slimVolume)) }, null, 2);
    });
}
// ---- muxF tools: Open Library, which needs no key ----
const OL = "https://openlibrary.org";
const OL_UA = { "User-Agent": "google-books-mcp/1.0 (https://github.com/mrfentmen)" };
async function olGet(path) {
    let res;
    try {
        res = await fetch(OL + path, { signal: AbortSignal.timeout(25000), headers: { ...OL_UA, Accept: "application/json" } });
    }
    catch (e) {
        throw new GBooksError(`Open Library network error: ${e.message}`);
    }
    if (res.status === 404)
        throw new GBooksError(`Open Library has no record at ${path.replace(/\?.*$/, "")}.`);
    if (!res.ok)
        throw new GBooksError(`Open Library answered HTTP ${res.status} for ${path.replace(/\?.*$/, "")}.`);
    return (await res.json());
}
function isbn10Ok(value) {
    let sum = 0;
    for (let i = 0; i < 10; i += 1) {
        const ch = value[i];
        const digit = ch === "X" ? 10 : Number(ch);
        if (!Number.isInteger(digit) || (ch === "X" && i !== 9))
            return false;
        sum += digit * (10 - i);
    }
    return sum % 11 === 0;
}
function isbn13Ok(value) {
    let sum = 0;
    for (let i = 0; i < 13; i += 1) {
        const digit = Number(value[i]);
        if (!Number.isInteger(digit))
            return false;
        sum += digit * (i % 2 === 0 ? 1 : 3);
    }
    return sum % 10 === 0;
}
const listText = (value, max = 8) => (Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean).slice(0, max) : []);
const asText = (value) => Array.isArray(value) ? value.filter(Boolean).join("; ") : (value ? String(value) : null);
export async function isbnLookup(isbn) {
    const digits = String(isbn ?? "").replace(/[^0-9Xx]/g, "").toUpperCase();
    if (digits.length !== 10 && digits.length !== 13)
        throw new GBooksError(`"${isbn ?? ""}" is not an ISBN: give 10 or 13 characters, e.g. 9780140449136.`);
    const ok = digits.length === 13 ? isbn13Ok(digits) : isbn10Ok(digits);
    if (!ok)
        throw new GBooksError(`ISBN ${digits} fails its own ${digits.length === 13 ? "mod-10" : "mod-11"} checksum, so no edition can carry it.`);
    const edition = (await olGet(`/isbn/${digits}.json`));
    if (edition.error)
        throw new GBooksError(`Open Library rejected ISBN ${digits}: ${String(edition.error).slice(0, 160)}`);
    const authorKeys = Array.isArray(edition.authors) ? edition.authors.map((a) => a?.key).filter(Boolean).slice(0, 3) : [];
    const authors = [];
    for (const key of authorKeys) {
        try {
            const a = (await olGet(`${key}.json`));
            if (a?.name)
                authors.push(a.name);
        }
        catch {
            authors.push(key.replace("/authors/", ""));
        }
    }
    const classes = edition.classifications ?? {};
    const dewey = listText(classes.dewey_decimal_class, 3);
    const lc = listText(classes.lc_classifications || edition.lc_classifications, 3);
    const subjects = listText(edition.subjects, 10);
    const covers = Array.isArray(edition.covers) ? edition.covers.filter((c) => Number(c) > 0).slice(0, 1) : [];
    const lines = [
        `ISBN ${digits} — checksum valid (${digits.length === 13 ? "ISBN-13" : "ISBN-10"})`,
        "",
        `Title: ${edition.title ?? "not recorded"}${edition.subtitle ? ` — ${edition.subtitle}` : ""}`,
        authors.length ? `Author(s): ${authors.join("; ")}` : "Author(s): not recorded on this edition",
        asText(edition.publishers) ? `Publisher: ${asText(edition.publishers)}` : "Publisher: not recorded",
        edition.publish_date ? `Published: ${edition.publish_date}` : "Published: not recorded",
        Number(edition.number_of_pages) > 0 ? `Pages: ${edition.number_of_pages}` : "Pages: not recorded",
        asText(edition.pagination) ? `Pagination: ${asText(edition.pagination)}` : "",
        dewey.length ? `Dewey: ${dewey.join(", ")}` : "",
        lc.length ? `LC classification: ${lc.join(", ")}` : "",
        subjects.length ? `Subjects: ${subjects.join("; ")}` : "Subjects: none recorded on the edition",
        edition.works?.[0]?.key ? `Work: ${olUrl(edition.works[0].key)}` : "",
        covers.length ? `Cover: https://covers.openlibrary.org/b/id/${covers[0]}-L.jpg` : "Cover: none recorded",
        "",
        "Note: Open Library records are community-contributed and often incomplete; a missing field here is not proof the book lacks it.",
    ];
    return lines.filter((line) => line !== "").join("\n");
}
function olUrl(key) {
    const path = String(key ?? "");
    return path.startsWith("http") ? path : `${OL}${path.startsWith("/") ? "" : "/"}${path}`;
}
export async function authorWorks(author, limit = 10) {
    const name = String(author ?? "").trim();
    if (!name)
        throw new GBooksError("Give an author name, e.g. Ursula Le Guin.");
    const n = Math.min(Math.max(Number(limit ?? 10) || 10, 1), 25);
    const found = (await olGet(`/search/authors.json?q=${encodeURIComponent(name)}&limit=3`));
    const people = Array.isArray(found.docs) ? found.docs : [];
    if (!people.length)
        throw new GBooksError(`Open Library knows no author matching "${name}".`);
    const person = people[0];
    const key = String(person.key ?? "").replace(/^\/authors\//, "");
    if (!key)
        throw new GBooksError(`Open Library returned no author key for "${name}".`);
    const fields = "key,title,first_publish_year,edition_count,ratings_average,ratings_count,author_name";
    const search = (await olGet(`/search.json?author_key=${encodeURIComponent(key)}&fields=${fields}&limit=${Math.min(n * 3, 100)}`));
    let works = (Array.isArray(search.docs) ? search.docs : []).filter((d) => d && d.title);
    if (!works.length) {
        const fallback = (await olGet(`/authors/${encodeURIComponent(key)}/works.json?limit=${Math.min(n * 2, 100)}`));
        works = (Array.isArray(fallback.entries) ? fallback.entries : []).map((w) => ({ ...w, key: w.key }));
    }
    if (!works.length)
        throw new GBooksError(`Open Library lists no works for ${person.name ?? name}.`);
    works.sort((a, b) => (Number(a.first_publish_year) || 9999) - (Number(b.first_publish_year) || 9999));
    const shown = works.slice(0, n);
    const total = Number(search.numFound) > 0 ? Number(search.numFound) : works.length;
    const others = people.slice(1).map((p) => p.name).filter(Boolean).slice(0, 3);
    const rated = shown.filter((w) => Number(w.ratings_average) > 0 && Number(w.ratings_count) > 0);
    const best = rated.sort((a, b) => Number(b.ratings_average) - Number(a.ratings_average))[0] ?? null;
    return [
        `${person.name ?? name}${person.birth_date ? ` (b. ${person.birth_date})` : ""} — ${total} work(s) on Open Library, showing ${shown.length}`,
        person.top_work ? `Best known for: ${person.top_work}` : "",
        others.length ? `Other authors matching "${name}": ${others.join(", ")} — narrow the name if that is not who you meant.` : "",
        "",
        ...shown.map((w, i) => {
            const year = w.first_publish_year ?? "year unknown";
            const editions = Number(w.edition_count) > 0 ? `${w.edition_count} edition(s)` : "edition count not recorded";
            const rating = Number(w.ratings_average) > 0 && Number(w.ratings_count) > 0
                ? `${Number(w.ratings_average).toFixed(2)}/5 from ${w.ratings_count}`
                : "unrated";
            return `${i + 1}. ${w.title} — ${year} — ${editions} — ${rating}`;
        }),
        "",
        best ? `Best rated on this page: ${best.title} at ${Number(best.ratings_average).toFixed(2)}/5 (${best.ratings_count} rating(s)).` : "None of these works carries a reader rating.",
        "Note: years are first publication anywhere; edition counts and ratings come from Open Library contributors and are sparse for older or non-English works.",
    ].filter((line) => line !== "").join("\n");
}
export function getVolume(volumeId) {
    return req(`/volumes/${encodeURIComponent(volumeId)}?${keyParams().replace(/^&/, "")}`, {}).then((t) => {
        const v = JSON.parse(t);
        if (v.error)
            throw new GBooksError(`API error: ${JSON.stringify(v.error).slice(0, 200)}`);
        return JSON.stringify(slimVolume(v), null, 2);
    });
}
