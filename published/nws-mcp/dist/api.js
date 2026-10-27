/**
 * National Weather Service client. Keyless (a User-Agent is required by NWS).
 * Forecasts, hourly forecasts, active alerts, station observations.
 */
const BASE = "https://api.weather.gov";
const UA = "nws-mcp/1.0 (awesome-servers)";
export class NwsError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/geo+json" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new NwsError(`NWS error ${res.status} for ${url}`);
    return (await res.json());
}
export async function points(lat, lon) {
    return (await get(`${BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`)).properties ?? {};
}
export async function forecast(lat, lon) {
    const p = await points(lat, lon);
    if (!p.forecast)
        throw new NwsError("no forecast grid for that point");
    return (await get(p.forecast)).properties?.periods ?? [];
}
export async function hourly(lat, lon) {
    const p = await points(lat, lon);
    if (!p.forecastHourly)
        throw new NwsError("no hourly forecast for that point");
    return (await get(p.forecastHourly)).properties?.periods ?? [];
}
export async function alerts(area) {
    const url = area
        ? `${BASE}/alerts/active?area=${encodeURIComponent(area.toUpperCase())}`
        : `${BASE}/alerts/active`;
    return (await get(url)).features ?? [];
}
export async function stations(lat, lon) {
    const p = await points(lat, lon);
    if (!p.observationStations)
        throw new NwsError("no observation stations for that point");
    return (await get(p.observationStations)).features ?? [];
}
export async function observation(station) {
    const body = await get(`${BASE}/stations/${encodeURIComponent(station)}/observations/latest`);
    const p = body.properties ?? {};
    const tempUnit = p.temperature?.unitCode ?? "";
    const c = (v) => {
        if (v === undefined)
            return "?";
        if (tempUnit.includes("degF"))
            return `${((v - 32) * 5) / 9} C`;
        if (tempUnit.includes("degC"))
            return `${v.toFixed(1)} C`;
        return `${(v - 273.15).toFixed(1)} C`;
    };
    const humidity = p.relativeHumidity?.value;
    const pressure = p.barometricPressure?.value;
    return [
        `station ${station.toUpperCase()} at ${p.timestamp ?? "?"}`,
        `conditions: ${p.textDescription ?? "unknown"}`,
        `temperature: ${c(p.temperature?.value)}`,
        `humidity: ${humidity === undefined ? "?" : humidity.toFixed(0)}%`,
        `wind: ${p.windSpeed?.value ?? "?"} m/s`,
        `pressure: ${pressure === undefined ? "?" : (pressure / 100).toFixed(1)} hPa`,
    ].join("\n");
}
export function periodText(p) {
    const label = p.name || p.startTime || "period";
    const detail = p.detailedForecast ? `\n  ${p.detailedForecast}` : "";
    return `${label}${p.isDaytime === false ? " (night)" : ""}: ${p.temperature}${p.temperatureUnit} — ${p.shortForecast} — wind ${p.windSpeed} ${p.windDirection}${detail}`;
}
export function alertText(a) {
    const p = a.properties ?? {};
    return `${p.event} [${p.severity ?? "?"}/${p.urgency ?? "?"}] ${p.areaDesc ?? ""}\n  ${p.headline ?? ""}\n  ${p.effective ?? ""} → ${p.expires ?? ""} (${p.senderName ?? ""})`;
}
