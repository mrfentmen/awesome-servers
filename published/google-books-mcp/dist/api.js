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
export function getVolume(volumeId) {
    return req(`/volumes/${encodeURIComponent(volumeId)}?${keyParams().replace(/^&/, "")}`, {}).then((t) => {
        const v = JSON.parse(t);
        if (v.error)
            throw new GBooksError(`API error: ${JSON.stringify(v.error).slice(0, 200)}`);
        return JSON.stringify(slimVolume(v), null, 2);
    });
}
