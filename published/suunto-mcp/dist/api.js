export class SuuntoError extends Error {
    constructor(message) {
        super(message);
        this.name = "SuuntoError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new SuuntoError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    return { Authorization: envStrict("SUUNTO_ACCESS_TOKEN"), "Ocp-Apim-Subscription-Key": envStrict("SUUNTO_SUBSCRIPTION_KEY") };
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
        throw new SuuntoError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function listWorkouts(limit, offset) {
    let url = `https://cloudapi.suunto.com/v2/workouts`;
    const qs = new URLSearchParams();
    if (limit !== undefined)
        qs.append("limit", String(limit));
    if (offset !== undefined)
        qs.append("offset", String(offset));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getWorkout(workoutId) {
    let url = `https://cloudapi.suunto.com/v2/workouts/${encodeURIComponent(String(workoutId))}`;
    const data = await req(url);
    return pretty(data);
}
