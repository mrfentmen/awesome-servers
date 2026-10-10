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
/**
 * The day-ahead dataset has a different shape from every other Energinet feed:
 * one row per price zone per hour. The generic dataset tool dumps it as JSON,
 * which makes it hard to answer the only question anyone has, which is where
 * power is cheap right now.
 */
export async function dayAheadPrices(args) {
    const hours = Math.max(1, Math.min(args.hours ?? 12, 48));
    const data = (await req(`https://api.energidataservice.dk/dataset/DayAheadPrices?limit=200`));
    const records = data?.records ?? [];
    if (!records.length)
        throw new EnerginetError("Energinet returned no day-ahead price rows");
    const zone = (args.zone ?? "").trim().toUpperCase();
    const zones = [...new Set(records.map((r) => r.PriceArea ?? "?"))].sort();
    const wanted = zone ? records.filter((r) => (r.PriceArea ?? "").toUpperCase() === zone) : records;
    if (zone && !wanted.length) {
        throw new EnerginetError(`Energinet has no price area "${zone}". Available: ${zones.join(", ")}`);
    }
    const cheapest = [...wanted].sort((a, b) => (a.DayAheadPriceEUR ?? Infinity) - (b.DayAheadPriceEUR ?? Infinity))[0];
    const dearest = [...wanted].sort((a, b) => (b.DayAheadPriceEUR ?? -Infinity) - (a.DayAheadPriceEUR ?? -Infinity))[0];
    const byHour = new Map();
    for (const r of wanted) {
        const key = String(r.TimeDK ?? r.TimeUTC ?? "?").slice(0, 13);
        const list = byHour.get(key) ?? [];
        list.push(r);
        byHour.set(key, list);
    }
    const lines = [];
    for (const [hour, list] of [...byHour.entries()].sort()) {
        const detail = list
            .sort((a, b) => (a.DayAheadPriceEUR ?? 0) - (b.DayAheadPriceEUR ?? 0))
            .map((r) => `${r.PriceArea ?? "?"} ${r.DayAheadPriceEUR != null ? `${r.DayAheadPriceEUR.toFixed(2)} EUR` : "not reported"}`)
            .join(" | ");
        lines.push(`  ${hour}:00 DK  ${detail}`);
        if (lines.length >= hours)
            break;
    }
    return [
        `Energinet day-ahead electricity prices (${wanted.length} rows, ${zone || "all zones"}, first ${lines.length} hours)`,
        `Price areas: ${zones.join(", ")}`,
        `Cheapest row in this set: ${cheapest?.PriceArea ?? "?"} at ${cheapest?.DayAheadPriceEUR != null ? `${cheapest.DayAheadPriceEUR.toFixed(2)} EUR` : "not reported"} (${String(cheapest?.TimeDK ?? "").slice(0, 16)})`,
        `Most expensive row: ${dearest?.PriceArea ?? "?"} at ${dearest?.DayAheadPriceEUR != null ? `${dearest.DayAheadPriceEUR.toFixed(2)} EUR` : "not reported"} (${String(dearest?.TimeDK ?? "").slice(0, 16)})`,
        ...lines,
    ].join("\n");
}
async function energyRows(dataset, limit) {
    const res = await fetch(`https://api.energidataservice.dk/dataset/${dataset}?limit=${limit}&sort=Minutes5UTC%20DESC`, {
        headers: { 'User-Agent': 'mrfentmen-energinet-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new EnerginetError(`Energinet returned ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.records) || !data.records.length)
        throw new EnerginetError('Energinet returned no records.');
    return data.records;
}
function energyValue(row, field) {
    const value = row[field];
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
export async function carbonTrend(args) {
    const samples = Math.max(2, Math.min(Math.trunc(args.samples ?? 12), 144));
    const rows = await energyRows('CO2Emis', samples * 2);
    const areas = [...new Set(rows.map(r => String(r.PriceArea ?? 'not reported')))].slice(0, 10);
    return `CO2 intensity trend, up to ${samples} five-minute observations per area (g/kWh):\n` + areas.map(area => {
        const observed = rows.filter(r => r.PriceArea === area && energyValue(r, 'CO2Emission') !== undefined).slice(0, samples);
        if (!observed.length)
            return `${area}: not reported`;
        const values = observed.map(r => energyValue(r, 'CO2Emission'));
        const first = values[values.length - 1], last = values[0];
        return `${area}: ${observed[observed.length - 1].Minutes5UTC} to ${observed[0].Minutes5UTC} UTC\n  ${values.length} observations | oldest ${first.toFixed(1)}, latest ${last.toFixed(1)}, change ${(last - first).toFixed(1)}\n  min ${Math.min(...values).toFixed(1)}, max ${Math.max(...values).toFixed(1)}, mean ${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)}`;
    }).join('\n');
}
export async function generationMix(_args) {
    const rows = await energyRows('ElectricityProdex5MinRealtime', 2);
    const fields = ['ProductionLt100MW', 'ProductionGe100MW', 'OffshoreWindPower', 'OnshoreWindPower', 'SolarPower'];
    return 'Generation mix from latest reported area rows (MW):\n' + rows.slice(0, 2).map(r => {
        const values = fields.map(k => energyValue(r, k));
        const complete = values.every(v => v !== undefined);
        const total = complete ? values.reduce((a, b) => a + b, 0) : undefined;
        const renewable = complete ? values[2] + values[3] + values[4] : undefined;
        return `${r.PriceArea ?? 'not reported'} at ${r.Minutes5UTC ?? 'not reported'} UTC\n  ${fields.map((k, i) => `${k}: ${values[i]?.toFixed(2) ?? 'not reported'}`).join(' | ')}\n  Total across five categories: ${total?.toFixed(2) ?? 'not reported'} MW\n  Wind and solar share: ${total !== undefined && total > 0 ? `${(100 * renewable / total).toFixed(1)}%` : 'not reported'}`;
    }).join('\n');
}
export async function exchangeBalance(_args) {
    const rows = await energyRows('ElectricityProdex5MinRealtime', 2);
    const external = ['ExchangeGermany', 'ExchangeNetherlands', 'ExchangeGreatBritain', 'ExchangeNorway', 'ExchangeSweden', 'BornholmSE4'];
    return 'Cross-border exchange balance (MW; signs preserved as published by Energinet):\n' + rows.slice(0, 2).map(r => {
        const known = external.flatMap(k => { const value = energyValue(r, k); return value === undefined ? [] : [{ field: k, value }]; });
        const positive = known.reduce((sum, v) => sum + Math.max(0, v.value), 0);
        const negative = known.reduce((sum, v) => sum + Math.min(0, v.value), 0);
        return `${r.PriceArea ?? 'not reported'} at ${r.Minutes5UTC ?? 'not reported'} UTC\n  ${external.map(k => `${k}: ${energyValue(r, k)?.toFixed(2) ?? 'not reported'}`).join(' | ')}\n  Reported external connections: ${known.length}/${external.length}; positive sum ${positive.toFixed(2)}, negative sum ${negative.toFixed(2)}, net ${(positive + negative).toFixed(2)} MW\n  Great Belt (internal, excluded from external sum): ${energyValue(r, 'ExchangeGreatBelt')?.toFixed(2) ?? 'not reported'} MW\n  Null connections are excluded; the sum covers reported connections only.`;
    }).join('\n');
}
