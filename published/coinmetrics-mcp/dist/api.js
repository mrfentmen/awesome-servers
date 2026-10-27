export class CoinmetricsError extends Error {
    constructor(message) {
        super(message);
        this.name = "CoinmetricsError";
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
        throw new CoinmetricsError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getAssetMetrics(assets, metrics, startTime, endTime, frequency) {
    let url = `https://community-api.coinmetrics.io/v4/timeseries/asset-metrics`;
    const qs = new URLSearchParams();
    qs.append("assets", String(assets));
    qs.append("metrics", String(metrics));
    if (frequency !== undefined)
        qs.append("frequency", String(frequency));
    qs.append("start_time", String(startTime));
    qs.append("end_time", String(endTime));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function listMetrics(assets) {
    let url = `https://community-api.coinmetrics.io/v4/catalog-all/asset-metrics`;
    const qs = new URLSearchParams();
    qs.append("assets", String(assets));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
// ---- muxC tools:
const CM_UA = "awesome-mcps/1.0";
class CoinmetricsLookupError extends Error {
}
// ---- gap4a1 tools:
async function cmPublic(path, params) {
    const res = await fetch(`https://community-api.coinmetrics.io/v4/${path}${params ? `?${params}` : ''}`, { headers: { 'User-Agent': CM_UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new CoinmetricsLookupError(`CoinMetrics returned HTTP ${res.status} for ${path}`);
    const data = await res.json();
    if (!Array.isArray(data.data))
        throw new CoinmetricsLookupError('CoinMetrics returned no data array');
    return data.data;
}
export async function metricDefinitions(args) {
    const rows = await cmPublic('catalog/metrics');
    const q = (args.search ?? '').trim().toLowerCase();
    const hits = rows.filter(r => !q || `${r.metric} ${r.full_name} ${r.description}`.toLowerCase().includes(q));
    const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 10), 30));
    return `Metric definitions: ${hits.length} matching.\n` + (hits.slice(0, limit).map(r => `${r.metric ?? 'not reported'}: ${(r.full_name ?? 'not reported').slice(0, 150)}\nUnit: ${r.unit ?? 'not reported'} | category: ${r.category ?? 'not reported'} | type: ${r.data_type ?? 'not reported'}\n${(r.description ?? 'not reported').slice(0, 900)}`).join('\n\n') || 'No matching definitions.');
}
export async function candlePairs(args) {
    const rows = await cmPublic('catalog/pair-candles');
    const q = (args.search ?? '').trim().toLowerCase();
    const hits = rows.filter(r => !q || (r.pair ?? '').toLowerCase().includes(q));
    const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 10), 30));
    return `Candle pairs: ${hits.length} matching.\n` + (hits.slice(0, limit).map(r => `${r.pair ?? 'not reported'}\n${(r.frequencies ?? []).slice(0, 12).map(f => `  ${f.frequency ?? 'not reported'}: ${f.min_time ?? 'not reported'} to ${f.max_time ?? 'not reported'}`).join('\n') || 'Frequencies not reported.'}`).join('\n') || 'No matching pairs.');
}
