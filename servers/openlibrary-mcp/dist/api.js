export class OpenLibraryError extends Error {
    constructor(message) {
        super(message);
        this.name = "OpenLibraryError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://openlibrary.org";
async function req(path, params) {
    void params;
    let res;
    try {
        res = await fetch(BASE + path, { headers: { ...UA, Accept: "application/json" } });
    }
    catch (e) {
        throw new OpenLibraryError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new OpenLibraryError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
async function get(path) {
    return req(path, {});
}
export function searchBooks(query, limit) {
    const p = new URLSearchParams({ q: query, limit: limit ?? "10" });
    return get(`/search.json?${p.toString()}`).then((t) => pick(t));
}
export function getWork(workId) {
    const id = workId.startsWith("/works/") ? workId : `/works/${workId}`;
    return get(`${id}.json`);
}
export function getAuthor(authorId) {
    const id = authorId.startsWith("/authors/") ? authorId : `/authors/${authorId}`;
    return req(`${id}.json`, {});
}
function pick(text) {
    try {
        const d = JSON.parse(text);
        const docs = Array.isArray(d.docs) ? d.docs : [];
        const slim = docs.slice(0, 25).map((b) => ({
            title: b.title,
            author_name: b.author_name,
            first_publish_year: b.first_publish_year,
            key: b.key,
            cover_i: b.cover_i,
        }));
        return JSON.stringify({ numFound: d.numFound, docs: slim }, null, 2);
    }
    catch {
        return text.slice(0, 4000);
    }
}
