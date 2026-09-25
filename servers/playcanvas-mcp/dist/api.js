export class PlayCanvasError extends Error {
    constructor(message) {
        super(message);
        this.name = "PlayCanvasError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://playcanvas.com/api";
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new PlayCanvasError(`Set the ${name} environment variable.`);
    return v;
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(path) {
    const res = await fetch(BASE + path, {
        headers: { ...UA, Authorization: "Bearer " + envStrict("PLAYCANVAS_ACCESS_TOKEN") },
    });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new PlayCanvasError(`HTTP ${res.status}: ${detail}`);
    }
    return pretty(data);
}
export function listProjectAssets(projectId, branchId, limit) {
    const p = new URLSearchParams({ branchId });
    if (limit)
        p.set("limit", limit);
    return req(`/projects/${encodeURIComponent(projectId)}/assets?${p.toString()}`);
}
export function getAsset(assetId, branchId) {
    return req(`/assets/${encodeURIComponent(assetId)}?branchId=${encodeURIComponent(branchId)}`);
}
export function getRateLimits() {
    return req("/ratelimits");
}
