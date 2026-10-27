/**
 * CourtListener API v4 client, keyless for search.
 * Docs: https://www.courtlistener.com/help/api/rest/
 * Full opinion/docket detail endpoints need an API key; search does not.
 */
const BASE = "https://www.courtlistener.com/api/rest/v4";
export class CourtListenerError extends Error {
}
async function searchApi(query, type, limit) {
    const url = `${BASE}/search/?q=${encodeURIComponent(query)}&type=${type}`;
    const res = await fetch(url, {
        headers: { "User-Agent": "courtlistener-mcp/1.0" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new CourtListenerError(`CourtListener error ${res.status}`);
    const data = (await res.json());
    const results = Array.isArray(data.results) ? data.results : [];
    return results.slice(0, limit);
}
const fullUrl = (path) => typeof path === "string" && path ? `https://www.courtlistener.com${path}` : undefined;
const clean = (s, max) => {
    if (typeof s !== "string" || !s)
        return undefined;
    const t = s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    return t ? (t.length > max ? t.slice(0, max) + "..." : t) : undefined;
};
export async function searchOpinions(query, limit = 5) {
    const rows = await searchApi(query, "o", limit);
    return rows.map((r) => ({
        caseName: typeof r.caseName === "string" ? r.caseName : undefined,
        court: typeof r.court === "string" ? r.court : undefined,
        dateFiled: typeof r.dateFiled === "string" ? r.dateFiled.slice(0, 10) : undefined,
        status: typeof r.status === "string" ? r.status : undefined,
        citation: Array.isArray(r.citation) ? String(r.citation[0]) : typeof r.citation === "string" ? r.citation : undefined,
        citeCount: typeof r.citeCount === "number" ? r.citeCount : undefined,
        judge: typeof r.judge === "string" && r.judge ? r.judge : undefined,
        syllabus: clean(r.syllabus, 280),
        url: fullUrl(r.absolute_url),
    }));
}
export async function searchDockets(query, limit = 5) {
    const rows = await searchApi(query, "r", limit);
    return rows.map((r) => ({
        caseName: typeof r.caseName === "string" ? r.caseName : undefined,
        court: typeof r.court === "string" ? r.court : undefined,
        docketNumber: typeof r.docketNumber === "string" ? r.docketNumber : undefined,
        dateFiled: typeof r.dateFiled === "string" ? r.dateFiled.slice(0, 10) : undefined,
        url: fullUrl(r.absolute_url),
    }));
}
export function formatOpinion(o, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const lines = [
        `${prefix}${o.caseName ?? "(unnamed case)"}${o.status ? ` [${o.status}]` : ""}`,
        o.court ? `Court: ${o.court}` : "",
        o.dateFiled ? `Filed: ${o.dateFiled}` : "",
        o.citation ? `Cite: ${o.citation}` : "",
        o.citeCount !== undefined ? `Cited by: ${o.citeCount}` : "",
        o.judge ? `Judge: ${o.judge}` : "",
        o.syllabus ? `Syllabus: ${o.syllabus}` : "",
        o.url ? `More: ${o.url}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatDocket(d, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const lines = [
        `${prefix}${d.caseName ?? "(unnamed docket)"}${d.docketNumber ? ` (${d.docketNumber})` : ""}`,
        d.court ? `Court: ${d.court}` : "",
        d.dateFiled ? `Filed: ${d.dateFiled}` : "",
        d.url ? `More: ${d.url}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export async function searchPeople(query, limit = 5) {
    const rows = await searchApi(query, "p", limit);
    return rows.map((r) => ({
        name: typeof r.name === "string" ? r.name : undefined,
        court: typeof r.court === "string" ? r.court : undefined,
        dateFiled: typeof r.dateFiled === "string" ? r.dateFiled.slice(0, 10) : undefined,
        url: fullUrl(r.absolute_url),
    }));
}
export function formatPerson(p, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const lines = [
        `${prefix}${p.name ?? "(unnamed person)"}`,
        p.court ? `Court: ${p.court}` : "",
        p.dateFiled ? `Filed: ${p.dateFiled}` : "",
        p.url ? `More: ${p.url}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export async function searchOralArgs(query, limit = 5) {
    const rows = await searchApi(query, "oa", limit);
    return rows.map((r) => ({
        caseName: typeof r.caseName === "string" ? r.caseName : undefined,
        court: typeof r.court === "string" ? r.court : undefined,
        dateArgued: typeof r.dateArgued === "string" ? r.dateArgued.slice(0, 10) : undefined,
        duration: typeof r.duration === "string" ? r.duration : undefined,
        url: fullUrl(r.absolute_url),
    }));
}
export function formatOralArg(o, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const lines = [
        `${prefix}${o.caseName ?? "(unnamed argument)"}`,
        o.court ? `Court: ${o.court}` : "",
        o.dateArgued ? `Argued: ${o.dateArgued}` : "",
        o.duration ? `Duration: ${o.duration}` : "",
        o.url ? `Listen: ${o.url}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
