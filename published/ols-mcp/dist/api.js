/**
 * EBI Ontology Lookup — keyless public API client.
 */
const BASE = "https://www.ebi.ac.uk/ols4/api";
const SOURCE = "EBI Ontology Lookup";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "ols-mcp", accept },
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
function checkOntology(raw) {
    const v = raw.trim().toLowerCase();
    if (!/^[a-z][a-z0-9_-]{0,20}$/.test(v))
        throw new SourceError(`"${raw}" is not an ontology id`);
    return v;
}
export async function searchOntologyTerms(a) {
    const q = a.query.trim();
    if (q.length < 2)
        throw new SourceError("search text must be at least 2 characters");
    const onto = a.ontology ? `&ontology=${encodeURIComponent(checkOntology(a.ontology))}` : "";
    const d = await getJson(`/search?q=${encodeURIComponent(q)}&size=${a.limit}${onto}`);
    const docs = d?.response?.docs ?? [];
    if (!docs.length)
        return `No ontology terms match "${q}".`;
    return [
        `${Number(d?.response?.numFound ?? docs.length).toLocaleString("en-US")} terms match "${q}" (showing ${docs.length}):`,
        ...docs.map((r, i) => `${i + 1}. ${r.label} [${r.ontology_name}]${r.obo_id ? ` (${r.obo_id})` : ""}\n   ${r.iri}`),
    ].join("\n");
}
export async function listOntologies(a) {
    const d = await getJson(`/ontologies?size=${a.limit}`);
    const rows = d?._embedded?.ontologies ?? [];
    const q = a.query?.trim().toLowerCase();
    const filtered = q ? rows.filter((r) => `${r.ontologyId} ${r.config?.title ?? ""}`.toLowerCase().includes(q)) : rows;
    if (!filtered.length)
        return `No ontology matches "${a.query}".`;
    return [
        `${Number(d?.page?.totalElements ?? rows.length).toLocaleString("en-US")} ontologies loaded (showing ${filtered.length}):`,
        ...filtered.map((r, i) => `${i + 1}. ${r.ontologyId} - ${r.config?.title ?? r.ontologyId} (${Number(r.numberOfTerms ?? 0).toLocaleString("en-US")} terms)`),
    ].join("\n");
}
export async function ontologyTerm(a) {
    const onto = checkOntology(a.ontology);
    const d = await getJson(`/ontologies/${onto}/terms?iri=${encodeURIComponent(a.iri)}`);
    const t = d?._embedded?.terms?.[0];
    if (!t)
        throw new SourceError(`Ontology ${onto} has no term at that IRI`);
    const desc = Array.isArray(t.description) ? t.description.join(" ") : String(t.description ?? "");
    const syn = (t.synonyms ?? []).slice(0, 8);
    return [
        `${t.label}${t.obo_id ? ` (${t.obo_id})` : ""}`,
        `Ontology: ${t.ontology_name ?? onto}`,
        `IRI: ${t.iri}`,
        desc ? `Definition: ${desc.slice(0, 900)}` : "",
        syn.length ? `Synonyms: ${syn.join(", ")}` : "",
        t.is_obsolete ? "Status: obsolete" : "Status: active",
    ].filter(Boolean).join("\n");
}
