/**
 * Gutendex — a JSON front end for Project Gutenberg's 79,000+ public domain
 * books. Keyless, documented at https://gutendex.com.
 */
const BASE = "https://gutendex.com";
export class GutenbergError extends Error {
}
async function once(path, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(`${BASE}${path}`, {
            signal: ctrl.signal,
            headers: { "user-agent": "gutenberg-mcp", accept: "application/json" },
        });
        if (res.status === 404)
            throw new GutenbergError("Gutendex has no book with that id");
        if (res.status === 429)
            throw new GutenbergError("Gutendex is rate limiting — retry in a minute");
        if (!res.ok)
            throw new GutenbergError(`Gutendex responded ${res.status}`);
        return await res.json();
    }
    catch (e) {
        if (e instanceof GutenbergError)
            throw e;
        if (e.name === "AbortError")
            throw new Timeout();
        if (e instanceof SyntaxError)
            throw new GutenbergError("Gutendex returned malformed JSON");
        throw new GutenbergError(`Gutendex request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
class Timeout extends Error {
}
/**
 * Gutendex is occasionally slow (topic queries have been seen at 80 seconds),
 * so a stall gets a long single window and an honest error after that.
 */
async function getJson(path, timeoutMs = 45000) {
    try {
        return await once(path, timeoutMs);
    }
    catch (e) {
        if (e instanceof Timeout)
            throw new GutenbergError("Gutendex is slow right now — try again in a moment");
        throw e;
    }
}
const authorText = (b) => (b.authors ?? [])
    .map((a) => `${a.name ?? "unknown"}${a.birth_year || a.death_year ? ` (${a.birth_year ?? "?"}–${a.death_year ?? "?"})` : ""}`)
    .join("; ") || "author unknown";
function line(b, i) {
    const prefix = typeof i === "number" ? `${i + 1}. ` : "• ";
    return [
        `${prefix}${b.title}`,
        `   ${authorText(b)} · ${(b.languages ?? []).join(", ") || "language unknown"} · ${(b.download_count ?? 0).toLocaleString("en-US")} downloads`,
        b.subjects?.length ? `   ${b.subjects.slice(0, 3).join(" · ")}` : "",
        `   id ${b.id}`,
    ]
        .filter(Boolean)
        .join("\n");
}
function formats(b) {
    const f = b.formats ?? {};
    const pick = (keys) => keys.map((k) => Object.keys(f).find((x) => x.startsWith(k))).filter(Boolean);
    const lines = pick(["text/plain", "text/html", "application/epub", "application/x-mobipocket"])
        .map((k) => `   ${k}: ${f[k]}`);
    return lines.length ? lines : ["   no text formats listed"];
}
function list(title, d, limit) {
    const rows = d?.results ?? [];
    if (rows.length === 0)
        return `${title} — nothing found.`;
    return [
        `${title} (showing ${Math.min(limit, rows.length)} of ${Number(d.count ?? rows.length).toLocaleString("en-US")}):`,
        "",
        ...rows.slice(0, limit).map((b, i) => line(b, i)),
        "",
        "Use book_detail for reading links.",
    ].join("\n");
}
export async function searchBooks(query, limit) {
    const q = query.trim();
    if (q.length < 2)
        throw new GutenbergError("Search term must be at least 2 characters");
    const d = await getJson(`/books/?search=${encodeURIComponent(q)}`);
    return list(`Books matching "${query}"`, d, limit);
}
export async function bookDetail(id) {
    // Gutendex redirects the slash-less form, so ask for the trailing-slash path.
    const b = await getJson(`/books/${id}/`);
    const plain = (b.formats ?? {})["text/plain; charset=utf-8"] ?? (b.formats ?? {})["text/plain; charset=us-ascii"];
    return [
        `${b.title}`,
        `${authorText(b)}`,
        `Languages: ${(b.languages ?? []).join(", ")} · downloads ${(b.download_count ?? 0).toLocaleString("en-US")}`,
        b.bookshelves?.length ? `Shelves: ${b.bookshelves.slice(0, 5).join(", ")}` : "",
        b.subjects?.length ? `Subjects: ${b.subjects.slice(0, 6).join(" · ")}` : "",
        "",
        b.summaries?.length ? `${String(b.summaries[0]).replace(/\s+/g, " ").slice(0, 700)}\n` : "",
        "Formats:",
        ...formats(b),
        plain ? `\nPlain text: ${plain}` : "",
        `Gutenberg page: https://www.gutenberg.org/ebooks/${b.id}`,
    ]
        .filter((x) => x !== "")
        .join("\n");
}
export async function byLanguage(language, limit) {
    const code = language.trim().toLowerCase();
    if (!/^[a-z]{2,3}$/.test(code))
        throw new GutenbergError("Use a 2- or 3-letter language code, e.g. en, fr, de");
    const d = await getJson(`/books/?languages=${code}&sort=popular`);
    return list(`Most downloaded books in "${code}"`, d, limit);
}
export async function popular(limit) {
    const d = await getJson(`/books/?sort=popular`);
    return list("Most downloaded Project Gutenberg books", d, limit);
}
