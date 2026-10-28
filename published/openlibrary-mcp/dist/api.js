/**
 * Open Library — keyless public API client.
 */
const BASE = "https://openlibrary.org";
const SOURCE = "Open Library";
const UA = "openlibrary-mcp";
export class SourceError extends Error {
}
async function request(path, init, timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            ...init,
            signal: ctrl.signal,
            headers: {
                "user-agent": UA,
                accept: "application/json",
                ...init?.headers,
            },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path, init) {
    const res = await request(path, init);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
export function section(title, rows) {
    return [title, ...rows.filter(Boolean)].join("\n");
}
export async function search_books(a) {
    const query = clean(a.query);
    if (query.length < 2)
        throw new SourceError("query must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 20);
    const d = await getJson(`/search.json?q=${encodeURIComponent(query)}&limit=${limit}`);
    const docs = Array.isArray(d?.docs) ? d.docs : [];
    if (!docs.length)
        return `Open Library has no book matching "${query}".`;
    return section(`${d?.numFound ?? docs.length} book(s) match "${query}"`, docs.map((b, i) => `${i + 1}. ${clean(b.title)}${Array.isArray(b.author_name) && b.author_name.length ? " — " + b.author_name.slice(0, 2).join(", ") : ""} · ${clean(b.first_publish_year) || "no year"} · ${clean(b.key)}`));
}
export async function work(a) {
    let id = clean(a.workId);
    if (!id.includes("/"))
        id = "/works/" + id;
    if (!/^\/works\/[A-Z0-9]+$/i.test(id))
        throw new SourceError("workId must look like OL893414W");
    let d = await getJson(`${id}.json`);
    if (d?.type?.key === "/type/redirect" && d?.location)
        d = await getJson(`${clean(d.location)}.json`);
    const desc = typeof d?.description === "string" ? d.description : clean(d?.description?.value);
    return section(clean(d?.title) || id, [
        bullet("First published", d?.first_publish_date),
        bullet("Subjects", Array.isArray(d?.subjects) ? d.subjects.slice(0, 8).join(", ") : ""),
        bullet("Description", desc.slice(0, 600)),
    ]);
}
export async function author(a) {
    let id = clean(a.authorId);
    if (!id.includes("/"))
        id = "/authors/" + id;
    if (!/^\/authors\/[A-Z0-9]+$/i.test(id))
        throw new SourceError("authorId must look like OL25712A");
    const d = await getJson(`${id}.json`);
    if (!d?.name)
        throw new SourceError(`Open Library has no author ${id}`);
    const bio = typeof d.bio === "string" ? d.bio : clean(d.bio?.value);
    return section(clean(d.name), [bullet("Born", d.birth_date), bullet("Died", d.death_date), bullet("Bio", bio.slice(0, 600))]);
}
export async function isbn_lookup(a) {
    const isbn = clean(a.isbn).replace(/[^0-9Xx]/g, "");
    if (isbn.length !== 10 && isbn.length !== 13)
        throw new SourceError("isbn must be 10 or 13 digits");
    const d = await getJson(`/isbn/${isbn}.json`);
    if (!d?.title)
        throw new SourceError(`Open Library has no edition for ISBN ${isbn}`);
    return section(clean(d.title), [
        bullet("Published", d.publish_date),
        bullet("Publishers", Array.isArray(d.publishers) ? d.publishers.join(", ") : d.publishers),
        bullet("Pages", d.number_of_pages),
        bullet("Authors", Array.isArray(d.authors) ? d.authors.map((x) => clean(x.key)).join(", ") : ""),
    ]);
}
export async function subject(a) {
    const subject = clean(a.subject).toLowerCase().replace(/\s+/g, "_");
    if (subject.length < 2)
        throw new SourceError("subject is required");
    const limit = clampLimit(a.limit, 10, 20);
    const d = await getJson(`/subjects/${encodeURIComponent(subject)}.json?limit=${limit}`);
    const works = Array.isArray(d?.works) ? d.works : [];
    if (!works.length)
        return `Open Library has no works for subject "${subject}".`;
    return section(`${d?.work_count ?? works.length} work(s) in ${clean(d?.name) || subject}`, works.slice(0, limit).map((w, i) => `${i + 1}. ${clean(w.title)} · ${clean(w.edition_count)} edition(s)`));
}
