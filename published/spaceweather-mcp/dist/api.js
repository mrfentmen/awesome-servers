/**
 * Space Weather — keyless public API client.
 */
const BASE = "https://services.swpc.noaa.gov";
const SOURCE = "Space Weather";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "spaceweather-mcp", accept },
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
export async function getJson(path, accept = "application/json", timeoutMs = 25000) {
    const res = await request(path, accept, timeoutMs);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
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
function stormLevel(kp) {
    if (kp >= 9)
        return "G5 extreme storm";
    if (kp >= 8)
        return "G4 severe storm";
    if (kp >= 7)
        return "G3 strong storm";
    if (kp >= 6)
        return "G2 moderate storm";
    if (kp >= 5)
        return "G1 minor storm";
    if (kp >= 4)
        return "active";
    return "quiet";
}
export async function kpIndex(a) {
    const hours = clampLimit(a.hours, 8, 24);
    const data = await getJson("/products/noaa-planetary-k-index.json", "application/json", 25000);
    if (!Array.isArray(data) || !data.length)
        throw new SourceError("SWPC returned no Kp data");
    const rows = data.slice(-hours);
    const latest = rows[rows.length - 1];
    const kp = Number(latest?.Kp);
    const maxKp = Math.max(...rows.map((r) => Number(r?.Kp)).filter(Number.isFinite));
    return [
        `Latest Kp: ${kp.toFixed(2)} (${stormLevel(kp)}) at ${clean(latest?.time_tag)} UTC`,
        `Highest in the last ${rows.length} entries: ${maxKp.toFixed(2)}`,
        "",
        "time (UTC)            Kp    level",
        ...rows.map((r) => {
            const v = Number(r?.Kp);
            return `${clean(r?.time_tag).padEnd(20)} ${v.toFixed(2).padStart(5)}  ${stormLevel(v)}`;
        }),
        "",
        "Kp is the 3-hour planetary geomagnetic index; 5 or above means a storm and visible aurora at lower latitudes.",
    ].join("\n");
}
export async function auroraForecast(a) {
    const data = await getJson("/json/ovation_aurora_latest.json", "application/json", 30000);
    const coords = Array.isArray(data?.coordinates) ? data.coordinates : [];
    if (!coords.length)
        throw new SourceError("SWPC returned no aurora grid");
    const observed = clean(data["Observation Time"]);
    const forecast = clean(data["Forecast Time"]);
    const hasPoint = a.lat !== undefined && a.lon !== undefined;
    const lines = [
        `Aurora model: observed ${observed}, forecast for ${forecast}`,
        "",
    ];
    if (hasPoint) {
        const lat = Math.round(a.lat);
        const lon = Math.round(a.lon);
        let best = null;
        for (const [x, y, v] of coords) {
            const dLat = Math.abs(Number(y) - lat);
            // Longitude wraps at 360, so -22 is the same column as 338.
            const dLonRaw = Math.abs(Number(x) - lon);
            const dLon = Math.min(dLonRaw, 360 - dLonRaw);
            const score = dLat + dLon;
            if (!best || score < best.score)
                best = { lat: Number(y), lon: Number(x), value: Number(v), score };
        }
        const value = best ? best.value : 0;
        lines.push(`At ${lat}, ${lon} (nearest grid cell ${best?.lat}, ${best?.lon}): aurora probability ${value}%`, "", value >= 50 ? "Aurora is likely overhead if skies are clear." :
            value >= 20 ? "Aurora is possible overhead, better chance looking toward the pole." :
                value >= 5 ? "Aurora is unlikely overhead; look north for a glow." :
                    "No aurora expected at this location.", "", "The model is a 30-90 minute forecast; clouds and moonlight decide what you actually see.");
    }
    else {
        const cells = coords.map(([x, y, v]) => ({ lat: Number(y), lon: Number(x), value: Number(v) }));
        for (const hemisphere of [{ name: "north", test: (c) => c.lat > 0 }, { name: "south", test: (c) => c.lat < 0 }]) {
            const subset = cells.filter(hemisphere.test);
            const strong = subset.filter((c) => c.value >= 50);
            const mild = subset.filter((c) => c.value >= 10);
            const lowestLat = strong.length ? Math.min(...strong.map((c) => Math.abs(c.lat))) : null;
            lines.push(`${hemisphere.name}: ${strong.length} cell(s) with 50%+ probability, ${mild.length} with 10%+` +
                (lowestLat !== null ? ` - aurora reaching down to about ${lowestLat} degrees latitude` : " - no strong aurora belt right now"));
        }
        lines.push("", "Pass lat and lon to check one place.");
    }
    return lines.join("\n");
}
export async function alerts(a) {
    const limit = clampLimit(a.limit, 5, 20);
    const data = await getJson("/products/alerts.json", "application/json", 25000);
    if (!Array.isArray(data) || !data.length)
        return "SWPC has no active alerts or warnings right now.";
    const rows = data.slice(0, limit);
    return [
        `${data.length} alert(s) on the feed, newest first (showing ${rows.length}):`,
        "",
        ...rows.map((al, i) => {
            const message = clean(al?.message).replace(/\s+/g, " ");
            return `${i + 1}. [${clean(al?.product_id)}] ${clean(al?.issue_datetime)} UTC\n   ${message.slice(0, 240)}${message.length > 240 ? " ..." : ""}`;
        }),
    ].join("\n");
}
