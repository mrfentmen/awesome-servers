const BASE = 'https://api.blockchair.com';
const UA = 'mrfentmen-blockchair-mcp/1.0';
export async function stats(_args) {
    const res = await fetch(`${BASE}/bitcoin/stats`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Blockchair returned ${res.status}`);
    const d = (await res.json());
    const s = d.data ?? {};
    const fmt = (n) => (n != null ? n.toLocaleString() : '?');
    return [
        'Blockchair Bitcoin stats:',
        `Blocks: ${fmt(s.blocks)} | Transactions: ${fmt(s.transactions)}`,
        s.market_price_usd != null ? `Market price: $${s.market_price_usd}` : null,
        s.mempool_transactions != null ? `Mempool: ${fmt(s.mempool_transactions)} txs` : null,
        s.average_transaction_fee_usd != null ? `Avg tx fee: $${s.average_transaction_fee_usd}` : null,
    ].filter(Boolean).join('\n');
}
export async function chain(args) {
    const chain = (args?.chain ?? 'bitcoin').trim().toLowerCase();
    const res = await fetch(`${BASE}/${encodeURIComponent(chain)}/stats`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Blockchair returned ${res.status}`);
    const d = (await res.json());
    const s = d.data ?? {};
    const fmt = (n) => (n != null ? n.toLocaleString() : '?');
    return [
        `Blockchair ${chain} stats:`,
        `Blocks: ${fmt(s.blocks)} | Transactions: ${fmt(s.transactions)}`,
        s.market_price_usd != null ? `Market price: $${s.market_price_usd}` : null,
    ].filter(Boolean).join('\n');
}
// ---- muxP tools:
const BCHAIR_CHAINS = [
    "bitcoin",
    "ethereum",
    "dogecoin",
    "litecoin",
    "bitcoin-cash",
    "zcash",
    "monero",
    "dash",
    "stellar",
    "ripple",
];
async function bchairFetch(chain) {
    const res = await fetch(`${BASE}/${encodeURIComponent(chain)}/stats`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Blockchair returned HTTP ${res.status} for ${chain}.`);
    const body = await res.text();
    if (!body.trim())
        throw new Error(`Blockchair returned an empty body for ${chain}.`);
    let d;
    try {
        d = JSON.parse(body);
    }
    catch {
        throw new Error(`Blockchair returned something that is not JSON for ${chain}.`);
    }
    const stats = d.data ?? {};
    if (typeof stats.blocks !== "number" && typeof stats.best_block_height !== "number") {
        throw new Error(`Blockchair has no block statistics for ${chain}, so it may not be a chain it tracks.`);
    }
    return { stats, height: d.context?.code ?? null };
}
const bcNum = (value) => (typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en-US") : "not reported");
const bcUsd = (value) => typeof value === "number" && Number.isFinite(value) ? `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "not reported";
