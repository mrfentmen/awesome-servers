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
// ---- muxF tools:
// These two read the public Solana RPC and DexScreener, so they deliberately do
// not call apiKey(): the descriptions promise they work without a Helius key.
const SOL_RPC = "https://api.mainnet-beta.solana.com";
const DEX_TOKEN = "https://api.dexscreener.com/latest/dex/tokens/";
const DEX_SEARCH = "https://api.dexscreener.com/latest/dex/search?q=";
const TOKEN_PROGRAMS = [
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
];
function looksLikeAddress(value) {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}
async function rpc(method, params) {
    const body = { jsonrpc: "2.0", id: 1, method, params };
    const data = await req(SOL_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (data && data.error) {
        const detail = typeof data.error === "string" ? data.error : data.error.message ?? JSON.stringify(data.error);
        throw new HeliusError(`Solana RPC rejected ${method}: ${String(detail).slice(0, 200)}`);
    }
    return data?.result ?? null;
}
function solFromLamports(lamports) {
    return Math.round(Number(lamports ?? 0) * 1e-6) / 1e3;
}
function readTokenAccounts(result) {
    const rows = [];
    const accounts = result?.value;
    if (!Array.isArray(accounts))
        return rows;
    for (const entry of accounts) {
        const info = entry?.account?.data?.parsed?.info;
        const amount = info?.tokenAmount;
        if (!info?.mint || !amount)
            continue;
        const raw = String(amount.amount ?? "0");
        if (raw === "0")
            continue;
        rows.push({
            mint: String(info.mint),
            amount: Number(amount.uiAmount ?? 0),
            decimals: Number(amount.decimals ?? 0),
            raw,
        });
    }
    return rows;
}
export async function walletHoldings(address, limit) {
    const who = String(address ?? "").trim();
    if (!who)
        throw new HeliusError("Give a Solana wallet address.");
    if (!looksLikeAddress(who))
        throw new HeliusError(`"${who}" is not a base58 Solana address (32-44 characters).`);
    const n = Math.min(Math.max(Number(limit ?? 10) || 10, 1), 40);
    const balance = await rpc("getBalance", [who]);
    const account = await rpc("getAccountInfo", [who, { encoding: "base64" }]);
    const lamports = Number(balance?.value ?? 0);
    const byMint = new Map();
    for (const program of TOKEN_PROGRAMS) {
        const held = await rpc("getTokenAccountsByOwner", [who, { programId: program }, { encoding: "jsonParsed" }]);
        for (const row of readTokenAccounts(held)) {
            const prev = byMint.get(row.mint);
            if (prev) {
                prev.amount += row.amount;
            }
            else {
                byMint.set(row.mint, { ...row });
            }
        }
    }
    const tokens = [...byMint.values()]
        .map((t) => ({ mint: t.mint, amount: Math.round(t.amount * 1e6) / 1e6, decimals: t.decimals }))
        .sort((a, b) => b.amount - a.amount);
    return pretty({
        wallet: who,
        sol: solFromLamports(lamports),
        lamports,
        owner: account?.value?.owner ?? null,
        account_exists: Boolean(account?.value),
        data_size: account?.value?.space ?? null,
        tokens_held: tokens.length,
        returned: Math.min(tokens.length, n),
        tokens: tokens.slice(0, n),
        note: "Read from the public Solana RPC: token amounts are ui amounts, not USD values, and a mint address says nothing about whether the token is tradable.",
    });
}
export async function tokenMarket(token, query, limit) {
    const mint = String(token ?? "").trim();
    const term = String(query ?? "").trim();
    const n = Math.min(Math.max(Number(limit ?? 5) || 5, 1), 20);
    if (!mint && !term)
        throw new HeliusError("Give an SPL mint address, or a symbol or name to search for.");
    if (mint && !looksLikeAddress(mint))
        throw new HeliusError(`"${mint}" is not a base58 mint address (32-44 characters).`);
    const url = mint ? `${DEX_TOKEN}${encodeURIComponent(mint)}` : `${DEX_SEARCH}${encodeURIComponent(term)}`;
    const data = await req(url);
    const pairs = Array.isArray(data?.pairs) ? data.pairs : [];
    if (!pairs.length) {
        throw new HeliusError(mint
            ? `DexScreener lists no trading pair for ${mint}; the token may have no pool, or no pool it indexes.`
            : `DexScreener lists no pair matching "${term}".`);
    }
    const rows = pairs
        .map((p) => ({
        chain: p.chainId ?? null,
        dex: p.dexId ?? null,
        pair: p.pairAddress ?? null,
        base: p.baseToken?.symbol ?? null,
        base_name: p.baseToken?.name ?? null,
        quote: p.quoteToken?.symbol ?? null,
        price_usd: p.priceUsd !== undefined && p.priceUsd !== null ? Number(p.priceUsd) : null,
        liquidity_usd: Number(p.liquidity?.usd ?? 0),
        volume_24h_usd: Number(p.volume?.h24 ?? 0),
        buys_24h: Number(p.txns?.h24?.buys ?? 0),
        sells_24h: Number(p.txns?.h24?.sells ?? 0),
        change_24h_pct: p.priceChange?.h24 !== undefined && p.priceChange?.h24 !== null ? Number(p.priceChange.h24) : null,
    }))
        .sort((a, b) => b.liquidity_usd - a.liquidity_usd);
    const top = rows[0];
    return pretty({
        lookup: mint ? { mint } : { query: term },
        pairs_found: rows.length,
        returned: Math.min(rows.length, n),
        deepest_pool: { dex: top.dex, price_usd: top.price_usd, liquidity_usd: top.liquidity_usd },
        total_liquidity_usd: Math.round(rows.reduce((sum, r) => sum + r.liquidity_usd, 0)),
        pairs: rows.slice(0, n),
        note: "Liquidity and volume come from DexScreener; a thin pool can be moved by one trade, and a listed pair is not a review of the token.",
    });
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
