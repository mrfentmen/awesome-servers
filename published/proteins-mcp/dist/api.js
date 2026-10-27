/**
 * EBI Proteins — keyless public API client.
 */
const BASE = "https://www.ebi.ac.uk/proteins/api";
const SOURCE = "EBI Proteins";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "proteins-mcp", accept },
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
const checkAcc = (raw) => {
    const v = raw.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,12}$/.test(v))
        throw new SourceError(`"${raw}" is not a UniProt accession`);
    return v;
};
const nameOf = (p) => String(p?.recommendedName?.fullName?.value ?? p?.submittedName?.[0]?.fullName?.value ?? "unnamed protein");
const geneOf = (r) => (r?.gene ?? []).map((g) => g?.name?.value).filter(Boolean).slice(0, 3).join(", ");
export async function proteinRecord(a) {
    const acc = checkAcc(a.accession);
    const d = await getJson(`/proteins/${acc}`);
    const r = Array.isArray(d) ? d[0] : d;
    if (!r?.accession)
        throw new SourceError(`EBI Proteins has no record ${acc}`);
    const seq = r?.sequence ?? {};
    const org = r?.organism ?? {};
    const names = (org?.names ?? []).map((x) => x?.value).filter(Boolean);
    const alt = (r?.protein?.alternativeNames ?? []).map((x) => x?.fullName?.value).filter(Boolean);
    return [
        `${r.accession} - ${nameOf(r.protein)}`,
        `Organism: ${names.join(" / ") || "?"} (taxid ${org.taxonomy ?? "?"})`,
        `Genes: ${geneOf(r) || "none listed"}`,
        `Length: ${seq.length ?? "?"} aa · mass: ${seq.molWeight ? `${Math.round(seq.molWeight / 1000)} kDa` : "?"}`,
        `Existence: ${r.proteinExistence ?? "?"}`,
        alt.length ? `Also known as: ${alt.slice(0, 5).join("; ")}` : "",
        `Sequence start: ${String(seq.sequence ?? "").slice(0, 60)}${String(seq.sequence ?? "").length > 60 ? "…" : ""}`,
        `UniProt: https://www.uniprot.org/uniprotkb/${r.accession}`,
    ].filter(Boolean).join("\n");
}
export async function proteinsByTaxon(a) {
    const d = await getJson(`/proteins?taxid=${a.taxid}&size=${a.limit}&offset=0`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        return `No proteins listed for taxid ${a.taxid}.`;
    return [`${rows.length} proteins for taxid ${a.taxid}:`, ...rows.map((r, i) => `${i + 1}. ${r.accession} - ${nameOf(r.protein)}${geneOf(r) ? ` (${geneOf(r)})` : ""} · ${r.sequence?.length ?? "?"} aa`)].join("\n");
}
export async function proteinFeatures(a) {
    const acc = checkAcc(a.accession);
    const want = (a.category ?? "").trim().toUpperCase();
    const d = await getJson(`/features/${acc}`);
    const all = Array.isArray(d?.features) ? d.features : Array.isArray(d) ? d : [];
    const rows = want ? all.filter((f) => String(f?.type ?? "").toUpperCase() === want) : all;
    if (!rows.length)
        return `No${want ? ` ${want}` : ""} features for ${acc}.`;
    return [
        `${rows.length}${want ? ` ${want}` : ""} features on ${acc}:`,
        ...rows.slice(0, 25).map((f, i) => `${i + 1}. ${f.type ?? "feature"} ${f.begin ?? "?"}-${f.end ?? "?"}${f.description ? ` - ${f.description}` : ""}`),
    ].join("\n");
}
