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
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new CoinmetricsError(`Set the ${name} environment variable.`);
    return v;
}
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
/**
 * CoinMetrics publishes a catalogue of every asset it carries, with each one's
 * metrics and the window of history available for them. Nothing else on the
 * server exposes that list, and it is the only way to know which id to ask for.
 */
export async function assetCatalog(args) {
    const q = (args.search ?? "").trim().toLowerCase();
    const limit = Math.max(1, Math.min(args.limit ?? 15, 200));
    const res = await fetch("https://community-api.coinmetrics.io/v4/catalog/assets", {
        headers: { "User-Agent": CM_UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new CoinmetricsLookupError(`CoinMetrics returned ${res.status} for the asset catalogue`);
    const d = (await res.json());
    const assets = d.data ?? [];
    if (!assets.length)
        throw new CoinmetricsLookupError("CoinMetrics returned an empty asset catalogue");
    const hits = q ? assets.filter((a) => String(a.full_name ?? "").toLowerCase().includes(q) || String(a.asset ?? "").toLowerCase().includes(q)) : assets;
    if (!hits.length)
        return `CoinMetrics has no asset matching "${q}". It carries ${assets.length}.`;
    const shown = hits.slice(0, limit);
    return [
        `CoinMetrics community catalogue: ${assets.length} assets total, ${hits.length} matching, ${shown.length} shown.`,
        ...shown.map((a, i) => {
            const metrics = a.metrics ?? [];
            const freqs = [...new Set(metrics.flatMap((m) => (m.frequencies ?? []).map((f) => f.frequency ?? "?")))].sort();
            const first = metrics[0]?.frequencies?.[0];
            const last = metrics[0]?.frequencies?.[0];
            return `${i + 1}. [${a.asset ?? "?"}] ${a.full_name ?? "unnamed"}\n   ${metrics.length} metrics | frequencies: ${freqs.join(", ") || "none listed"}\n   history for the first metric: ${first?.min_time?.slice(0, 10) ?? "?"} to ${last?.max_time?.slice(0, 10) ?? "?"}`;
        }),
    ].join("\n");
}
// ---- gap4b1 tools:
async function cmCatalog(path) {
    const res = await fetch(`https://community-api.coinmetrics.io/v4/catalog/${path}`, { headers: { "User-Agent": "awesome-mcps/1.0", Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
    if (!res.ok)
        throw new Error(`CoinMetrics returned ${res.status} for ${path}`);
    return await res.json();
}
export async function metricCatalog(args) {
    const d = await cmCatalog("metrics");
    const q = (args.search ?? "").trim().toLowerCase();
    const limit = Math.max(1, Math.min(Math.round(args.limit ?? 20), 100));
    const rows = (d.data ?? []).filter((m) => !q || `${m.metric} ${m.full_name} ${m.category}`.toLowerCase().includes(q)).slice(0, limit);
    if (!rows.length)
        return q ? `CoinMetrics has no metric matching "${q}".` : "CoinMetrics returned no metrics.";
    return [`CoinMetrics metric catalogue: ${rows.length} shown.`, ...rows.map((m, i) => `${i + 1}. ${m.metric ?? "?"} | ${m.full_name ?? "unnamed"} | ${m.unit ?? "unit not reported"}${m.category ? ` | ${m.category}` : ""}\n   ${(m.description ?? "Description not reported").slice(0, 350)}`)].join("\n");
}
export async function assetPerformance(args) {
    const assets = [...new Set((args.assets ?? "btc,eth").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))];
    if (!assets.length || assets.length > 5 || assets.some((s) => !/^[a-z0-9_]{1,50}$/.test(s)))
        throw new Error("Provide one to five comma-separated CoinMetrics asset ids.");
    const days = Math.max(1, Math.min(Math.round(args.days ?? 7), 90));
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    end.setUTCDate(end.getUTCDate() - 1);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - days);
    const query = new URLSearchParams({ assets: assets.join(","), metrics: "PriceUSD", frequency: "1d", start_time: start.toISOString(), end_time: end.toISOString(), page_size: "1000" });
    const res = await fetch(`https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?${query}`, { headers: { "User-Agent": "awesome-mcps/1.0", Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
    if (!res.ok)
        throw new Error(`CoinMetrics returned ${res.status} for daily prices`);
    const data = await res.json();
    return [`Daily USD price performance: ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}.`, ...assets.map((asset) => {
            const rows = (data.data ?? []).filter((r) => r.asset === asset && r.time && r.PriceUSD != null && r.PriceUSD !== "" && Number.isFinite(Number(r.PriceUSD))).sort((a, b) => String(a.time).localeCompare(String(b.time)));
            if (!rows.length)
                return `${asset}: price not reported.`;
            const first = rows[0], last = rows[rows.length - 1], prices = rows.map((r) => Number(r.PriceUSD));
            const change = rows.length > 1 && prices[0] !== 0 ? `${((prices[prices.length - 1] / prices[0] - 1) * 100).toFixed(2)}%` : "not reported";
            return `${asset}: ${rows.length} observations | ${first.time?.slice(0, 10)} $${prices[0].toFixed(4)} -> ${last.time?.slice(0, 10)} $${prices[prices.length - 1].toFixed(4)} | change ${change} | daily low $${Math.min(...prices).toFixed(4)}, high $${Math.max(...prices).toFixed(4)}`;
        })].join("\n");
}
export async function institutionCatalog(args) {
    const d = await cmCatalog("institutions");
    const q = (args.search ?? "").trim().toLowerCase();
    const limit = Math.max(1, Math.min(Math.round(args.limit ?? 20), 100));
    const rows = (d.data ?? []).filter((m) => !q || String(m.institution ?? "").toLowerCase().includes(q)).slice(0, limit);
    if (!rows.length)
        return q ? `CoinMetrics has no institution matching "${q}".` : "CoinMetrics returned no institutions.";
    return [`CoinMetrics institution catalogue: ${rows.length} shown.`, ...rows.map((m, i) => `${i + 1}. ${m.institution ?? "?"} | ${m.metrics?.length ?? 0} metric(s)`)].join("\n");
}
