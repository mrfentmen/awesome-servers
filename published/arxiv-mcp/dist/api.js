/**
 * arXiv API — keyless access to 2.4M+ preprints. The API answers in Atom XML;
 * entries are parsed with a small, format-specific extractor.
 */
const BASE = "https://export.arxiv.org/api/query";
export class ArxivError extends Error {
}
async function getXml(url, timeoutMs = 30000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: ctrl.signal,
            headers: { "user-agent": "arxiv-mcp", accept: "application/atom+xml" },
        });
        if (res.status === 400)
            throw new ArxivError("arXiv rejected that query — check the syntax");
        if (!res.ok)
            throw new ArxivError(`arXiv responded ${res.status}`);
        return await res.text();
    }
    catch (e) {
        if (e instanceof ArxivError)
            throw e;
        if (e.name === "AbortError")
            throw new ArxivError("arXiv request timed out");
        throw new ArxivError(`arXiv request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
const unwrap = (xml, tag) => {
    const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
    return m ? m[1].replace(/\s+/g, " ").trim() : "";
};
function parseEntries(xml) {
    const raw = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
    return raw.map((e) => {
        const idUrl = unwrap(e, "id");
        const id = idUrl.replace(/^https?:\/\/arxiv\.org\/abs\//, "").replace(/v\d+$/, "");
        const authors = [...e.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/g)].map((m) => m[1].replace(/\s+/g, " ").trim());
        const categories = [...e.matchAll(/<category[^>]*term="([^"]+)"/g)].map((m) => m[1]);
        const pdfMatch = e.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"/) ?? e.match(/<link[^>]*href="([^"]+)"[^>]*title="pdf"/);
        return {
            id,
            title: unwrap(e, "title"),
            summary: unwrap(e, "summary"),
            published: unwrap(e, "published"),
            authors,
            categories: [...new Set(categories)],
            pdf: pdfMatch ? pdfMatch[1] : `https://arxiv.org/pdf/${id}`,
        };
    });
}
const sizeArg = (n) => {
    if (!Number.isInteger(n) || n < 1 || n > 25)
        throw new ArxivError("max_results must be between 1 and 25");
    return n;
};
const idArg = (id) => {
    const v = id.trim().replace(/^https?:\/\/arxiv\.org\/(abs|pdf)\//, "").replace(/\.pdf$/, "").replace(/v\d+$/, "");
    if (!/^\d{4}\.\d{4,5}$|^[a-z-]+(\.[A-Z]{2})?\/\d{7}$/i.test(v))
        throw new ArxivError(`"${id}" does not look like an arXiv id, e.g. 1706.03762`);
    return v;
};
function paperBlock(p, i) {
    const authors = p.authors.length > 4 ? `${p.authors.slice(0, 4).join(", ")} +${p.authors.length - 4} more` : p.authors.join(", ");
    const date = p.published ? p.published.slice(0, 10) : "date unknown";
    return [
        `${i !== undefined ? `${i + 1}. ` : ""}${p.title}`,
        `   ${authors || "no authors"} · ${date} · ${p.categories.join(", ") || "no categories"}`,
        `   arXiv:${p.id} · ${p.pdf}`,
        `   ${p.summary.slice(0, 280)}${p.summary.length > 280 ? "…" : ""}`,
    ].join("\n");
}
function query(term) {
    const t = term.trim();
    if (t.length < 2)
        throw new ArxivError("Search term must be at least 2 characters");
    // Field-prefixed queries (au:, ti:, cat:, abs:) pass through; free text goes to `all:`.
    return /^[a-z_]+:/i.test(t) ? t : `all:"${t}"`;
}
export async function searchPapers(term, maxResults = 8, newestFirst = false) {
    const q = query(term);
    const n = sizeArg(maxResults);
    const sort = newestFirst ? "&sortBy=submittedDate&sortOrder=descending" : "";
    const xml = await getXml(`${BASE}?search_query=${encodeURIComponent(q)}&max_results=${n}${sort}`);
    const papers = parseEntries(xml);
    if (papers.length === 0)
        return `arXiv returned no papers for "${term}".`;
    return [`arXiv results for ${q} (${papers.length}):`, ...papers.map((p, i) => paperBlock(p, i))].join("\n\n");
}
export async function paperById(id) {
    const clean = idArg(id);
    const xml = await getXml(`${BASE}?id_list=${encodeURIComponent(clean)}`);
    const [p] = parseEntries(xml);
    if (!p)
        throw new ArxivError(`arXiv has no paper with id ${clean}`);
    return [
        p.title,
        "",
        `Authors: ${p.authors.join(", ") || "none listed"}`,
        `Published: ${p.published ? p.published.slice(0, 10) : "unknown"}`,
        `Categories: ${p.categories.join(", ") || "none"}`,
        `PDF: ${p.pdf}`,
        "",
        p.summary,
    ].join("\n");
}
export async function papersByAuthor(author, maxResults = 8, newestFirst = true) {
    const a = author.trim();
    if (a.length < 2)
        throw new ArxivError("Author name must be at least 2 characters");
    const n = sizeArg(maxResults);
    const sort = newestFirst ? "&sortBy=submittedDate&sortOrder=descending" : "";
    const xml = await getXml(`${BASE}?search_query=${encodeURIComponent(`au:"${a}"`)}&max_results=${n}${sort}`);
    const papers = parseEntries(xml);
    if (papers.length === 0)
        return `arXiv has no papers for author "${author}".`;
    return [`arXiv papers by "${author}" (${papers.length}):`, ...papers.map((p, i) => paperBlock(p, i))].join("\n\n");
}
export async function latestInCategory(category, maxResults = 8) {
    const c = category.trim();
    if (!/^[a-z-]+(\.[A-Za-z-]+)?$/.test(c))
        throw new ArxivError(`"${category}" is not an arXiv category, e.g. cs.AI, math.NT, hep-th`);
    const n = sizeArg(maxResults);
    const xml = await getXml(`${BASE}?search_query=${encodeURIComponent(`cat:${c}`)}&max_results=${n}&sortBy=submittedDate&sortOrder=descending`);
    const papers = parseEntries(xml);
    if (papers.length === 0)
        return `arXiv has no recent papers in category "${category}".`;
    return [`Newest arXiv papers in ${c} (${papers.length}):`, ...papers.map((p, i) => paperBlock(p, i))].join("\n\n");
}
export async function searchInCategory(term, category, maxResults = 8) {
    const c = category.trim();
    if (!/^[a-z-]+(\.[A-Za-z-]+)?$/.test(c))
        throw new ArxivError(`"${category}" is not an arXiv category, e.g. cs.LG`);
    const q = `${query(term)} AND cat:${c}`;
    const n = sizeArg(maxResults);
    const xml = await getXml(`${BASE}?search_query=${encodeURIComponent(q)}&max_results=${n}&sortBy=relevance&sortOrder=descending`);
    const papers = parseEntries(xml);
    if (papers.length === 0)
        return `arXiv returned no papers for "${term}" in ${c}.`;
    return [`arXiv results for ${q} (${papers.length}):`, ...papers.map((p, i) => paperBlock(p, i))].join("\n\n");
}
