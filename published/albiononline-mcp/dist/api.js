export class AlbiononlineError extends Error {
    constructor(message) {
        super(message);
        this.name = "AlbiononlineError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
function stripHtml(html) {
    return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
async function req(url, init = {}) {
    const res = await fetch(url, { headers: { ...UA, ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new AlbiononlineError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getPrices(item, locations, qualities) {
    let url = `https://albion-online-data.com/api/v2/stats/prices/${encodeURIComponent(String(item))}`;
    const qs = new URLSearchParams();
    if (locations !== undefined)
        qs.append("locations", String(locations));
    if (qualities !== undefined)
        qs.append("qualities", String(qualities));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getPriceHistory(item, date, end_date, timeScale) {
    let url = `https://albion-online-data.com/api/v2/stats/history/${encodeURIComponent(String(item))}`;
    const qs = new URLSearchParams();
    if (date !== undefined)
        qs.append("date", String(date));
    if (end_date !== undefined)
        qs.append("end_date", String(end_date));
    if (timeScale !== undefined)
        qs.append("time-scale", String(timeScale));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getPriceCharts(item, date, end_date, timeScale) {
    let url = `https://albion-online-data.com/api/v2/stats/charts/${encodeURIComponent(String(item))}`;
    const qs = new URLSearchParams();
    if (date !== undefined)
        qs.append("date", String(date));
    if (end_date !== undefined)
        qs.append("end_date", String(end_date));
    if (timeScale !== undefined)
        qs.append("time-scale", String(timeScale));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getGoldPrices(date, count) {
    let url = `https://albion-online-data.com/api/v2/stats/gold`;
    const qs = new URLSearchParams();
    if (date !== undefined)
        qs.append("date", String(date));
    if (count !== undefined)
        qs.append("count", String(count));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getRecentKills(limit, offset) {
    let url = `https://gameinfo.albiononline.com/api/gameinfo/events`;
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
export async function getKillDetails(eventId) {
    let url = `https://gameinfo.albiononline.com/api/gameinfo/events/${encodeURIComponent(String(eventId))}`;
    const data = await req(url);
    return pretty(data);
}
// ---- muxB tools:
// Cross-city comparison and trend statistics over the albion-online-data.com
// payloads the existing tools dump as raw JSON.
const AOD_BASE = "https://albion-online-data.com/api/v2/stats";
async function aod(path) {
    const res = await fetch(`${AOD_BASE}${path}`, {
        headers: { ...UA, Accept: "application/json", "Accept-Encoding": "gzip, deflate" },
        signal: AbortSignal.timeout(25000),
    });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.replace(/\s+/g, " ").slice(0, 200) : JSON.stringify(data).slice(0, 200);
        throw new AlbiononlineError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
// albion-online-data.com emits placeholder rows with a 0 price and the
// 0001-01-01T00:00:00 sentinel date for city/quality pairs with no orders.
const live = (row, field, dateField) => {
    const price = num(row?.[field]);
    if (price == null || price <= 0)
        return null;
    const when = typeof row?.[dateField] === "string" ? row[dateField] : "";
    if (!when || when.startsWith("0001-"))
        return null;
    return { city: String(row?.city ?? "?"), quality: Number(row?.quality), price, when };
};
export async function priceTrend(args) {
    const item = String(args.item ?? "").trim();
    if (!item)
        return "Provide an item id, e.g. T4_BAG.";
    const timeScale = String(args.timeScale ?? "1d").trim();
    if (!["1h", "1d", "1w"].includes(timeScale))
        return 'timeScale must be "1h", "1d" or "1w".';
    const quality = args.quality == null ? null : Number(args.quality);
    if (quality != null && (!Number.isInteger(quality) || quality < 1 || quality > 5)) {
        return "Quality must be a whole number from 1 to 5.";
    }
    const days = Math.max(1, Math.min(Number(args.days ?? 30) || 30, 365));
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);
    const iso = (d) => d.toISOString().slice(0, 10);
    const series = (await aod(`/history/${encodeURIComponent(item)}?date=${iso(start)}&end_date=${iso(end)}&time-scale=${timeScale}`)) ?? [];
    let picked = series;
    const location = (args.location ?? "").trim();
    if (location)
        picked = series.filter((r) => String(r?.location ?? "").toLowerCase() === location.toLowerCase());
    if (quality != null)
        picked = picked.filter((r) => Number(r?.quality) === quality);
    const blocks = picked
        .map((r) => ({ location: String(r?.location ?? "?"), quality: Number(r?.quality), points: (r?.data ?? []) }))
        .filter((b) => b.points.length > 0);
    if (!blocks.length) {
        return `No history rows for ${item}${location ? ` in ${location}` : ""}${quality != null ? ` at quality ${quality}` : ""} over the last ${days} day(s).`;
    }
    const lines = [`Price trend for ${item}, ${timeScale} buckets, ${iso(start)} to ${iso(end)}:`, ""];
    for (const b of blocks.slice(0, 12)) {
        const points = [...b.points]
            .map((p) => ({ price: num(p?.avg_price), when: String(p?.timestamp ?? ""), count: num(p?.item_count) ?? 0 }))
            .filter((p) => p.price != null)
            .sort((a, z) => a.when.localeCompare(z.when));
        if (!points.length)
            continue;
        const prices = points.map((p) => p.price);
        const low = Math.min(...prices);
        const high = Math.max(...prices);
        const lowAt = points.find((p) => p.price === low);
        const highAt = points.find((p) => p.price === high);
        const weighted = points.reduce((acc, p) => acc + p.price * p.count, 0);
        const volume = points.reduce((acc, p) => acc + p.count, 0);
        const change = points[0].price - points[points.length - 1].price;
        lines.push(`* ${b.location}, quality ${b.quality}: ${points.length} bucket(s) from ${points[0].when.slice(0, 16).replace("T", " ")} to ${points[points.length - 1].when.slice(0, 16).replace("T", " ")}`);
        lines.push(`    low ${low.toLocaleString("en-US")} at ${lowAt.when.slice(0, 10)}, high ${high.toLocaleString("en-US")} at ${highAt.when.slice(0, 10)}, range ${((high / low) * 100 - 100).toFixed(1)}%`);
        lines.push(`    volume-weighted mean ${volume ? Math.round(weighted / volume).toLocaleString("en-US") : "not reported"} over ${volume.toLocaleString("en-US")} item(s) traded; ` +
            `end-to-end ${change === 0 ? "unchanged" : `${change > 0 ? "up" : "down"} ${Math.abs(change).toLocaleString("en-US")} (${((change / points[0].price) * 100).toFixed(1)}%)`}`);
    }
    if (blocks.length > 12)
        lines.push(`... and ${blocks.length - 12} more location/quality series.`);
    return lines.join("\n");
}

const ALBION = 'https://west.albion-online-data.com/api/v2/stats/prices';
const CITIES = ['Caerleon', 'Bridgewatch', 'Martlock', 'Thetford', 'Fort Sterling', 'Lymhurst', 'Brecilien', 'Black Market'];
export async function marketSummary(args = {}) {
    const item = String(args?.item ?? '').trim().toUpperCase();
    if (!/^T[1-8]_[A-Z0-9_]+$/.test(item))
        throw new Error('Item id looks like T4_BAG or T6_MAIN_SWORD.');
    const quality = Number(args?.quality);
    if (args?.quality !== undefined && (!Number.isInteger(quality) || quality < 1 || quality > 5))
        throw new Error('Quality must be a whole number from 1 to 5.');
    const qs = new URLSearchParams({ locations: CITIES.join(',') });
    if (args?.quality !== undefined)
        qs.set('qualities', String(quality));
    const res = await fetch(`${ALBION}/${encodeURIComponent(item)}.json?${qs}`, {
        headers: { 'User-Agent': 'mrfentmen-albiononline-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Albion data API returned ${res.status}`);
    const rows = (await res.json());
    if (!Array.isArray(rows) || !rows.length)
        throw new Error(`No market rows for ${item}`);
    const sells = rows.filter((r) => Number(r.sell_price_min) > 0)
        .sort((a, b) => a.sell_price_min - b.sell_price_min);
    const buys = rows.filter((r) => Number(r.buy_price_max) > 0)
        .sort((a, b) => b.buy_price_max - a.buy_price_max);
    if (!sells.length && !buys.length)
        return `${item}: every queried city reports no sell or buy orders right now.`;
    const cheapest = sells[0];
    const best = buys[0];
    const spread = cheapest && best ? best.buy_price_max - cheapest.sell_price_min : null;
    return [
        `${item}${args?.quality ? ` quality ${args.quality}` : ''} — ${rows.length} city row(s)`,
        cheapest ? `Cheapest sell order: ${cheapest.sell_price_min} in ${cheapest.city} (${String(cheapest.sell_price_min_date).slice(0, 16)})` : 'Cheapest sell order: none listed',
        best ? `Best buy order: ${best.buy_price_max} in ${best.city} (${String(best.buy_price_max_date).slice(0, 16)})` : 'Best buy order: none listed',
        spread === null ? '' : `Gross spread between the two extremes: ${spread}`,
        '',
        ...rows.map((r) => `${r.city}${args?.quality ? '' : ` q${r.quality}`}: sells from ${r.sell_price_min || '—'} · buys up to ${r.buy_price_max || '—'}`),
        '',
        'Prices come from the community Albion data feed and lag the live market.',
    ].filter((l) => l !== '').join('\n');
}
