/**
 * MET Norway Locationforecast 2.0 (the data behind yr.no). Keyless, but their
 * terms require a User-Agent that identifies the application and a contact —
 * both are sent on every request below.
 */
const BASE = "https://api.met.no/weatherapi/locationforecast/2.0/compact";
const UA = "met-no-mcp/1.0 github.com/mrfentmen/awesome-servers";
export class MetNoError extends Error {
}
async function forecast(lat, lon, timeoutMs = 30000) {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180)
        throw new MetNoError("Latitude or longitude out of range");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(`${BASE}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`, {
            signal: ctrl.signal,
            headers: { "user-agent": UA, accept: "application/json" },
        });
        if (res.status === 429)
            throw new MetNoError("MET Norway is rate limiting — retry in a minute");
        if (!res.ok)
            throw new MetNoError(`MET Norway responded ${res.status}`);
        return await res.json();
    }
    catch (e) {
        if (e instanceof MetNoError)
            throw e;
        if (e.name === "AbortError")
            throw new MetNoError("MET Norway request timed out");
        if (e instanceof SyntaxError)
            throw new MetNoError("MET Norway returned malformed JSON");
        throw new MetNoError(`MET Norway request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
const SYMBOLS = {
    clearsky: "clear",
    fair: "fair",
    partlycloudy: "partly cloudy",
    cloudy: "cloudy",
    fog: "fog",
    lightrain: "light rain",
    rain: "rain",
    heavyrain: "heavy rain",
    lightrainshowers: "light showers",
    rainshowers: "showers",
    heavyrainshowers: "heavy showers",
    lightsleet: "light sleet",
    sleet: "sleet",
    snow: "snow",
    lightsnow: "light snow",
    heavysnow: "heavy snow",
    sleetshowers: "sleet showers",
    snowshowers: "snow showers",
    thunderstorm: "thunderstorm",
};
function describe(code) {
    const c = String(code ?? "");
    if (!c)
        return "no symbol";
    const base = c.replace(/_(day|night|polartwilight)$/, "");
    return SYMBOLS[base] ?? base.replace(/_/g, " ");
}
function toPoints(d) {
    const series = d?.properties?.timeseries ?? [];
    return series.map((t) => {
        const inst = t.data?.instant?.details ?? {};
        const next1 = t.data?.next_1_hours;
        const next6 = t.data?.next_6_hours;
        return {
            time: String(t.time ?? ""),
            temp: Number(inst.air_temperature ?? NaN),
            wind: Number(inst.wind_speed ?? NaN),
            windDir: Number(inst.wind_from_direction ?? NaN),
            humidity: Number(inst.relative_humidity ?? NaN),
            pressure: Number(inst.air_pressure_at_sea_level ?? NaN),
            cloud: Number(inst.cloud_area_fraction ?? NaN),
            symbol: next1?.summary?.symbol_code ?? next6?.summary?.symbol_code,
            precip: next1?.details?.precipitation_amount,
            precipMin: next6?.details?.precipitation_amount_min,
            precipMax: next6?.details?.precipitation_amount_max,
        };
    });
}
const hour = (iso) => iso.slice(11, 16);
const dayOf = (iso) => iso.slice(0, 10);
const f = (v, digits = 1) => (Number.isFinite(v) ? v.toFixed(digits) : "n/a");
function compass(deg) {
    if (!Number.isFinite(deg))
        return "?";
    const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return dirs[Math.round(deg / 22.5) % 16];
}
export async function currentConditions(lat, lon) {
    const d = await forecast(lat, lon);
    const pts = toPoints(d);
    if (pts.length === 0)
        throw new MetNoError("MET Norway returned no forecast points");
    const p = pts[0];
    return [
        `Conditions at ${lat}, ${lon} (MET Norway / yr.no)`,
        `Updated: ${String(d.properties?.meta?.updated_at ?? "").slice(0, 16).replace("T", " ")}Z`,
        "",
        `Temperature: ${f(p.temp)}°C`,
        `Wind: ${f(p.wind)} m/s from ${compass(p.windDir)}`,
        `Humidity: ${f(p.humidity, 0)}% · cloud cover ${f(p.cloud, 0)}%`,
        `Pressure: ${f(p.pressure, 1)} hPa`,
        p.symbol ? `Sky: ${describe(p.symbol)}` : "",
        Number.isFinite(p.precip) ? `Precipitation next hour: ${f(p.precip ?? NaN)} mm` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
export async function hourly(lat, lon, hours) {
    const d = await forecast(lat, lon);
    const pts = toPoints(d).slice(0, hours);
    if (pts.length === 0)
        throw new MetNoError("MET Norway returned no forecast points");
    return [
        `Hourly forecast for ${lat}, ${lon} — next ${pts.length} hours:`,
        "",
        ...pts.map((p) => `   ${dayOf(p.time)} ${hour(p.time)}  ${f(p.temp).padStart(5)}°C  wind ${f(p.wind).padStart(4)} m/s ${compass(p.windDir).padEnd(3)}  ${describe(p.symbol)}${Number.isFinite(p.precip) ? `  ${f(p.precip ?? NaN)} mm` : ""}`),
    ].join("\n");
}
export async function daily(lat, lon, days) {
    const d = await forecast(lat, lon);
    const pts = toPoints(d);
    const byDay = new Map();
    for (const p of pts) {
        const k = dayOf(p.time);
        byDay.set(k, [...(byDay.get(k) ?? []), p]);
    }
    const summary = [...byDay.entries()].slice(0, days).map(([date, list]) => {
        const temps = list.map((x) => x.temp).filter(Number.isFinite);
        const rain = list.reduce((a, x) => a + (Number.isFinite(x.precip ?? NaN) ? Number(x.precip) : 0), 0);
        const noon = list.find((x) => x.time.includes("T12:")) ?? list[Math.floor(list.length / 2)];
        return `   ${date}  min ${f(Math.min(...temps))}°C / max ${f(Math.max(...temps))}°C  rain ${rain.toFixed(1)} mm  ${describe(noon?.symbol)}`;
    });
    return [`Daily forecast for ${lat}, ${lon} (${summary.length} days):`, "", ...summary].join("\n");
}
export async function precipitationOutlook(lat, lon, hours) {
    const d = await forecast(lat, lon);
    const pts = toPoints(d).slice(0, hours);
    const wet = pts.filter((p) => Number(p.precip ?? 0) > 0.05);
    if (wet.length === 0) {
        return `No measurable precipitation expected at ${lat}, ${lon} in the next ${pts.length} hours.`;
    }
    const total = wet.reduce((a, p) => a + Number(p.precip ?? 0), 0);
    return [
        `Rain expected at ${lat}, ${lon} in ${wet.length} of the next ${pts.length} hours (total ${total.toFixed(1)} mm):`,
        "",
        ...wet.map((p) => `   ${dayOf(p.time)} ${hour(p.time)} — ${f(p.precip ?? NaN)} mm, ${describe(p.symbol)}`),
    ].join("\n");
}
export async function compare(latA, lonA, latB, lonB) {
    const [a, b] = await Promise.all([forecast(latA, lonA), forecast(latB, lonB)]);
    const pa = toPoints(a);
    const pb = toPoints(b);
    if (!pa.length || !pb.length)
        throw new MetNoError("One of the locations returned no forecast");
    const tempAt = (pts, h) => {
        const idx = pts.findIndex((p) => p.time.slice(11, 13) === String(h).padStart(2, "0"));
        return f(pts[idx >= 0 ? idx : 0].temp);
    };
    const rows = [6, 12, 18, 21]
        .map((h) => `   ${String(h).padStart(2, "0")}:00  ${tempAt(pa, h).padStart(6)}°C  vs  ${tempAt(pb, h).padStart(6)}°C`)
        .join("\n");
    return [
        `Temperature comparison, first forecast day:`,
        `   A = ${latA}, ${lonA} · B = ${latB}, ${lonB}`,
        "",
        rows,
    ].join("\n");
}
