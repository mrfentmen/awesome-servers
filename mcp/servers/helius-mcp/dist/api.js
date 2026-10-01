export class HeliusError extends Error {
    constructor(message) {
        super(message);
        this.name = "HeliusError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function apiKey() {
    const k = process.env.HELIUS_API_KEY;
    if (!k)
        throw new HeliusError("Set the HELIUS_API_KEY environment variable.");
    return k;
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(url, init = {}) {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new HeliusError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getBalances(address) {
    const key = apiKey();
    let url = `https://api.helius.xyz/v0/addresses/${encodeURIComponent(String(address))}/balances`;
    const qs = new URLSearchParams();
    qs.append("api-key", key);
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getTransactions(address, limit) {
    const key = apiKey();
    let url = `https://api.helius.xyz/v0/addresses/${encodeURIComponent(String(address))}/transactions`;
    const qs = new URLSearchParams();
    qs.append("api-key", key);
    if (limit !== undefined)
        qs.append("limit", String(limit));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getNfts(address, page) {
    const key = apiKey();
    let url = `https://api.helius.xyz/v0/addresses/${encodeURIComponent(String(address))}/nfts`;
    const qs = new URLSearchParams();
    qs.append("api-key", key);
    if (page !== undefined)
        qs.append("page", String(page));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getTokenMetadata(mints) {
    const key = apiKey();
    let url = `https://api.helius.xyz/v0/token-metadata`;
    const qs = new URLSearchParams();
    qs.append("api-key", key);
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const mintAccounts = mints.split(",").map((m) => m.trim()).filter(Boolean);
    const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mintAccounts }) });
    return pretty(data);
}
export async function parseTransactions(transactions) {
    const key = apiKey();
    let url = `https://api.helius.xyz/v0/transactions`;
    const qs = new URLSearchParams();
    qs.append("api-key", key);
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const txs = transactions.split(",").map((m) => m.trim()).filter(Boolean);
    const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactions: txs }) });
    return pretty(data);
}
