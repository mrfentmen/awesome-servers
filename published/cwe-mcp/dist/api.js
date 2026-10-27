/**
 * CWE — keyless public API client.
 */
const BASE = "https://cwe-api.mitre.org/api/v1";
const SOURCE = "CWE";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "cwe-mcp", accept },
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
const checkId = (n) => {
    if (!Number.isInteger(n) || n < 1 || n > 2000)
        throw new SourceError("CWE id must be a number between 1 and 2000");
    return n;
};
async function summary(id) {
    const d = await getJson(`/cwe/weakness/${id}`).catch(() => null);
    const w = d?.Weaknesses?.[0];
    return w ? String(w.Name) : `CWE-${id}`;
}
export async function getWeakness(a) {
    const id = checkId(a.id);
    const d = await getJson(`/cwe/weakness/${id}`);
    const w = d?.Weaknesses?.[0];
    if (!w)
        throw new SourceError(`CWE has no weakness ${id}`);
    const list = (arr, pick, max = 5) => (arr ?? []).map(pick).filter(Boolean).slice(0, max);
    const mitigations = list(w.PotentialMitigations, (m) => m?.Description ?? "");
    const consequences = list(w.CommonConsequences, (c) => [c?.Scope, c?.Impact, c?.Note].filter(Boolean).join(": "));
    const platforms = list(w.ApplicablePlatforms, (p) => p?.Type ?? "");
    return [
        `CWE-${w.ID}: ${w.Name}`,
        `Abstraction: ${w.Abstraction} · Structure: ${w.Structure} · Status: ${w.Status}`,
        `Description: ${String(w.Description ?? "").trim()}`,
        w.ExtendedDescription ? `Details: ${String(w.ExtendedDescription).trim().slice(0, 900)}` : "",
        consequences.length ? `Consequences:\n${consequences.map((x) => `  - ${x}`).join("\n")}` : "",
        mitigations.length ? `Mitigations:\n${mitigations.map((x) => `  - ${x}`).join("\n")}` : "",
        platforms.length ? `Platforms: ${platforms.join(", ")}` : "",
        `CWE page: https://cwe.mitre.org/data/definitions/${w.ID}.html`,
    ].filter(Boolean).join("\n");
}
export async function weaknessChildren(a) {
    const id = checkId(a.id);
    const d = await getJson(`/cwe/${id}/children`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        return `CWE-${id} has no child weaknesses.`;
    const shown = rows.slice(0, a.limit);
    const names = await Promise.all(shown.map((r) => summary(Number(r.ID))));
    return [
        `${rows.length} children of CWE-${id}:`,
        ...shown.map((r, i) => `${i + 1}. CWE-${r.ID} (${String(r.Type).replace(/_/g, " ")}) - ${names[i]}`),
    ].join("\n");
}
export async function weaknessParents(a) {
    const id = checkId(a.id);
    const d = await getJson(`/cwe/${id}/parents`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        return `CWE-${id} has no listed parents (it may be a pillar).`;
    const unique = [...new Map(rows.map((r) => [String(r.ID), r])).values()];
    const names = await Promise.all(unique.map((r) => summary(Number(r.ID))));
    return [
        `Parents of CWE-${id}:`,
        ...unique.map((r, i) => `${i + 1}. CWE-${r.ID} (${String(r.Type).replace(/_/g, " ")}) - ${names[i]}`),
    ].join("\n");
}
