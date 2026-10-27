export class AlpacaError extends Error {
    constructor(message) {
        super(message);
        this.name = "AlpacaError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function base() {
    return (process.env.ALPACA_BASE_URL ?? "https://paper-api.alpaca.markets").replace(/\/$/, "");
}
function headers() {
    const id = process.env.ALPACA_API_KEY_ID;
    const secret = process.env.ALPACA_API_SECRET_KEY;
    if (!id || !secret)
        throw new AlpacaError("Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY (Alpaca paper).");
    return { ...UA, Accept: "application/json", "APCA-API-KEY-ID": id, "APCA-API-SECRET-KEY": secret };
}
async function get(path) {
    let res;
    try {
        res = await fetch(base() + path, {
            headers: headers(),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new AlpacaError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new AlpacaError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function account() {
    return get("/v2/account");
}
export function positions() {
    return get("/v2/positions");
}
export function orders(limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    return get(`/v2/orders?limit=${n}&direction=desc`);
}
export function orderDetails(orderId) {
    return get(`/v2/orders/${encodeURIComponent(orderId)}`);
}
export function positionDetails(symbol) {
    return get(`/v2/positions/${encodeURIComponent(symbol.toUpperCase())}`);
}
export function marketClock() {
    return get("/v2/clock");
}
export function calendar(start, end) {
    const q = start && end ? `?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}` : "";
    return get(`/v2/calendar${q}`);
}
export function listAssets(status) {
    return get(`/v2/assets?status=${encodeURIComponent(status ?? "active")}&asset_class=us_equity`).then((t) => t.slice(0, 8000));
}
export function watchlists() {
    return get("/v2/watchlists");
}
export function portfolioHistory(period) {
    return get(`/v2/account/portfolio/history?period=${encodeURIComponent(period ?? "1M")}&timeframe=1D`);
}
