const m0 = (() => {
    const BASE = "https://services.swpc.noaa.gov/products";
    const headers = { "User-Agent": "mrfentmen-space-weather-mcp/1.0 (https://github.com/mrfentmen)" };
    class SpaceWeatherError extends Error {
    }
    async function request(path) { const res = await fetch(`${BASE}${path}`, { headers, signal: AbortSignal.timeout(20000) }); if (!res.ok)
        throw new SpaceWeatherError(`NOAA SWPC error ${res.status}`); return (await res.json()); }
    function solarWindSpeed() { return request(`/summary/solar-wind-speed.json`); }
    function scales() { return request(`/noaa-scales.json`); }
    function alerts() { return request(`/alerts.json`); }
    function formatSpeed(rows) { return rows.slice(-20).map((x) => `${x.time_tag ?? "unknown time"}: ${x.proton_speed ?? "unknown"} km/s`).join("\n"); }
    function formatScales(data) { return Object.entries(data).map(([key, x]) => `${key}: ${x.DateStamp ?? ""} ${x.TimeStamp ?? ""} | Radio R${x.R?.Scale ?? "?"} ${x.R?.Text ?? ""} | Solar S${x.S?.Scale ?? "?"} ${x.S?.Text ?? ""} | Geomagnetic G${x.G?.Scale ?? "?"} ${x.G?.Text ?? ""}`).join("\n"); }
    function formatAlerts(rows) { return rows.slice(0, 12).map((x) => `${x.issue_datetime ?? "unknown time"} ${x.product_id ?? "alert"}\n${(x.message ?? "").slice(0, 700)}`).join("\n\n"); }
    return { SpaceWeatherError, alerts, formatAlerts, formatScales, formatSpeed, scales, solarWindSpeed };
})();
const m1 = (() => {
    const UA = "mrfentmen-aurora-forecast-mcp/1.0 (https://github.com/mrfentmen)";
    const URL = "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json";
    class AuroraError extends Error {
    }
    async function get() {
        const res = await fetch(URL, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
        if (!res.ok)
            throw new AuroraError(`NOAA SWPC returned HTTP ${res.status}`);
        return res.json();
    }
    async function latest(_args) {
        const d = await get();
        const obs = d["Observation Time"] ?? "n/a";
        const fc = d["Forecast Time"] ?? "n/a";
        const coords = Array.isArray(d.coordinates) ? d.coordinates.length : 0;
        return [
            `Observation time: ${obs}`,
            `Forecast time: ${fc}`,
            `Map points: ${coords} (longitude, latitude, aurora intensity)`,
        ].join("\n");
    }
    async function map(_args) {
        const d = await get();
        const coords = Array.isArray(d.coordinates) ? d.coordinates : [];
        if (!coords.length)
            return "No aurora map data available right now";
        let max = -Infinity;
        for (const row of coords) {
            if (row && typeof row[2] === "number" && row[2] > max)
                max = row[2];
        }
        const strong = coords.filter((row) => row && typeof row[2] === "number" && row[2] > 1).length;
        return [
            `Aurora map generated at ${d["Forecast Time"] ?? "n/a"}`,
            `Peak intensity: ${max === -Infinity ? "n/a" : max.toFixed(2)}`,
            `Points with strong aurora (intensity above 1): ${strong}`,
            `Total map points: ${coords.length}`,
        ].join("\n");
    }
    return { AuroraError, latest, map };
})();
const m2 = (() => {
    const BASE = 'https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json';
    async function xrays(args = {}) {
        const res = await fetch(BASE, {
            headers: { 'User-Agent': 'mrfentmen-space-weather-json-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`NOAA SWPC returned ${res.status}`);
        const rows = (await res.json());
        if (!Array.isArray(rows) || !rows.length)
            return 'No solar x ray data available.';
        const limit = Math.max(1, Math.min(args.limit ?? 12, 50));
        const shown = rows.slice(-limit).reverse();
        return `Solar x ray flux (${shown.length} most recent):\n` +
            shown
                .map((r, i) => `${i + 1}. ${r.time_tag ?? 'no time'} | ${r.satellite ?? ''} | ${typeof r.flux === 'number' ? r.flux.toExponential(2) : r.flux ?? ''} W/m2`)
                .join('\n');
    }
    return { xrays };
})();
export const AuroraError = m1.AuroraError;
export const SpaceWeatherError = m0.SpaceWeatherError;
export const alerts = m0.alerts;
export const formatAlerts = m0.formatAlerts;
export const formatScales = m0.formatScales;
export const formatSpeed = m0.formatSpeed;
export const latest = m1.latest;
export const map = m1.map;
export const scales = m0.scales;
export const solarWindSpeed = m0.solarWindSpeed;
export const xrays = m2.xrays;
export const m0_alerts = m0.alerts;
export const m0_formatScales = m0.formatScales;
export const m0_formatSpeed = m0.formatSpeed;
export const m0_formatAlerts = m0.formatAlerts;
export const m0_scales = m0.scales;
export const m0_solarWindSpeed = m0.solarWindSpeed;
export const m0_SpaceWeatherError = m0.SpaceWeatherError;
export const m1_latest = m1.latest;
export const m1_AuroraError = m1.AuroraError;
export const m1_map = m1.map;
export const m2_xrays = m2.xrays;
// ---- muxC tools:
