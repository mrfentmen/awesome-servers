/**
 * mygene.info — keyless public API client.
 */
const BASE = "https://mygene.info/v3";
const SOURCE = "mygene.info";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "mygene-mcp", accept },
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
const FIELDS = "symbol,name,entrezgene,taxid,genomic_pos,alias,summary,map_location,type_of_gene,ensembl.gene,refseq.rna";
export async function searchGenes(a) {
    const q = clean(a.query);
    if (!q)
        throw new SourceError("query is required");
    const limit = a.limit ?? 10;
    if (!Number.isInteger(limit) || limit < 1 || limit > 25)
        throw new SourceError("limit must be between 1 and 25");
    const params = new URLSearchParams({ q, size: String(limit), fields: FIELDS });
    if (a.species)
        params.set("species", clean(a.species));
    const d = await getJson(`/query?${params.toString()}`);
    const hits = d?.hits ?? [];
    if (!hits.length)
        return `mygene.info has no gene for "${q}".`;
    return [
        `${d?.total ?? hits.length} genes match "${q}"${a.species ? ` in ${clean(a.species)}` : ""}, showing ${hits.length}:`,
        "",
        ...hits.map((h) => {
            const pos = Array.isArray(h.genomic_pos) ? h.genomic_pos[0] : h.genomic_pos;
            return [
                `${clean(h.symbol) || h._id} - ${clean(h.name) || "no name"} (Entrez ${h.entrezgene ?? "?"})`,
                `  species taxid ${h.taxid ?? "?"}${h.map_location ? ` · ${clean(h.map_location)}` : ""}${pos ? ` · chr${pos.chr}:${pos.start}-${pos.end}` : ""}`,
            ].join("\n");
        }),
    ].join("\n");
}
export async function geneRecord(a) {
    let id = clean(a.geneId).replace(/^entrez:/i, "");
    if (!id)
        throw new SourceError("geneId is required");
    const d = await getJson(`/gene/${encodeURIComponent(id)}?fields=${FIELDS}`);
    if (!d || d.notfound)
        return `mygene.info has no gene ${id}.`;
    const entrez = d.entrezgene ?? id;
    const pos = Array.isArray(d.genomic_pos) ? d.genomic_pos[0] : d.genomic_pos;
    const ensembl = Array.isArray(d.ensembl) ? d.ensembl[0]?.gene : d.ensembl?.gene;
    const aliases = Array.isArray(d.alias) ? d.alias.slice(0, 12).join(", ") : clean(d.alias);
    return [
        `${clean(d.symbol) || `Gene ${entrez}`} - ${clean(d.name) || "no name"}`,
        `Entrez id: ${entrez} · taxid ${d.taxid ?? "?"}${d.type_of_gene ? ` · ${clean(d.type_of_gene)}` : ""}`,
        d.map_location ? `Location: ${clean(d.map_location)}${pos ? ` (chr${pos.chr}:${Number(pos.start).toLocaleString("en-US")}-${Number(pos.end).toLocaleString("en-US")})` : ""}` : "",
        ensembl ? `Ensembl gene: ${clean(ensembl)}` : "",
        aliases ? `Aliases: ${aliases}` : "",
        clean(d.summary) ? `Summary: ${clean(d.summary).slice(0, 1200)}` : "",
        `mygene: https://mygene.info/v3/gene/${entrez}`,
    ].filter(Boolean).join("\n");
}
