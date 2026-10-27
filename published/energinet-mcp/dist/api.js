export class EnerginetError extends Error {
    constructor(message) {
        super(message);
        this.name = "EnerginetError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
async function authHeaders() {
    return {};
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
        throw new EnerginetError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getPowerNow(limit) {
    let url = `https://api.energidataservice.dk/dataset/PowerSystemRightNow`;
    const qs = new URLSearchParams();
    if (limit !== undefined)
        qs.append("limit", String(limit));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getDataset(dataset, limit) {
    let url = `https://api.energidataservice.dk/dataset/${encodeURIComponent(String(dataset))}`;
    const qs = new URLSearchParams();
    if (limit !== undefined)
        qs.append("limit", String(limit));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
// ---- muxC tools:
// ---- gap4a1 tools:
async function energyPublic(path) {
    const res = await fetch(`https://api.energidataservice.dk/${path}`, { headers: { ...UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new EnerginetError(`Energinet returned HTTP ${res.status}`);
    return await res.json();
}
export async function datasetCatalog(args) {
    const rows = await energyPublic('meta/dataset');
    const q = (args.search ?? '').trim().toLowerCase();
    const hits = rows.filter(r => !q || `${r.datasetName} ${r.title} ${r.description}`.toLowerCase().includes(q));
    const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 10), 30));
    return `Energinet datasets: ${hits.length} matching.\n` + (hits.slice(0, limit).map(r => `${r.datasetName ?? 'not reported'}: ${(r.title ?? 'not reported').slice(0, 200)}\n${(r.description ?? 'not reported').slice(0, 600)}\nLast data update: ${r.lastDataUpdate ?? 'not reported'} | active flag: ${r.active ?? 'not reported'}`).join('\n\n') || 'No matching datasets.');
}
export async function datasetSchema(args) {
    if (!/^[A-Za-z0-9_]{1,100}$/.test(args.dataset))
        throw new EnerginetError('Provide a dataset identifier from dataset_catalog.');
    const d = await energyPublic(`meta/dataset/${encodeURIComponent(args.dataset)}`);
    const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 20), 60));
    return [
        `${args.dataset}: ${(d.title ?? 'not reported').slice(0, 200)}`,
        (d.description ?? 'not reported').slice(0, 1000),
        `Update frequency: ${d.updateFrequency ?? 'not reported'} | resolution: ${d.resolution ?? 'not reported'}`,
        `Columns (${d.columns?.length ?? 'not reported'} total):`,
        ...(d.columns ?? []).slice(0, limit).map(c => `${c.dbColumn ?? 'not reported'} | ${c.dataType ?? 'not reported'} | unit: ${c.unit || 'not reported'}\n${(c.description ?? 'not reported').slice(0, 400)}`),
    ].join('\n');
}
