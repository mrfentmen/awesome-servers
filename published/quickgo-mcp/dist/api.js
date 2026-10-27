/**
 * QuickGO — keyless public API client.
 */
const BASE = "https://www.ebi.ac.uk/QuickGO/services";
const SOURCE = "QuickGO";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "quickgo-mcp", accept },
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
const GO = /^GO:\d{7}$/;
function check(raw) {
    const v = raw.trim().toUpperCase();
    if (!GO.test(v))
        throw new SourceError(`"${raw}" is not a GO ID like GO:0006915`);
    return v;
}
export async function getGoTerm(a) {
    const id = check(a.id);
    const d = await getJson(`/ontology/go/terms/${id}`);
    const t = d?.results?.[0];
    if (!t)
        throw new SourceError(`QuickGO has no term ${id}`);
    return [
        `${t.id} - ${t.name}`,
        `Aspect: ${t.aspect}`,
        `Definition: ${String(t.definition?.text ?? "").trim() || "none"}`,
        t.definition?.xrefs?.length ? `References: ${t.definition.xrefs.join(", ")}` : "",
        (t.synonyms ?? []).length ? `Synonyms: ${(t.synonyms ?? []).map((s) => s.name).slice(0, 8).join(", ")}` : "",
        t.isObsolete ? "Status: obsolete" : "Status: active",
    ].filter(Boolean).join("\n");
}
export async function goTermChildren(a) {
    const id = check(a.id);
    const d = await getJson(`/ontology/go/terms/${id}/children`);
    const kids = d?.results?.[0]?.children ?? [];
    if (!kids.length)
        return `${id} has no direct children.`;
    return [`${kids.length} children of ${id}:`, ...kids.slice(0, a.limit).map((k, i) => `${i + 1}. ${k.id} - ${k.name} (${k.relation})`)].join("\n");
}
export async function goAnnotations(a) {
    const id = check(a.id);
    const taxon = a.taxonId ? `&taxonId=${a.taxonId}` : "";
    const d = await getJson(`/annotation/search?goId=${id}&limit=${a.limit}${taxon}`);
    const rows = d?.results ?? [];
    if (!rows.length)
        return `No annotations for ${id}${a.taxonId ? ` in taxon ${a.taxonId}` : ""}.`;
    return [
        `${Number(d?.numberOfHits ?? rows.length).toLocaleString("en-US")} annotations for ${id} (showing ${rows.length}):`,
        ...rows.map((r, i) => `${i + 1}. ${r.symbol || r.geneProductId} (${r.taxonId ?? "?"}) - ${r.qualifier ?? ""} ${r.goId} via ${r.evidenceCode ?? ""}${r.assignedBy ? ` · ${r.assignedBy}` : ""}`),
    ].join("\n");
}
