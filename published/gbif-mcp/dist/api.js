const BASE = "https://api.gbif.org/v1";
const H = { "User-Agent": "mrfentmen-gbif-mcp/1.0" };
export class GbifError extends Error {
}
async function get(path, params = {}) { const u = new URL(`${BASE}/${path}`); Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v)); const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(20000) }); if (!r.ok)
    throw new GbifError(`GBIF error ${r.status}`); return r.json(); }
export function match(name) { return get("species/match", { name }); }
export function species(key) { return get(`species/${encodeURIComponent(key)}`); }
export function occurrences(params) { return get("occurrence/search", { limit: "20", ...params }); }
export function format(data) { return JSON.stringify(data, null, 2).slice(0, 14000); }
