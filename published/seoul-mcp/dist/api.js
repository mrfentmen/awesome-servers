export class SeoulError extends Error {
    constructor(message) {
        super(message);
        this.name = "SeoulError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new SeoulError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    return {};
}
function seoulBase() {
    return `http://openapi.seoul.go.kr:8088/${envStrict("SEOUL_API_KEY")}/json`;
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
        throw new SeoulError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getAirQuality() {
    let url = seoulBase() + `/RealtimeCityAir/1/25/`;
    const data = await req(url);
    return pretty(data);
}
export async function getStationAir(gu) {
    let url = seoulBase() + `/RealtimeCityAir/1/25/`;
    const data = await req(url);
    const rows = data.RealtimeCityAir?.row ?? [];
    const needle = gu.toLowerCase();
    const hits = rows.filter((r) => (r.MSRSTN_NM ?? "").toLowerCase().includes(needle));
    if (hits.length === 0)
        return `No Seoul district matches "${gu}".`;
    return pretty(hits);
}
