export class KucoinError extends Error {
    constructor(message) {
        super(message);
        this.name = "KucoinError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new KucoinError(`Set the ${name} environment variable.`);
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
        throw new KucoinError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getServerTime() {
    let url = `https://api.kucoin.com/api/v1/timestamp`;
    const data = await req(url);
    return pretty(data);
}
export async function listSymbols(market) {
    let url = `https://api.kucoin.com/api/v1/symbols`;
    const data0 = await req(url);
    if (market) {
        const arr = Array.isArray(data0.data) ? data0.data : [];
        return pretty(arr.filter((x) => x.quoteCurrency === market).slice(0, 50));
    }
    return pretty(data0);
}
export async function get24hStats(symbol) {
    let url = `https://api.kucoin.com/api/v1/market/stats`;
    const qs = new URLSearchParams();
    qs.append("symbol", String(symbol));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getOrderbook(symbol) {
    let url = `https://api.kucoin.com/api/v1/market/orderbook/level2_20`;
    const qs = new URLSearchParams();
    qs.append("symbol", String(symbol));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getKlines(symbol, type, startAt, endAt) {
    let url = `https://api.kucoin.com/api/v1/market/candles`;
    const qs = new URLSearchParams();
    qs.append("symbol", String(symbol));
    if (type !== undefined)
        qs.append("type", String(type));
    if (startAt !== undefined)
        qs.append("startAt", String(startAt));
    if (endAt !== undefined)
        qs.append("endAt", String(endAt));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getFiatPrices(currencies, base) {
    let url = `https://api.kucoin.com/api/v1/prices`;
    const qs = new URLSearchParams();
    if (base !== undefined)
        qs.append("base", String(base));
    if (currencies !== undefined)
        qs.append("currencies", String(currencies));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
