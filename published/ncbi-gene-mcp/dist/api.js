/**
 * NCBI Gene — keyless public API client.
 */
const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const SOURCE = "NCBI Gene";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "ncbi-gene-mcp", accept },
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
async function eutils(path, attempts = 3) {
    for (let attempt = 1;; attempt += 1) {
        try {
            return await getJson(path);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            const transient = /responded (429|500|502|503|504)|timed out|request failed/i.test(message);
            if (!transient || attempt >= attempts)
                throw e;
            await new Promise((resolve) => setTimeout(resolve, attempt * 900));
        }
    }
}
function recordLine(r) {
    const organism = clean(r.organism?.scientificname);
    return [
        `${clean(r.name) || `Gene ${r.uid}`} - ${clean(r.description) || "no description"}`,
        `  uid ${r.uid}${organism ? ` · ${organism}` : ""}${r.chromosome ? ` · chromosome ${clean(r.chromosome)}` : ""}${r.maplocation ? ` (${clean(r.maplocation)})` : ""}`,
        r.otheraliases ? `  aliases: ${clean(r.otheraliases)}` : "",
    ].filter(Boolean).join("\n");
}
export async function searchGeneRecords(a) {
    const term = clean(a.term);
    if (term.length < 2)
        throw new SourceError("term must be at least 2 characters");
    const limit = a.limit ?? 10;
    if (!Number.isInteger(limit) || limit < 1 || limit > 25)
        throw new SourceError("limit must be between 1 and 25");
    const found = await eutils(`/esearch.fcgi?db=gene&retmode=json&retmax=${limit}&term=${encodeURIComponent(term)}`);
    const ids = found?.esearchresult?.idlist ?? [];
    const count = String(found?.esearchresult?.count ?? "0");
    if (!ids.length)
        return `NCBI Gene has no record for "${term}".`;
    const sums = await eutils(`/esummary.fcgi?db=gene&retmode=json&id=${ids.join(",")}`);
    const result = sums?.result ?? {};
    const lines = ids.map((id) => (result[id] ? recordLine(result[id]) : `${id} - no record returned`));
    const warning = clean(found?.esearchresult?.warning) || clean(found?.esearchresult?.error);
    return [
        `NCBI Gene records for "${term}" - ${count} total, showing ${ids.length}:`,
        warning ? `NCBI warning: ${warning}` : "",
        "",
        ...lines,
    ].filter(Boolean).join("\n");
}
export async function geneRecord(a) {
    const uid = clean(a.uid);
    if (!/^\d+$/.test(uid))
        throw new SourceError("uid must be a numeric NCBI Gene uid");
    const sums = await eutils(`/esummary.fcgi?db=gene&retmode=json&id=${uid}`);
    const r = sums?.result?.[uid];
    if (!r)
        throw new SourceError(`NCBI Gene has no record ${uid}`);
    const mim = Array.isArray(r.mim) ? r.mim : [];
    const genomicsource = clean(r.geneticsource);
    const status = clean(r.status);
    return [
        `${clean(r.name) || `Gene ${uid}`} - ${clean(r.description) || "no description"}`,
        r.nomenclaturename ? `Official name: ${clean(r.nomenclaturename)}${r.nomenclaturestatus ? ` (${clean(r.nomenclaturestatus)})` : ""}` : "",
        `Organism: ${clean(r.organism?.scientificname) || "unknown"}${r.organism?.commonname ? ` (${clean(r.organism.commonname)})` : ""}`,
        r.chromosome ? `Location: chromosome ${clean(r.chromosome)}${r.maplocation ? ` · ${clean(r.maplocation)}` : ""}` : "",
        r.otheraliases ? `Aliases: ${clean(r.otheraliases)}` : "",
        r.otherdesignations ? `Also known as: ${clean(r.otherdesignations).slice(0, 300)}` : "",
        genomicsource ? `Source: ${genomicsource}` : "",
        status ? `Status: ${status}` : "",
        mim.length ? `OMIM: ${mim.map((m) => clean(m)).join(", ")}` : "",
        clean(r.summary) ? `Summary: ${clean(r.summary).slice(0, 1500)}` : "",
        `NCBI: https://www.ncbi.nlm.nih.gov/gene/${uid}`,
    ].filter(Boolean).join("\n");
}
