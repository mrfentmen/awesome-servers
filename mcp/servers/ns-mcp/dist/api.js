export class NsError extends Error {
    constructor(message) {
        super(message);
        this.name = "NsError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://gateway.apiportal.ns.nl/reisinformatie-api";
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new NsError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    const __NS_API_KEY = envStrict("NS_API_KEY");
    return { "Ocp-Apim-Subscription-Key": __NS_API_KEY };
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
        throw new NsError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getDepartures(station, maxJourneys) {
    let url = BASE + `/api/v2/departures`;
    const qs = new URLSearchParams();
    qs.append("station", String(station));
    if (maxJourneys !== undefined)
        qs.append("maxJourneys", String(maxJourneys));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function searchStations(query) {
    let url = BASE + `/api/v2/stations`;
    const data = await req(url);
    const needle = query.toLowerCase();
    const hits = (data.payload ?? []).filter((st) => `${st.code ?? ""} ${st.namen?.middel ?? ""}`.toLowerCase().includes(needle)).slice(0, 15);
    if (hits.length === 0)
        return `No NS stations match "${query}".`;
    return pretty(hits);
}
export async function planJourney(fromStation, toStation, dateTime) {
    let url = BASE + `/api/v2/journey`;
    const qs = new URLSearchParams();
    qs.append("fromStation", String(fromStation));
    qs.append("toStation", String(toStation));
    if (dateTime !== undefined)
        qs.append("dateTime", String(dateTime));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getDisruptions(isActive) {
    let url = BASE + `/api/v2/disruptions`;
    const qs = new URLSearchParams();
    if (isActive !== undefined)
        qs.append("isActive", String(isActive));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getFares(fromStation, toStation) {
    let url = BASE + `/api/v2/fares`;
    const qs = new URLSearchParams();
    qs.append("fromStation", String(fromStation));
    qs.append("toStation", String(toStation));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
// ---- muxF tools:
const NS_OVERPASS = "https://overpass-api.de/api/interpreter";
