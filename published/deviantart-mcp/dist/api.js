export class DeviantartError extends Error {
    constructor(message) {
        super(message);
        this.name = "DeviantartError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new DeviantartError(`Set the ${name} environment variable.`);
    return v;
}
let cachedToken = "";
async function authHeaders() {
    if (!cachedToken) {
        const res = await fetch("https://www.deviantart.com/oauth2/token", {
            method: "POST",
            headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ grant_type: "client_credentials", client_id: envStrict("DEVIANTART_CLIENT_ID"), client_secret: envStrict("DEVIANTART_CLIENT_SECRET") }).toString(),
        });
        if (!res.ok)
            throw new DeviantartError(`DeviantArt login failed: HTTP ${res.status}`);
        let data;
        try {
            data = (await res.json());
        }
        catch {
            throw new DeviantartError(`DeviantArt login failed: HTTP ${res.status} (non-JSON response)`);
        }
        if (!data.access_token)
            throw new DeviantartError("DeviantArt login returned no token");
        cachedToken = data.access_token;
    }
    return { Authorization: "Bearer " + cachedToken };
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
        throw new DeviantartError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function browseHot() {
    let url = `https://www.deviantart.com/api/v1/oauth2/browse/hot`;
    const data = await req(url);
    return pretty(data);
}
export async function browseNewest() {
    let url = `https://www.deviantart.com/api/v1/oauth2/browse/newest`;
    const data = await req(url);
    return pretty(data);
}
export async function searchTags(tag) {
    let url = `https://www.deviantart.com/api/v1/oauth2/browse/tags`;
    const qs = new URLSearchParams();
    qs.append("tag", String(tag));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getDeviation(deviationIds) {
    let url = `https://www.deviantart.com/api/v1/oauth2/deviation/metadata`;
    const qs = new URLSearchParams();
    qs.append("deviationids", String(deviationIds));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
