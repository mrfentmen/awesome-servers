/**
 * Pathway Commons — keyless public API client.
 */
const BASE = "https://www.pathwaycommons.org/pc2";
const SOURCE = "Pathway Commons";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "pathway-commons-mcp", accept },
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
export async function getJson(path, accept = "application/json", timeoutMs = 25000) {
    const res = await request(path, accept, timeoutMs);
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
async function search(query, type, limit) {
    const q = clean(query);
    const params = [`q=${encodeURIComponent(q)}`];
    if (type)
        params.push(`type=${encodeURIComponent(type)}`);
    const data = await getJson(`/search?${params.join("&")}`, "application/json", 30000);
    const hits = Array.isArray(data?.searchHit) ? data.searchHit : [];
    const total = Number(data?.numHits ?? hits.length);
    if (!hits.length)
        return `No ${type ?? "entity"} matches for "${q}".`;
    return [
        `${total} hit(s) for "${q}"${type ? ` (type ${type})` : ""} - showing ${Math.min(limit, hits.length)}:`,
        "",
        ...hits.slice(0, limit).map((h, i) => {
            const sources = Array.isArray(h?.dataSource) ? h.dataSource.map((s) => clean(s)).filter(Boolean).slice(0, 3) : [];
            const organisms = Array.isArray(h?.organism) ? h.organism.length : 0;
            const bits = [
                clean(h?.biopaxClass),
                sources.length ? sources.join(", ") : "",
                organisms ? `${organisms} organism(s)` : "",
                h?.numParticipants ? `${h.numParticipants} participants` : "",
            ].filter(Boolean);
            return `${i + 1}. ${clean(h?.name)}\n   ${bits.join(" · ")}\n   ${clean(h?.uri)}`;
        }),
        total > hits.length ? `\n(${total - hits.length} more - raise limit or refine the query)` : "",
    ].filter(Boolean).join("\n");
}
export async function searchTerms(a) {
    return search(a.query, undefined, clampLimit(a.limit, 10, 50));
}
export async function findPathways(a) {
    return search(a.query, "pathway", clampLimit(a.limit, 10, 50));
}
export async function searchProteins(a) {
    return search(a.query, "protein", clampLimit(a.limit, 10, 50));
}
