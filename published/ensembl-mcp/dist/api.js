/**
 * Ensembl — keyless public API client.
 */
const BASE = "https://rest.ensembl.org";
const SOURCE = "Ensembl";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "ensembl-mcp", accept },
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
function checkId(id) {
    const v = clean(id);
    if (!/^ENS[A-Z]*[GTP]\d+$/.test(v) && !/^\d+$/.test(v))
        throw new SourceError("geneId must be an Ensembl id like ENSG00000139618 or an NCBI gene id");
    return v;
}
export async function lookupGene(a) {
    const symbol = clean(a.symbol);
    if (!symbol)
        throw new SourceError("symbol is required");
    const species = clean(a.species || "homo_sapiens").toLowerCase().replace(/\s+/g, "_");
    const d = await getJson(`/lookup/symbol/${encodeURIComponent(species)}/${encodeURIComponent(symbol)}?expand=0;content-type=application/json`);
    if (!d || !d.id)
        return `Ensembl has no gene called ${symbol} in ${species}.`;
    return [
        `${d.display_name ?? symbol} (${d.id})`,
        `Species: ${d.species ?? species}`,
        `Location: ${d.seq_region_name}:${Number(d.start).toLocaleString("en-US")}-${Number(d.end).toLocaleString("en-US")} (${d.strand === 1 ? "+" : "-"} strand)`,
        `Biotype: ${d.biotype ?? "unknown"}`,
        d.description ? `Description: ${clean(d.description)}` : "",
        `Ensembl: https://www.ensembl.org/${species}/Gene/Summary?g=${d.id}`,
    ].filter(Boolean).join("\n");
}
export async function geneSequence(a) {
    const id = checkId(a.geneId);
    const max = a.maxBases ?? 200;
    if (!Number.isInteger(max) || max < 30 || max > 2000)
        throw new SourceError("maxBases must be between 30 and 2000");
    const d = await getJson(`/sequence/id/${encodeURIComponent(id)}?content-type=application/json`);
    if (!d || !d.seq)
        throw new SourceError(`Ensembl returned no sequence for ${id}`);
    const seq = String(d.seq);
    const shown = seq.length > max ? `${seq.slice(0, max)}...` : seq;
    return [
        `${id} - ${d.desc ?? "sequence"}${d.molecule ? ` (${d.molecule})` : ""}`,
        `Length: ${seq.length} bases`,
        d.seq ? `Sequence: ${shown}` : "",
    ].filter(Boolean).join("\n");
}
export async function geneXrefs(a) {
    const id = checkId(a.geneId);
    const limit = a.limit ?? 15;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50)
        throw new SourceError("limit must be between 1 and 50");
    const d = await getJson(`/xrefs/id/${encodeURIComponent(id)}?content-type=application/json`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        return `Ensembl lists no cross-references for ${id}.`;
    const bySource = new Map();
    for (const r of rows) {
        const key = clean(r.dbname) || "other";
        const list = bySource.get(key) ?? [];
        if (list.length < 3)
            list.push(clean(r.primary_id) || clean(r.display_id));
        bySource.set(key, list);
    }
    const lines = [...bySource.entries()].slice(0, limit).map(([db, ids]) => `- ${db}: ${ids.join(", ")}`);
    return [`${rows.length} cross-references for ${id} across ${bySource.size} databases:`, "", ...lines].join("\n");
}
