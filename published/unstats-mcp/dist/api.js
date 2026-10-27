/**
 * UN SDG Data — keyless public API client.
 */
const BASE = "https://unstats.un.org/SDGAPI/v1/sdg";
const SOURCE = "UN SDG Data";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "unstats-mcp", accept },
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
export async function listSdgGoals() {
    const d = await getJson("/Goal/List");
    const goals = Array.isArray(d) ? d : [];
    if (!goals.length)
        throw new SourceError("UN SDG API returned no goals");
    return [`${goals.length} Sustainable Development Goals:`, ...goals.map((g) => `Goal ${g.code}: ${g.title}\n   ${String(g.description ?? "").slice(0, 220)}`)].join("\n");
}
export async function indicatorsForGoal(a) {
    const d = await getJson(`/Indicator/List?goal=${a.goal}&pageSize=500`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        throw new SourceError(`No indicators for goal ${a.goal}`);
    return [`${rows.length} indicators for SDG ${a.goal}:`, ...rows.map((r, i) => `${i + 1}. ${r.code} (target ${r.target}, tier ${r.tier ?? "?"})\n   ${String(r.description ?? "").slice(0, 200)}`)].join("\n");
}
export async function indicatorData(a) {
    const code = a.indicator.trim();
    if (!/^\d+\.\d+\.\d+$/.test(code))
        throw new SourceError(`"${a.indicator}" is not an SDG indicator code like 1.1.1`);
    const area = a.areaCode ? `&areaCode=${encodeURIComponent(a.areaCode)}` : "";
    const d = await getJson(`/Indicator/Data?indicator=${code}&pageSize=${a.limit}${area}`);
    const rows = Array.isArray(d?.data) ? d.data : [];
    if (!rows.length)
        return `No data rows for indicator ${code}.`;
    return [
        `${Number(d?.totalElements ?? rows.length).toLocaleString("en-US")} rows for indicator ${code} (showing ${rows.length}):`,
        ...rows.map((r, i) => `${i + 1}. ${r.geoAreaName ?? r.areaCode ?? "?"} · ${r.timePeriodStart ?? r.year ?? "?"} · ${r.value ?? "?"}${r.units ? ` ${r.units}` : ""}`),
    ].join("\n");
}
