/**
 * ChEMBL — keyless public API client.
 */
const BASE = "https://www.ebi.ac.uk/chembl/api/data";
const SOURCE = "ChEMBL";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "chembl-mcp", accept },
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
function limitOf(n, max, fallback) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export async function searchMolecules(a) {
    const q = clean(a.query);
    if (q.length < 2)
        throw new SourceError("query must be at least 2 characters");
    const limit = limitOf(a.limit, 25, 10);
    const d = await getJson(`/molecule/search.json?q=${encodeURIComponent(q)}&limit=${limit}`);
    const rows = d?.molecules ?? [];
    if (!rows.length)
        return `ChEMBL has no molecule matching "${q}".`;
    return [
        `ChEMBL molecules matching "${q}" (${d?.page_meta?.total_count ?? rows.length} total, showing ${rows.length}):`,
        "",
        ...rows.map((m) => [
            `${clean(m.pref_name) || clean(m.molecule_chembl_id)} (${m.molecule_chembl_id})`,
            `  ${clean(m.molecule_type) || "type unknown"}${m.max_phase !== null && m.max_phase !== undefined ? ` · max phase ${m.max_phase}` : ""}${m.first_approval ? ` · first approval ${m.first_approval}` : ""}`,
            m.molecule_structures?.canonical_smiles ? `  SMILES: ${clean(m.molecule_structures.canonical_smiles).slice(0, 120)}` : "",
        ].filter(Boolean).join("\n")),
    ].join("\n");
}
export async function moleculeDetail(a) {
    const id = clean(a.chemblId).toUpperCase();
    if (!/^CHEMBL\d+$/.test(id))
        throw new SourceError("chemblId must look like CHEMBL25");
    const d = await getJson(`/molecule/${id}.json`);
    if (!d || !d.molecule_chembl_id)
        throw new SourceError(`ChEMBL has no molecule ${id}`);
    const props = d.molecule_properties ?? {};
    const flags = Object.entries(d.molecule_hierarchy ?? {})
        .filter(([, v]) => typeof v === "string")
        .map(([k, v]) => `${k}=${v}`);
    return [
        `${clean(d.pref_name) || id} (${id})`,
        `Type: ${clean(d.molecule_type) || "unknown"} · max phase ${d.max_phase ?? "n/a"}${d.first_approval ? ` · first approval ${d.first_approval}` : ""}`,
        props.full_molformula ? `Formula: ${clean(props.full_molformula)} (MW ${props.full_mwt ?? "?"})` : "",
        props.alogp !== undefined ? `logP: ${props.alogp} · HBA ${props.hba ?? "?"} · HBD ${props.hbd ?? "?"} · TPSA ${props.psa ?? "?"}` : "",
        props.aromatic_rings !== undefined ? `Aromatic rings: ${props.aromatic_rings} · QED ${props.qed_weighted ?? "?"}` : "",
        d.molecule_structures?.canonical_smiles ? `SMILES: ${clean(d.molecule_structures.canonical_smiles)}` : "",
        d.molecule_structures?.standard_inchi_key ? `InChIKey: ${clean(d.molecule_structures.standard_inchi_key)}` : "",
        flags.length ? `Hierarchy: ${flags.join(", ")}` : "",
    ].filter(Boolean).join("\n");
}
export async function searchTargets(a) {
    const q = clean(a.query);
    if (q.length < 2)
        throw new SourceError("query must be at least 2 characters");
    const limit = limitOf(a.limit, 25, 10);
    const d = await getJson(`/target/search.json?q=${encodeURIComponent(q)}&limit=${limit}`);
    const rows = d?.targets ?? [];
    if (!rows.length)
        return `ChEMBL has no target matching "${q}".`;
    return [
        `ChEMBL targets matching "${q}" (${d?.page_meta?.total_count ?? rows.length} total, showing ${rows.length}):`,
        "",
        ...rows.map((t) => [
            `${clean(t.pref_name) || t.target_chembl_id} (${t.target_chembl_id})`,
            `  ${clean(t.target_type) || "type unknown"}${t.organism ? ` · ${clean(t.organism)}` : ""}${Array.isArray(t.target_components) && t.target_components.length ? ` · ${t.target_components.length} component(s)` : ""}`,
        ].join("\n")),
    ].join("\n");
}
