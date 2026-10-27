export class WeatherbitError extends Error {
    constructor(message) {
        super(message);
        this.name = "WeatherbitError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new WeatherbitError(`Set the ${name} environment variable.`);
    return v;
}
function apiKey() {
    return envStrict("WEATHERBIT_API_KEY");
}
async function authHeaders() {
    return {};
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(url, init = {}) {
    const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new WeatherbitError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getCurrent(lat, lon) {
    const key = apiKey();
    let url = `https://api.weatherbit.io/v2.0/current`;
    const qs = new URLSearchParams();
    qs.append("lat", String(lat));
    qs.append("lon", String(lon));
    qs.append("key", key);
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getDailyForecast(lat, lon, days) {
    const key = apiKey();
    let url = `https://api.weatherbit.io/v2.0/forecast/daily`;
    const qs = new URLSearchParams();
    qs.append("lat", String(lat));
    qs.append("lon", String(lon));
    if (days !== undefined)
        qs.append("days", String(days));
    qs.append("key", key);
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getHourlyForecast(lat, lon, hours) {
    const key = apiKey();
    let url = `https://api.weatherbit.io/v2.0/forecast/hourly`;
    const qs = new URLSearchParams();
    qs.append("lat", String(lat));
    qs.append("lon", String(lon));
    if (hours !== undefined)
        qs.append("hours", String(hours));
    qs.append("key", key);
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getAlerts(lat, lon) {
    const key = apiKey();
    let url = `https://api.weatherbit.io/v2.0/alerts`;
    const qs = new URLSearchParams();
    qs.append("lat", String(lat));
    qs.append("lon", String(lon));
    qs.append("key", key);
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getAirQuality(lat, lon) {
    const key = apiKey();
    let url = `https://api.weatherbit.io/v2.0/current/airquality`;
    const qs = new URLSearchParams();
    qs.append("lat", String(lat));
    qs.append("lon", String(lon));
    qs.append("key", key);
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
