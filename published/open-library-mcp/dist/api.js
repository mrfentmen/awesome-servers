const BASE = "https://openlibrary.org";
const headers = { "User-Agent": "mrfentmen-open-library-mcp/1.0 (https://github.com/mrfentmen)" };
export class OpenLibraryError extends Error {
}
async function request(path) {
    const res = await fetch(`${BASE}${path}`, { headers, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new OpenLibraryError(`Open Library error ${res.status}`);
    return (await res.json());
}
export function searchBooks(query, limit = 10) {
    return request(`/search.json?q=${encodeURIComponent(query)}&limit=${limit}`);
}
export function getWork(key) { return request(`/works/${key.replace(/^.*\/(works\/)?/, "").replace(/\.json$/, "")}.json`); }
export function getAuthor(key) { return request(`/authors/${key.replace(/^.*\/(authors\/)?/, "").replace(/\.json$/, "")}.json`); }
export function getEditions(key, limit = 20) { return request(`/works/${key.replace(/^.*\/(works\/)?/, "").replace(/\.json$/, "")}/editions.json?limit=${limit}`); }
export function formatBook(doc, index) {
    return [
        `${index === undefined ? "" : `${index + 1}. `}${doc.title ?? "Untitled"}`,
        doc.author_name?.length ? `Authors: ${doc.author_name.join(", ")}` : "",
        doc.first_publish_year ? `First published: ${doc.first_publish_year}` : "",
        doc.edition_count ? `Editions: ${doc.edition_count}` : "",
        doc.isbn?.length ? `ISBN: ${doc.isbn[0]}` : "",
        doc.key ? `Work: https://openlibrary.org${doc.key}` : "",
    ].filter(Boolean).join("\n");
}
export function formatWork(work) {
    const description = typeof work.description === "string" ? work.description : work.description?.value;
    return [`${work.title ?? "Untitled"}`, work.first_publish_date ? `First published: ${work.first_publish_date}` : "", description ? `Description: ${description.slice(0, 1400)}` : "", work.subjects?.length ? `Subjects: ${work.subjects.slice(0, 20).join(", ")}` : "", work.covers?.length ? `Cover: https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg` : ""].filter(Boolean).join("\n");
}
export function formatAuthor(author) { return [`${author.name ?? "Unknown author"}`, author.birth_date ? `Born: ${author.birth_date}` : "", author.death_date ? `Died: ${author.death_date}` : "", author.work_count ? `Works: ${author.work_count}` : "", author.top_work ? `Top work: ${author.top_work}` : "", typeof author.bio === "string" ? `Bio: ${author.bio.slice(0, 1200)}` : author.bio?.value ? `Bio: ${author.bio.value.slice(0, 1200)}` : ""].filter(Boolean).join("\n"); }
