/**
 * NCBI Datasets — keyless public API client.
 */
const BASE = "https://api.ncbi.nlm.nih.gov/datasets/v2alpha";
const SOURCE = "NCBI Datasets";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "ncbi-datasets-mcp", accept },
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
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
function asList(value) {
    return Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
}
export async function genomeDatasets(a) {
    const limit = clampLimit(a.limit, 5, 25);
    const taxon = clean(a.taxon);
    if (!taxon)
        throw new SourceError("give a taxon name or id");
    const data = await getJson(`/genome/taxon/${encodeURIComponent(taxon)}/dataset_report?page_size=${limit}`, "application/json", 30000);
    const reports = asList(data?.reports);
    if (!reports.length)
        return `NCBI has no genome assemblies for "${taxon}".`;
    return [
        `${reports.length} genome assembly report(s) for "${taxon}"` + (data?.total_count ? ` of ${data.total_count} total` : "") + ":",
        "",
        ...reports.map((r, i) => {
            const org = clean(r?.organism?.organism_name);
            const info = r?.assembly_info ?? {};
            const stats = r?.assembly_stats ?? {};
            const size = stats.total_sequence_length ? `${(Number(stats.total_sequence_length) / 1e9).toFixed(2)} Gb` : "";
            const bits = [
                clean(info.assembly_name) ? `assembly ${clean(info.assembly_name)}` : "",
                clean(info.assembly_level),
                clean(info.submission_date),
                size,
            ].filter(Boolean);
            return `${i + 1}. ${clean(r.accession)}${org ? ` - ${org}` : ""}${r?.organism?.tax_id ? ` (taxid ${r.organism.tax_id})` : ""}\n   ${bits.join(" · ")}`;
        }),
    ].join("\n");
}
export async function geneDatasets(a) {
    const limit = clampLimit(a.limit, 5, 25);
    const symbol = clean(a.symbol);
    const taxon = clean(a.taxon || "human");
    if (!/^[A-Za-z0-9._-]{1,40}$/.test(symbol))
        throw new SourceError(`"${symbol}" is not a valid gene symbol`);
    const data = await getJson(`/gene/symbol/${encodeURIComponent(symbol)}/taxon/${encodeURIComponent(taxon)}?page_size=${limit}`, "application/json", 30000);
    const reports = asList(data?.reports);
    if (!reports.length)
        return `NCBI has no gene "${symbol}" in taxon "${taxon}".`;
    return [
        `${reports.length} gene record(s) for ${symbol} in ${taxon}:`,
        "",
        ...reports.map((r, i) => {
            const g = r?.gene ?? r;
            const bits = [
                g.gene_id ? `gene id ${clean(g.gene_id)}` : "",
                clean(g.description) ? clean(g.description).slice(0, 90) : "",
                r.transcript_count !== undefined ? `${r.transcript_count} transcripts` : "",
                r.product_count !== undefined ? `${r.product_count} products` : "",
            ].filter(Boolean);
            return `${i + 1}. ${clean(g.symbol ?? symbol)}${g.taxname ? ` (${clean(g.taxname)})` : ""}\n   ${bits.join(" · ")}`;
        }),
    ].join("\n");
}
export async function taxonomyLookup(a) {
    const taxon = clean(a.taxon);
    if (!taxon)
        throw new SourceError("give a taxon name or id");
    const data = await getJson(`/taxonomy/taxon/${encodeURIComponent(taxon)}`, "application/json", 25000);
    const nodes = asList(data?.taxonomy_nodes);
    if (!nodes.length)
        throw new SourceError(`NCBI taxonomy has nothing for "${taxon}"`);
    return nodes.slice(0, 5).map((n) => {
        const t = n?.taxonomy ?? {};
        const lineage = asList(t.lineage);
        return [
            `${clean(t.organism_name)} (taxid ${t.tax_id})`,
            "",
            bullet("rank", t.rank),
            bullet("common name", t.genbank_common_name),
            bullet("blast name", t.blast_name),
            bullet("lineage nodes", lineage.length ? `${lineage.length} ancestor(s): ${lineage.slice(0, 12).join(" > ")}${lineage.length > 12 ? " ..." : ""}` : ""),
            bullet("scientific name", t.scientific_name),
        ].filter(Boolean).join("\n");
    }).join("\n\n");
}
