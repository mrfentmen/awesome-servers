const m0 = (() => {
    const UA = "mrfentmen-weather-mcp/1.0 (https://github.com/mrfentmen)";
    class WeatherError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) });
        if (!res.ok)
            throw new WeatherError(`API error ${res.status}`);
        return (await res.json());
    }
    async function forecast(args) {
        const lat = args.lat ?? 0;
        const lon = args.lon ?? 0;
        if (!lat && !lon)
            throw new WeatherError("Provide lat and lon");
        const points = await get(`https://api.weather.gov/points/${lat},${lon}`);
        const fc = await get(points.properties?.forecast);
        const periods = (fc.properties?.periods ?? []).slice(0, 12);
        return `Forecast for ${points.properties?.relativeLocation?.properties?.city ?? ""}, ${points.properties?.relativeLocation?.properties?.state ?? ""}\n${periods.map((p) => `${p.name}: ${p.temperature}${p.temperatureUnit} ${p.shortForecast}\n  ${p.detailedForecast.slice(0, 140)}`).join("\n")}`;
    }
    async function earthquakes(args) {
        const days = args.days === 7 ? "all_week" : "all_day";
        const d = await get(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${days}.geojson`);
        const rows = (d.features ?? []).slice(0, 20);
        return `Recent earthquakes (${days === "all_week" ? "week" : "day"}): ${d.metadata?.count ?? 0} total\n${rows.map((f) => {
            const p = f.properties ?? {};
            return `${p.mag ?? "?"}M | ${p.place ?? ""} | ${new Date(p.time ?? 0).toISOString().slice(0, 16)}`;
        }).join("\n")}`;
    }
    async function femaDisasters(args) {
        const limit = Math.min(args.limit ?? 10, 25);
        const d = await get(`https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$top=${limit}&$orderby=declarationDate%20desc`);
        const rows = (d.DisasterDeclarationsSummaries ?? [])
            .slice()
            .sort((a, b) => String(b.declarationDate ?? "").localeCompare(String(a.declarationDate ?? "")))
            .slice(0, limit);
        return rows.map((r) => `${r.declarationDate?.slice(0, 10) ?? ""} | ${r.incidentType ?? ""} | ${r.state ?? ""}\n  ${r.declarationTitle ?? r.incidentTitle ?? ""} | ${r.femaDeclarationString ?? ""}`).join("\n\n") || "No disasters found";
    }
    return { WeatherError, earthquakes, femaDisasters, forecast };
})();
const m1 = (() => {
    const BASE = "https://api.weather.gov";
    const UA = "mrfentmen-weather-alerts-mcp/1.0 (https://github.com/mrfentmen)";
    class AlertError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/geo+json" }, signal: AbortSignal.timeout(25000) });
        if (!res.ok)
            throw new AlertError(`NWS error ${res.status}`);
        return (await res.json());
    }
    function fmt(f) {
        const p = f.properties ?? {};
        return `${p.event ?? ""} | ${p.severity ?? ""} (${p.areaDesc ?? ""})\n  ${(p.headline ?? "").slice(0, 250)}\n  ${(p.description ?? "").replace(/\s+/g, " ").slice(0, 400)}`;
    }
    async function activeAlerts(args) {
        const limit = Math.min(args.limit ?? 8, 20);
        const state = (args.state ?? "").trim().toUpperCase();
        const url = state ? `${BASE}/alerts/active?area=${state}` : `${BASE}/alerts/active`;
        const d = await get(url);
        const rows = (d.features ?? []).slice(0, limit);
        return `${rows.length} active alerts${state ? ` for ${state}` : ""}\n${rows.map(fmt).join("\n\n") || "None active"}`;
    }
    async function alertsForPoint(args) {
        const lat = args.lat ?? 0;
        const lon = args.lon ?? 0;
        if (!lat && !lon)
            throw new AlertError("Provide lat and lon");
        const d = await get(`${BASE}/alerts/active?point=${lat},${lon}`);
        const rows = d.features ?? [];
        return `${rows.length} active alerts near ${lat}, ${lon}\n${rows.slice(0, 8).map(fmt).join("\n\n") || "None active"}`;
    }
    return { AlertError, activeAlerts, alertsForPoint };
})();
export const AlertError = m1.AlertError;
export const WeatherError = m0.WeatherError;
export const activeAlerts = m1.activeAlerts;
export const alertsForPoint = m1.alertsForPoint;
export const earthquakes = m0.earthquakes;
export const femaDisasters = m0.femaDisasters;
export const forecast = m0.forecast;
export const m0_femaDisasters = m0.femaDisasters;
export const m0_earthquakes = m0.earthquakes;
export const m0_forecast = m0.forecast;
export const m0_WeatherError = m0.WeatherError;
export const m1_alertsForPoint = m1.alertsForPoint;
export const m1_AlertError = m1.AlertError;
export const m1_activeAlerts = m1.activeAlerts;
// ---- muxC tools:
