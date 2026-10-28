/**
 * UK Carbon Intensity — keyless public API client.
 */
const BASE = "https://api.carbonintensity.org.uk";
const SOURCE = "UK Carbon Intensity";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "carbon-intensity-mcp", accept },
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
function isoHalfHour(d) {
    const ms = 30 * 60 * 1000;
    return new Date(Math.floor(d.getTime() / ms) * ms).toISOString().slice(0, 16) + "Z";
}
export async function currentIntensity() {
    const d = await getJson("/intensity");
    const block = Array.isArray(d?.data) ? d.data[0] : undefined;
    if (!block)
        throw new SourceError("Carbon Intensity returned no data block");
    const i = block.intensity ?? {};
    return [
        `UK grid carbon intensity ${clean(block.from)} → ${clean(block.to)}`,
        `Forecast: ${i.forecast ?? "?"} gCO2/kWh · actual: ${i.actual ?? "not yet measured"} · index: ${clean(i.index) || "unknown"}`,
        indexMeaning(clean(i.index)),
        `Source: https://carbonintensity.org.uk/`,
    ].filter(Boolean).join("\n");
}
function indexMeaning(index) {
    const bands = {
        "very low": "very low means under 50 gCO2/kWh - a good time to run heavy jobs",
        low: "low is 50-100 gCO2/kWh",
        moderate: "moderate is 100-200 gCO2/kWh",
        high: "high is 200-300 gCO2/kWh",
        "very high": "very high is over 300 gCO2/kWh - shift flexible work if you can",
    };
    return bands[index] ?? "";
}
export async function intensityForecast(a) {
    const hours = a.hours ?? 6;
    if (!Number.isInteger(hours) || hours < 1 || hours > 48)
        throw new SourceError("hours must be between 1 and 48");
    const from = isoHalfHour(new Date());
    const to = isoHalfHour(new Date(Date.now() + hours * 3600 * 1000));
    const d = await getJson(`/intensity/${from}/${to}`);
    const rows = Array.isArray(d?.data) ? d.data : [];
    if (!rows.length)
        return `Carbon Intensity published no forecast between ${from} and ${to}.`;
    const actuals = rows.map((r) => r.intensity?.actual).filter((v) => typeof v === "number");
    const forecasts = rows.map((r) => r.intensity?.forecast).filter((v) => typeof v === "number");
    const lines = rows.slice(0, 24).map((r) => `  ${clean(r.from)} → ${clean(r.to)}  forecast ${r.intensity?.forecast ?? "?"} gCO2/kWh${r.intensity?.actual !== null && r.intensity?.actual !== undefined ? ` · actual ${r.intensity.actual}` : ""} (${clean(r.intensity?.index) || "unknown"})`);
    return [
        `UK carbon intensity forecast, ${rows.length} half-hour blocks from ${from}:`,
        "",
        ...lines,
        rows.length > 24 ? `... ${rows.length - 24} more blocks not shown` : "",
        "",
        actuals.length ? `Measured so far: ${Math.min(...actuals)}-${Math.max(...actuals)} gCO2/kWh` : "",
        forecasts.length ? `Forecast range: ${Math.min(...forecasts)}-${Math.max(...forecasts)} gCO2/kWh · lowest block ${forecasts.indexOf(Math.min(...forecasts)) + 1} of ${forecasts.length}` : "",
    ].filter(Boolean).join("\n");
}
export async function generationMix() {
    const d = await getJson("/generation");
    const mix = Array.isArray(d?.data?.generationmix) ? d.data.generationmix : [];
    if (!mix.length)
        throw new SourceError("Carbon Intensity returned no generation mix");
    const sorted = [...mix].sort((a, b) => Number(b.perc) - Number(a.perc));
    const renewable = sorted.filter((m) => ["wind", "solar", "hydro", "biomass"].includes(clean(m.fuel))).reduce((sum, m) => sum + Number(m.perc), 0);
    const fossil = sorted.filter((m) => ["gas", "coal", "oil"].includes(clean(m.fuel))).reduce((sum, m) => sum + Number(m.perc), 0);
    return [
        `UK generation mix ${clean(d?.data?.from)} → ${clean(d?.data?.to)}`,
        "",
        ...sorted.map((m) => `  ${clean(m.fuel).padEnd(10)} ${Number(m.perc).toFixed(1).padStart(5)}%`),
        "",
        `Wind + solar + hydro + biomass: ${renewable.toFixed(1)}% · gas + coal + oil: ${fossil.toFixed(1)}%`,
    ].join("\n");
}
