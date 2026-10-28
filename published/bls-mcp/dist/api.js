/**
 * US Bureau of Labor Statistics — keyless public API client.
 */
const BASE = "https://api.bls.gov/publicAPI/v2";
const SOURCE = "US Bureau of Labor Statistics";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "bls-mcp", accept },
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
function ok(d) {
    if (!d || d.status !== "REQUEST_SUCCEEDED") {
        const message = Array.isArray(d?.message) ? d.message.join("; ") : clean(d?.message);
        throw new SourceError(message || "BLS rejected the request");
    }
    return d.Results;
}
export async function seriesData(a) {
    const id = clean(a.seriesId).toUpperCase();
    if (!/^[A-Z0-9]{4,40}$/.test(id))
        throw new SourceError("seriesId must be letters and digits, e.g. CES0000000001");
    const startYear = clean(a.startYear);
    const endYear = clean(a.endYear);
    if (!/^\d{4}$/.test(startYear) || !/^\d{4}$/.test(endYear))
        throw new SourceError("startYear and endYear must be four-digit years");
    const span = Number(endYear) - Number(startYear);
    if (span < 0)
        throw new SourceError("endYear must not be before startYear");
    if (span > 20)
        throw new SourceError("BLS allows at most a 20 year range");
    const d = ok(await getJson(`/timeseries/data/${id}?startyear=${startYear}&endyear=${endYear}`));
    const series = Array.isArray(d?.series) ? d.series[0] : undefined;
    const rows = Array.isArray(series?.data) ? series.data : [];
    if (!rows.length)
        return `BLS has no observations for ${id} between ${startYear} and ${endYear}.`;
    const empty = rows.filter((r) => clean(r.value) === "" || clean(r.value) === "-").length;
    const usable = rows.filter((r) => clean(r.value) !== "" && clean(r.value) !== "-");
    return [
        `${id}${series?.catalog?.series_title ? ` - ${clean(series.catalog.series_title)}` : ""}`,
        `${rows.length} observation(s) from ${startYear} to ${endYear}${empty ? ` (${empty} blank)` : ""}`,
        "",
        ...usable.slice(0, 24).map((r) => `- ${clean(r.periodName)} ${clean(r.year)}: ${clean(r.value)}${r.footnotes?.length ? ` (${r.footnotes.map((f) => clean(f.text)).join("; ")})` : ""}`),
        usable.length > 24 ? `... ${usable.length - 24} more observation(s)` : "",
        "",
        `Series page: https://data.bls.gov/timeseries/${id}`,
    ].filter(Boolean).join("\n");
}
export async function listSurveys(a) {
    const limit = a.limit ?? 40;
    if (!Number.isInteger(limit) || limit < 1 || limit > 120)
        throw new SourceError("limit must be between 1 and 120");
    const d = ok(await getJson(`/surveys`));
    const rows = Array.isArray(d?.survey) ? d.survey : [];
    if (!rows.length)
        throw new SourceError("BLS returned no surveys");
    return [
        `BLS runs ${rows.length} surveys (showing ${Math.min(limit, rows.length)}):`,
        "",
        ...rows.slice(0, limit).map((s) => `- ${clean(s.survey_abbreviation)}: ${clean(s.survey_name)}`),
    ].join("\n");
}
export async function popularSeries(a) {
    const limit = a.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50)
        throw new SourceError("limit must be between 1 and 50");
    const d = ok(await getJson(`/timeseries/popular`));
    const rows = Array.isArray(d?.series) ? d.series : [];
    if (!rows.length)
        throw new SourceError("BLS returned no popular series");
    return [
        `BLS most-requested series (${rows.length} on the list, showing ${Math.min(limit, rows.length)}):`,
        "",
        ...rows.slice(0, limit).map((s) => `- ${clean(s.seriesID)}${Array.isArray(s.catalog) && s.catalog[0]?.series_title ? ` - ${clean(s.catalog[0].series_title)}` : ""}`),
        "",
        `Look any of these up with series_data, e.g. https://data.bls.gov/timeseries/${clean(rows[0].seriesID)}`,
    ].join("\n");
}
