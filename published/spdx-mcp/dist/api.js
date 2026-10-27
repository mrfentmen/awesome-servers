const URL = "https://spdx.org/licenses/licenses.json";
export class SpdxError extends Error {
}
let cache = null;
export async function licenses() { if (cache)
    return cache; const r = await fetch(URL, { signal: AbortSignal.timeout(20000) }); if (!r.ok)
    throw new SpdxError(`SPDX error ${r.status}`); const data = await r.json(); cache = data.licenses ?? []; return cache; }
export async function find(query) { const q = query.toLowerCase(); return (await licenses()).filter((x) => `${x.licenseId} ${x.name}`.toLowerCase().includes(q)).slice(0, 20); }
export async function get(id) { return (await licenses()).find((x) => x.licenseId?.toLowerCase() === id.toLowerCase()) ?? null; }
export function format(rows) { return JSON.stringify(rows, null, 2).slice(0, 10000); }
let exceptionCache = null;
