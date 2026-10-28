const BASE = "https://services.swpc.noaa.gov/products";
const headers = { "User-Agent": "mrfentmen-space-weather-mcp/1.0 (https://github.com/mrfentmen)" };
export class SpaceWeatherError extends Error {
}
async function request(path) { const res = await fetch(`${BASE}${path}`, { headers, signal: AbortSignal.timeout(20000) }); if (!res.ok)
    throw new SpaceWeatherError(`NOAA SWPC error ${res.status}`); return (await res.json()); }
export function solarWindSpeed() { return request(`/summary/solar-wind-speed.json`); }
export function scales() { return request(`/noaa-scales.json`); }
export function alerts() { return request(`/alerts.json`); }
export function formatSpeed(rows) { return rows.slice(-20).map((x) => `${x.time_tag ?? "unknown time"}: ${x.proton_speed ?? "unknown"} km/s`).join("\n"); }
export function formatScales(data) { return Object.entries(data).map(([key, x]) => `${key}: ${x.DateStamp ?? ""} ${x.TimeStamp ?? ""} | Radio R${x.R?.Scale ?? "?"} ${x.R?.Text ?? ""} | Solar S${x.S?.Scale ?? "?"} ${x.S?.Text ?? ""} | Geomagnetic G${x.G?.Scale ?? "?"} ${x.G?.Text ?? ""}`).join("\n"); }
export function formatAlerts(rows) { return rows.slice(0, 12).map((x) => `${x.issue_datetime ?? "unknown time"} ${x.product_id ?? "alert"}\n${(x.message ?? "").slice(0, 700)}`).join("\n\n"); }
