/**
 * INSPIRE-HEP — keyless public API client.
 */
const BASE = "https://inspirehep.net/api";
const SOURCE = "INSPIRE-HEP";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "inspire-hep-mcp", accept },
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
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
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
const FIELDS = "titles,authors.full_name,publication_info,citation_count,dois,arxiv_eprints,abstracts";
function titleOf(m) {
    return String(m?.titles?.[0]?.title ?? "Untitled");
}
function authorLine(m) {
    const names = (m?.authors ?? []).map((x) => x?.full_name).filter(Boolean);
    return names.slice(0, 4).join(", ") + (names.length > 4 ? ` +${names.length - 4}` : "");
}
function infoLine(m) {
    const p = m?.publication_info?.[0];
    if (!p)
        return "";
    return [p?.journal_title, p?.journal_volume && `vol ${p.journal_volume}`, p?.year ?? p?.journal_year, p?.page_start && `p${p.page_start}`].filter(Boolean).join(" ");
}
const arxiv = (m) => String(m?.arxiv_eprints?.[0]?.value ?? "");
const doi = (m) => String(m?.dois?.[0]?.value ?? "");
export async function searchLiterature(a) {
    const q = a.query.trim();
    if (q.length < 2)
        throw new SourceError("search query must be at least 2 characters");
    const d = await getJson(`/literature?q=${encodeURIComponent(q)}&size=${a.limit}&sort=${a.sort}&fields=${FIELDS}`);
    const hits = d?.hits?.hits ?? [];
    if (!hits.length)
        return `INSPIRE has no papers matching "${q}".`;
    return [
        `${Number(d?.hits?.total ?? hits.length).toLocaleString("en-US")} papers match "${q}" (showing ${hits.length}):`,
        ...hits.map((h, i) => {
            const m = h.metadata ?? {};
            const id = h.id ?? "";
            return `${i + 1}. ${titleOf(m)}\n   ${authorLine(m) || "unknown authors"}${infoLine(m) ? `\n   ${infoLine(m)}` : ""}\n   citations: ${m.citation_count ?? 0}${arxiv(m) ? ` · arXiv:${arxiv(m)}` : ""}${doi(m) ? ` · doi:${doi(m)}` : ""}\n   https://inspirehep.net/literature/${id}`;
        }),
    ].join("\n");
}
export async function literatureRecord(a) {
    const id = a.id.trim().replace(/^arxiv:/i, "");
    const d = await getJson(`/literature/${encodeURIComponent(id)}`);
    const m = d?.metadata ?? {};
    const abstract = String(m?.abstracts?.[0]?.value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return [
        titleOf(m),
        `Authors: ${authorLine(m) || "unknown"}`,
        infoLine(m) ? `Published: ${infoLine(m)}` : "",
        `Citations: ${m.citation_count ?? 0}`,
        arxiv(m) ? `arXiv: ${arxiv(m)}` : "",
        doi(m) ? `DOI: ${doi(m)}` : "",
        abstract ? `Abstract: ${abstract.slice(0, 1200)}` : "",
        `https://inspirehep.net/literature/${d.id ?? id}`,
    ].filter(Boolean).join("\n");
}
export async function searchAuthors(a) {
    const q = a.query.trim();
    if (q.length < 2)
        throw new SourceError("author query must be at least 2 characters");
    const d = await getJson(`/authors?q=${encodeURIComponent(q)}&size=${a.limit}`);
    const hits = d?.hits?.hits ?? [];
    if (!hits.length)
        return `INSPIRE has no authors matching "${q}".`;
    return [
        `${Number(d?.hits?.total ?? hits.length).toLocaleString("en-US")} authors match "${q}":`,
        ...hits.map((h, i) => {
            const m = h.metadata ?? {};
            const aff = (m?.positions ?? []).map((p) => p?.institution).filter(Boolean).slice(0, 2).join("; ");
            return `${i + 1}. ${m?.name?.value ?? "unknown"}${m?.name?.preferred_name ? ` (${m.name.preferred_name})` : ""}${aff ? `\n   ${aff}` : ""}\n   papers: ${m?.paper_count ?? 0} · citations: ${m?.citation_count ?? 0}`;
        }),
    ].join("\n");
}
