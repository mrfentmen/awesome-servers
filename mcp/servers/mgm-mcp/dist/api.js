export class MgmError extends Error {
    constructor(message) {
        super(message);
        this.name = "MgmError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
async function authHeaders() {
    return { Origin: "https://www.mgm.gov.tr" };
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
        throw new MgmError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function listProvinces() {
    let url = `https://servis.mgm.gov.tr/web/merkezler/iller`;
    const data = await req(url);
    return pretty(data);
}
export async function listDistricts(il) {
    let url = `https://servis.mgm.gov.tr/web/merkezler/ililcesi`;
    const qs = new URLSearchParams();
    qs.append("il", String(il));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getDaily(istno) {
    let url = `https://servis.mgm.gov.tr/web/tahminler/gunluk`;
    const qs = new URLSearchParams();
    qs.append("istno", String(istno));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getHourly(istno) {
    let url = `https://servis.mgm.gov.tr/web/tahminler/saatlik`;
    const qs = new URLSearchParams();
    qs.append("istno", String(istno));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
