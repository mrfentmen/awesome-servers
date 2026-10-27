const BASE = "https://www.googleapis.com/books/v1";
const UA = "mrfentmen-books-mcp/1.0 (https://github.com/mrfentmen)";
export class BooksError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    if (res.status === 429)
        throw new BooksError("Google Books quota temporarily exhausted, wait and retry");
    if (!res.ok)
        throw new BooksError(`Google Books error ${res.status}`);
    return (await res.json());
}
function fmtVol(v) {
    const vi = v?.volumeInfo ?? {};
    return `${vi.title ?? "Untitled"}${vi.authors?.length ? ` by ${vi.authors.join(", ")}` : ""} (${vi.publishedDate ?? "date n/a"})\n   ${vi.description ? (vi.description.slice(0, 200) + (vi.description.length > 200 ? "..." : "")) : "no description"}\n   id: ${v?.id ?? "n/a"}`;
}
export async function searchBooks(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new BooksError("Provide a search query");
    const limit = Math.min(args.limit ?? 5, 20);
    const d = await get(`${BASE}/volumes?q=${encodeURIComponent(q)}&maxResults=${limit}`);
    const items = d?.items ?? [];
    if (items.length === 0)
        return "No results";
    return items.map(fmtVol).join("\n\n");
}
export async function bookInfo(args) {
    const id = (args.volumeId ?? "").trim();
    if (!id)
        throw new BooksError("Provide a volume ID");
    const d = await get(`${BASE}/volumes/${encodeURIComponent(id)}`);
    const vi = d?.volumeInfo ?? {};
    const lines = [
        `Title: ${vi.title ?? "Untitled"}`,
        vi.subtitle ? `Subtitle: ${vi.subtitle}` : "",
        vi.authors?.length ? `Authors: ${vi.authors.join(", ")}` : "",
        vi.publisher ? `Publisher: ${vi.publisher}` : "",
        vi.publishedDate ? `Published: ${vi.publishedDate}` : "",
        vi.pageCount ? `Pages: ${vi.pageCount}` : "",
        vi.categories?.length ? `Categories: ${vi.categories.join(", ")}` : "",
        vi.language ? `Language: ${vi.language}` : "",
    ].filter(Boolean);
    if (vi.description)
        lines.push(`\n${vi.description}`);
    return lines.join("\n");
}
