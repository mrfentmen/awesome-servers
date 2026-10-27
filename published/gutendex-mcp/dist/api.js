const m0 = (() => {
    const BASE = 'https://gutendex.com/books';
    function bookLine(b, i) {
        const authors = (b.authors ?? []).map((a) => a.name ?? '').filter(Boolean).slice(0, 2).join(', ');
        return `${i + 1}. ${b.title ?? 'untitled'} | ${authors || 'unknown'} | ${(b.languages ?? []).join(', ')} | downloads ${b.download_count ?? 0}${b.id ? ` | id ${b.id}` : ''}`;
    }
    async function search(args) {
        const q = (args.query ?? '').trim();
        if (!q)
            return 'Provide a search query.';
        const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
        const res = await fetch(`${BASE}?search=${encodeURIComponent(q)}`, {
            headers: { 'User-Agent': 'mrfentmen-gutendex-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Gutendex returned ${res.status}`);
        const data = (await res.json());
        const books = (data.results ?? []).slice(0, limit);
        if (!books.length)
            return `No Gutenberg books found for "${q}".`;
        return `Gutenberg results for "${q}" (${data.count ?? books.length} total, ${books.length} shown):\n` + books.map((b, i) => bookLine(b, i)).join('\n');
    }
    async function book(args) {
        const id = Number(args.id);
        if (!Number.isInteger(id) || id <= 0)
            return 'Provide a positive Gutenberg book ID.';
        const res = await fetch(`${BASE}/${id}`, {
            headers: { 'User-Agent': 'mrfentmen-gutendex-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Gutendex returned ${res.status}`);
        const b = (await res.json());
        if (!b.id)
            return `No Gutenberg book found with id ${id}.`;
        const lines = [
            `Title: ${b.title ?? 'n/a'}`,
            `Authors: ${(b.authors ?? []).map((a) => a.name ?? '').filter(Boolean).join(', ') || 'n/a'}`,
            `Subjects: ${(b.subjects ?? []).slice(0, 5).join(', ') || 'n/a'}`,
            `Downloads: ${b.download_count ?? 0}`,
        ];
        const textUrl = b.formats?.['text/plain; charset=us-ascii'] ?? b.formats?.['text/html'];
        if (textUrl)
            lines.push(`Read: ${textUrl}`);
        return lines.join('\n');
    }
    return { book, search };
})();
const m1 = (() => {
    const BASE = "https://gutendex.com";
    const UA = "mrfentmen-gutenberg-mcp/1.0 (https://github.com/mrfentmen)";
    class GutenbergError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, redirect: "follow", signal: AbortSignal.timeout(25000) });
        if (res.status === 429)
            throw new GutenbergError("Gutendex rate limit hit, wait and retry");
        if (!res.ok)
            throw new GutenbergError(`Gutendex error ${res.status}`);
        return (await res.json());
    }
    function fmtBook(b) {
        const formats = b?.formats ?? {};
        const dl = formats["text/plain; charset=us-ascii"] || formats["text/plain; charset=utf-8"] || formats["text/html"] || "";
        return `${b?.title ?? "Untitled"} by ${(b?.authors ?? []).map((a) => a.name).join(", ") || "unknown"} (${b?.id ?? "id n/a"})\n   ${(b?.subjects ?? []).slice(0, 3).join("; ") || "no subjects"}${dl ? `\n   Download: ${dl}` : ""}`;
    }
    async function searchBooks(args) {
        const q = (args.query ?? "").trim();
        if (!q)
            throw new GutenbergError("Provide a search query");
        const limit = Math.min(args.limit ?? 5, 20);
        const d = await get(`${BASE}/books?search=${encodeURIComponent(q)}`);
        const books = (d?.results ?? []).slice(0, limit);
        if (books.length === 0)
            return "No results";
        return books.map(fmtBook).join("\n\n");
    }
    async function bookInfo(args) {
        const id = args.bookId;
        if (id === undefined || id <= 0)
            throw new GutenbergError("Provide a positive book ID");
        const b = await get(`${BASE}/books/${id}`);
        return fmtBook(b);
    }
    return { GutenbergError, bookInfo, searchBooks };
})();
export const GutenbergError = m1.GutenbergError;
export const book = m0.book;
export const bookInfo = m1.bookInfo;
export const search = m0.search;
export const searchBooks = m1.searchBooks;
export const m0_search = m0.search;
export const m0_book = m0.book;
export const m1_bookInfo = m1.bookInfo;
export const m1_GutenbergError = m1.GutenbergError;
export const m1_searchBooks = m1.searchBooks;
