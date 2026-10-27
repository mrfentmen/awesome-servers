/**
 * NCBI Taxonomy — keyless public API client.
 */
const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const SOURCE = "NCBI Taxonomy";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "ncbi-taxonomy-mcp", accept },
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
function summary(d, id) {
    const r = d?.result ?? {};
    const row = r[id];
    if (!row)
        throw new SourceError(`NCBI has no taxon ${id}`);
    return row;
}
export async function searchTaxonomy(a) {
    const q = a.query.trim();
    if (q.length < 2)
        throw new SourceError("search query must be at least 2 characters");
    const search = await getJson(`/esearch.fcgi?db=taxonomy&term=${encodeURIComponent(q)}&retmode=json&retmax=${a.limit}`);
    const ids = search?.esearchresult?.idlist ?? [];
    if (!ids.length)
        return `NCBI taxonomy has no record matching "${q}".`;
    const sum = await getJson(`/esummary.fcgi?db=taxonomy&id=${ids.join(",")}&retmode=json`);
    return [
        `${Number(search?.esearchresult?.count ?? ids.length).toLocaleString("en-US")} taxa match "${q}":`,
        ...ids.map((id, i) => {
            const t = summary(sum, id);
            return `${i + 1}. ${t.scientificname} (taxid ${id})\n   rank: ${t.rank} · ${t.commonname || "no common name"} · ${t.division}`;
        }),
    ].join("\n");
}
export async function getTaxon(a) {
    const d = await getJson(`/esummary.fcgi?db=taxonomy&id=${a.taxid}&retmode=json`);
    const t = summary(d, String(a.taxid));
    return [
        `${t.scientificname} (taxid ${a.taxid})`,
        `Rank: ${t.rank}`,
        `Common name: ${t.commonname || "none listed"}`,
        `Division: ${t.division} (${t.genbankdivision})`,
        `Status: ${t.status}`,
        `Last modified: ${t.modificationdate}`,
        `NCBI: https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${a.taxid}`,
    ].join("\n");
}
export async function taxonomyLineage(a) {
    let xml = "";
    for (let attempt = 0; attempt < 4; attempt++) {
        try {
            xml = await getText(`/efetch.fcgi?db=taxonomy&id=${a.taxid}&retmode=xml`);
            break;
        }
        catch (e) {
            if (attempt === 3)
                throw e;
            await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        }
    }
    const lineage = xml.match(/<Lineage>([\s\S]*?)<\/Lineage>/)?.[1]?.trim();
    const rank = xml.match(/<Rank>([\s\S]*?)<\/Rank>/)?.[1]?.trim();
    const name = xml.match(/<ScientificName>([\s\S]*?)<\/ScientificName>/)?.[1]?.trim();
    if (!lineage)
        throw new SourceError(`NCBI returned no lineage for taxon ${a.taxid}`);
    return [
        `${name ?? "Taxon"} (taxid ${a.taxid}, rank ${rank ?? "?"})`,
        `Lineage: ${lineage}`,
        `Depth: ${lineage.split(";").filter(Boolean).length} levels`,
    ].join("\n");
}
