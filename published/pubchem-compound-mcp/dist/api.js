/**
 * PubChem — keyless public API client.
 */
const BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const SOURCE = "PubChem";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "pubchem-compound-mcp", accept },
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
function targetFor(name) {
    const v = clean(name);
    if (!v)
        throw new SourceError("name is required");
    return /^\d+$/.test(v) ? `cid/${v}` : `name/${encodeURIComponent(v)}`;
}
export async function compoundProperties(a) {
    const d = await getJson(`/compound/${targetFor(a.name)}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES,InChIKey,XLogP,ExactMass,TPSA,Charge/JSON`);
    const p = d?.PropertyTable?.Properties?.[0];
    if (!p)
        return `PubChem has no compound for "${clean(a.name)}".`;
    return [
        `CID ${p.CID}`,
        `Formula: ${clean(p.MolecularFormula) || "unknown"} · molecular weight ${p.MolecularWeight ?? "?"}`,
        p.ExactMass ? `Exact mass: ${p.ExactMass} · XLogP ${p.XLogP ?? "?"} · TPSA ${p.TPSA ?? "?"} · charge ${p.Charge ?? "?"}` : "",
        p.IUPACName ? `IUPAC name: ${clean(p.IUPACName)}` : "",
        p.CanonicalSMILES ? `SMILES: ${clean(p.CanonicalSMILES)}` : "",
        p.InChIKey ? `InChIKey: ${clean(p.InChIKey)}` : "",
        `PubChem: https://pubchem.ncbi.nlm.nih.gov/compound/${p.CID}`,
    ].filter(Boolean).join("\n");
}
export async function compoundSynonyms(a) {
    const limit = a.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50)
        throw new SourceError("limit must be between 1 and 50");
    const d = await getJson(`/compound/${targetFor(a.name)}/synonyms/JSON`);
    const info = d?.InformationList?.Information?.[0];
    const names = info?.Synonym ?? [];
    if (!names.length)
        return `PubChem lists no synonyms for "${clean(a.name)}".`;
    return [
        `CID ${info.CID} - ${names.length} synonyms, showing ${Math.min(limit, names.length)}:`,
        "",
        ...names.slice(0, limit).map((n) => `- ${clean(n)}`),
    ].join("\n");
}
export async function compoundDescription(a) {
    const d = await getJson(`/compound/${targetFor(a.name)}/description/JSON`);
    const info = d?.InformationList?.Information?.[0];
    if (!info)
        return `PubChem has no description for "${clean(a.name)}".`;
    const text = (info.Description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return [
        `CID ${info.CID}`,
        info.Title ? `Title: ${clean(info.Title)}` : "",
        text ? `Description: ${text.slice(0, 1500)}` : "No description text published.",
        info.DescriptionSourceName ? `Source: ${clean(info.DescriptionSourceName)}` : "",
    ].filter(Boolean).join("\n");
}
