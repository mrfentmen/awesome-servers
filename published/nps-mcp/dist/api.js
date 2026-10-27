/**
 * National Park Service API client. Needs NPS_API_KEY
 * (free at https://www.nps.gov/subjects/developing-personal-use-api-key.htm).
 * Docs: https://www.nps.gov/subjects/api/index.htm
 */
const BASE = "https://developer.nps.gov/api/v1";
export class NpsError extends Error {
}
// api.data.gov publishes DEMO_KEY as an official shared key, so this server
// works with no setup at all.
const DEMO_KEY = "DEMO_KEY";
function apiKey() {
    const k = process.env.NPS_API_KEY;
    if (k)
        return k;
    // The live x-ratelimit-limit header on developer.nps.gov reports 10 requests
    // per hour for this shared key, so a personal key is still worth having.
    return DEMO_KEY;
}
async function getJson(path) {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${BASE}${path}${sep}api_key=${encodeURIComponent(apiKey())}`, {
        headers: { "User-Agent": "nps-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new NpsError("NPS refused (401/403). Check NPS_API_KEY.");
    if (res.status === 429) {
        throw new NpsError("NPS rate limit reached. The shared DEMO_KEY allows 10 requests per hour, set NPS_API_KEY for a personal key.");
    }
    if (!res.ok)
        throw new NpsError(`NPS error ${res.status}`);
    return (await res.json());
}
export async function searchParks(query, limit = 5) {
    if (!query.trim())
        throw new NpsError("Query is empty.");
    const data = await getJson(`/parks?q=${encodeURIComponent(query.trim())}&limit=${Math.min(Math.max(limit, 1), 50)}`);
    const rows = Array.isArray(data.data) ? data.data : [];
    return rows.slice(0, limit).map((p) => ({
        code: String(p.parkCode),
        name: p.fullName,
        states: p.states,
        designation: p.designation,
        url: p.url,
    }));
}
export async function parkAlerts(code) {
    if (!code.trim())
        throw new NpsError("Park code is empty.");
    const data = await getJson(`/alerts?parkCode=${encodeURIComponent(code.trim())}&limit=10`);
    const rows = Array.isArray(data.data) ? data.data : [];
    return rows.slice(0, 10).map((a) => `${String(a.title ?? "?")}${a.category ? ` [${a.category}]` : ""} — ${String(a.description ?? "").slice(0, 140)}`);
}
export async function parkCampgrounds(code, limit = 5) {
    if (!code.trim())
        throw new NpsError("Park code is empty.");
    const data = await getJson(`/campgrounds?parkCode=${encodeURIComponent(code.trim())}&limit=${Math.min(Math.max(limit, 1), 50)}`);
    const rows = Array.isArray(data.data) ? data.data : [];
    return rows.slice(0, limit).map((c) => {
        const fees = Array.isArray(c.fees) ? c.fees : [];
        const fee = fees[0] ? ` ($${fees[0].cost ?? "?"})` : "";
        return `${String(c.name ?? "?")}${fee}${c.description ? ` — ${String(c.description).slice(0, 120)}` : ""}`;
    });
}
export function formatPark(p, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${p.code}] ${p.name ?? "(unnamed)"}${p.designation ? ` (${p.designation})` : ""}${p.states ? ` — ${p.states}` : ""}${p.url ? `\n   ${p.url}` : ""}`;
}
// ---- The state and things-to-do premium tools moved to the licence gateway
// (src/gateway.ts); what remains here is the free NPS client.
