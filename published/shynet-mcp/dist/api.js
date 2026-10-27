export class ShynetError extends Error {
    constructor(message) {
        super(message);
        this.name = "ShynetError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new ShynetError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    return { Authorization: "Token " + envStrict("SHYNET_API_TOKEN") };
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
        throw new ShynetError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getDashboard(startDate, endDate) {
    const base = envStrict("SHYNET_BASE_URL").replace(/\/$/, "");
    const qs = new URLSearchParams();
    if (startDate !== undefined)
        qs.append("startDate", startDate);
    if (endDate !== undefined)
        qs.append("endDate", endDate);
    const qstr = qs.toString();
    const data = await req(`${base}/api/v1/dashboard/${qstr ? '?' + qstr : ''}`);
    return pretty(data);
}
export async function getServiceStats(uuid, startDate, endDate) {
    const base = envStrict("SHYNET_BASE_URL").replace(/\/$/, "");
    const qs = new URLSearchParams();
    qs.append("uuid", uuid);
    if (startDate !== undefined)
        qs.append("startDate", startDate);
    if (endDate !== undefined)
        qs.append("endDate", endDate);
    const qstr = qs.toString();
    const data = await req(`${base}/api/v1/dashboard/${qstr ? '?' + qstr : ''}`);
    return pretty(data);
}
