/**
 * InterPro — keyless public API client.
 */
const BASE = "https://www.ebi.ac.uk/interpro/api";
const SOURCE = "InterPro";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "interpro-mcp", accept },
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
export async function searchEntries(a) {
    const q = clean(a.query);
    if (q.length < 2)
        throw new SourceError("query must be at least 2 characters");
    const limit = a.limit ?? 10;
    if (!Number.isInteger(limit) || limit < 1 || limit > 25)
        throw new SourceError("limit must be between 1 and 25");
    const d = await getJson(`/entry/interpro/?search=${encodeURIComponent(q)}&page_size=${limit}`);
    const rows = d?.results ?? [];
    if (!rows.length)
        return `InterPro has no entry matching "${q}".`;
    return [
        `InterPro entries matching "${q}" (${d?.count ?? rows.length} total, showing ${rows.length}):`,
        "",
        ...rows.map((r) => {
            const md = r.metadata ?? {};
            const name = md.name?.name ?? "unnamed";
            const type = md.type ?? "entry";
            const acc = md.accession ?? r.metadata?.accession ?? "";
            return `- ${acc} · ${clean(name)} (${clean(type)})${md.integrated ? ` · integrates ${Array.isArray(md.integrated) ? md.integrated.length : "?"} signature(s)` : ""}`;
        }),
    ].join("\n");
}
export async function proteinDomains(a) {
    const acc = clean(a.accession).toUpperCase();
    if (!/^[A-Z0-9]{6,10}$/.test(acc))
        throw new SourceError("accession must be a UniProt accession like P04637");
    const limit = a.limit ?? 15;
    if (!Number.isInteger(limit) || limit < 1 || limit > 40)
        throw new SourceError("limit must be between 1 and 40");
    const d = await getJson(`/entry/interpro/protein/uniprot/${encodeURIComponent(acc)}/?page_size=${limit}`);
    const rows = d?.results ?? [];
    if (!rows.length)
        return `InterPro found no domain match for ${acc}.`;
    return [
        `InterPro matches for ${acc} (${d?.count ?? rows.length} total, showing ${rows.length}):`,
        "",
        ...rows.map((r) => {
            const md = r.metadata ?? {};
            const proteins = r.proteins ?? [];
            const loc = proteins[0]?.entry_protein_locations?.[0]?.fragments?.[0];
            const span = loc ? ` · residues ${loc.start}-${loc.end}` : "";
            return `- ${md.accession ?? "?"} · ${clean(md.name?.name) || "unnamed"} (${clean(md.type) || "entry"})${span}`;
        }),
    ].join("\n");
}
