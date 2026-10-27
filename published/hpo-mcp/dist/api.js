/**
 * Human Phenotype Ontology — keyless public API client.
 */
const BASE = "https://ontology.jax.org/api/hp";
const SOURCE = "Human Phenotype Ontology";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "hpo-mcp", accept },
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
const HP = /^HP:\d{7}$/;
function check(raw) {
    const v = raw.trim().toUpperCase();
    if (!HP.test(v))
        throw new SourceError(`"${raw}" is not an HPO ID like HP:0001250`);
    return v;
}
export async function searchPhenotypes(a) {
    const q = a.query.trim();
    if (q.length < 2)
        throw new SourceError("search text must be at least 2 characters");
    const d = await getJson(`/search?q=${encodeURIComponent(q)}&page=0&size=${a.limit}`);
    const rows = Array.isArray(d?.terms) ? d.terms : [];
    if (!rows.length)
        return `HPO has no phenotype matching "${q}".`;
    return [
        `${Number(d?.total ?? rows.length).toLocaleString("en-US")} terms match "${q}" (showing ${rows.length}):`,
        ...rows.map((r, i) => `${i + 1}. ${r.id} - ${r.name}${r.definition ? `\n   ${String(r.definition).slice(0, 220)}` : ""}`),
    ].join("\n");
}
export async function phenotypeTerm(a) {
    const id = check(a.id);
    const d = await getJson(`/terms/${id}`);
    const synonyms = (d?.synonyms ?? []).map((s) => s?.name ?? s).filter(Boolean);
    const parents = d?.parents ?? [];
    const children = await getJson(`/terms/${id}/children`).catch(() => []);
    return [
        `${d.id} - ${d.name}`,
        `Definition: ${String(d.definition ?? "").trim() || "none"}`,
        d.comment ? `Comment: ${String(d.comment).trim().slice(0, 600)}` : "",
        synonyms.length ? `Synonyms: ${synonyms.slice(0, 10).join(", ")}` : "",
        parents.length ? `Parents: ${parents.map((p) => `${p.id} ${p.name}`).join(", ")}` : "",
        Array.isArray(children) && children.length ? `Children: ${children.length} more specific terms` : "",
        `HPO: https://hpo.jax.org/browse/term/${d.id}`,
    ].filter(Boolean).join("\n");
}
export async function phenotypeChildren(a) {
    const id = check(a.id);
    const d = await getJson(`/terms/${id}/children`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        return `${id} has no child terms.`;
    return [`${rows.length} children of ${id}:`, ...rows.slice(0, a.limit).map((r, i) => `${i + 1}. ${r.id} - ${r.name}`)].join("\n");
}
