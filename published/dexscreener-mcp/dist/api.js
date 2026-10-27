const BASE = 'https://api.dexscreener.com/latest/dex';
const UA = 'mrfentmen-dexscreener-mcp/1.0';
function boostRow(b, i) {
    return `${i + 1}. ${String(b.chainId ?? '?')} ${String(b.description ?? '').slice(0, 60) || String(b.url ?? '?')}`;
}
async function getApi(path) {
    const res = await fetch(`https://api.dexscreener.com${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`DexScreener returned ${res.status}`);
    return res.json();
}
export async function topBoosts(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
    const d = (await getApi('/token-boosts/top/v1'));
    if (!d.length)
        return 'No boosted tokens.';
    return `Top boosted tokens:\n` + d.slice(0, limit).map(boostRow).join('\n');
}
export async function latestBoosts(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
    const d = (await getApi('/token-boosts/latest/v1'));
    if (!d.length)
        return 'No boosted tokens.';
    return `Latest boosted tokens:\n` + d.slice(0, limit).map(boostRow).join('\n');
}
export async function tokenOrders(args) {
    const chain = (args.chain ?? '').trim();
    const address = (args.address ?? '').trim();
    if (!chain || !address)
        return 'Provide chain and token address.';
    const d = (await getApi(`/orders/v1/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`));
    const orders = d.orders ?? [];
    if (!orders.length)
        return `No paid orders for ${address.slice(0, 12)}...`;
    return `Paid orders:\n` + orders.slice(0, 10).map((o, i) => `${i + 1}. ${String(o.type ?? '?')} ${String(o.status ?? '?')}`).join('\n');
}
export async function multiTokens(args) {
    const chain = (args.chain ?? '').trim();
    const addrs = (args.addresses ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 30);
    if (!chain || !addrs.length)
        return 'Provide chain and comma-separated addresses.';
    const d = (await getApi(`/tokens/v1/${encodeURIComponent(chain)}/${encodeURIComponent(addrs.join(','))}`));
    if (!d.length)
        return 'No tokens found.';
    return d.slice(0, 20).map((t, i) => `${i + 1}. ${t.symbol ?? '?'} (${t.name ?? '?'}) $${t.priceUsd ?? '?'}`).join('\n');
}
export async function trending() {
    const d = (await getApi('/metas/trending/v1'));
    if (!d.length)
        return 'No trending metas.';
    return `Trending:\n` + d.slice(0, 15).map((m, i) => `${i + 1}. ${String(m.name ?? '?')} mcap $${String(m.marketCap ?? '?')}`).join('\n');
}
export async function tokenProfiles() {
    const d = (await getApi('/token-profiles/latest/v1'));
    if (!d.length)
        return 'No token profiles.';
    return `Latest token profiles:\n` + d.slice(0, 15).map((p, i) => `${i + 1}. ${String(p.chainId ?? '?')} ${String(p.description ?? '').slice(0, 60) || String(p.url ?? '?')}`).join('\n');
}
export async function pairDetails(args) {
    const chain = (args.chain ?? '').trim();
    const pair = (args.pair ?? '').trim();
    if (!chain || !pair)
        return 'Provide chain and pair address.';
    const d = (await getApi(`/latest/dex/pairs/${encodeURIComponent(chain)}/${encodeURIComponent(pair)}`));
    const p = d.pair;
    if (!p)
        return 'Pair not found.';
    return `${p.baseToken?.symbol ?? '?'}/${p.quoteToken?.symbol ?? '?'} on ${p.dexId ?? '?'} $${p.priceUsd ?? '?'}`;
}
export async function search(args) {
    const query = (args.query ?? '').trim();
    if (!query)
        return 'Provide a token symbol or name.';
    const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`DexScreener returned ${res.status}`);
    const d = (await res.json());
    const pairs = d.pairs ?? [];
    if (!pairs.length)
        return `No pairs for "${query}".`;
    return `DexScreener results for "${query}" (${pairs.length}):\n` +
        pairs.slice(0, 10).map((p, i) => {
            const bt = p.baseToken ?? {};
            const qt = p.quoteToken ?? {};
            const chg = p.priceChange?.h24 != null ? `${p.priceChange.h24 >= 0 ? '+' : ''}${p.priceChange.h24.toFixed(2)}%` : '?';
            return `${i + 1}. ${bt.symbol ?? '?'}/${qt.symbol ?? '?'} on ${p.dexId ?? '?'} (${p.chainId ?? '?'}) $${p.priceUsd ?? '?'} ${chg} 24h vol $${p.volume?.h24 != null ? p.volume.h24.toFixed(0) : '?'}`;
        }).join('\n');
}
export async function tokens(args) {
    const address = (args.address ?? '').trim();
    if (!address)
        return 'Provide a token address.';
    const res = await fetch(`${BASE}/tokens/${encodeURIComponent(address)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`DexScreener returned ${res.status}`);
    const d = (await res.json());
    const pairs = d.pairs ?? [];
    if (!pairs.length)
        return `No pairs for ${address.slice(0, 12)}...`;
    const best = pairs.slice().sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));
    const rows = best.slice(0, 8).map((p, i) => {
        const bt = p.baseToken ?? {};
        const chg = p.priceChange?.h24 != null ? `${p.priceChange.h24 >= 0 ? '+' : ''}${p.priceChange.h24.toFixed(2)}%` : '?';
        return `${i + 1}. ${bt.symbol ?? '?'} $${p.priceUsd ?? '?'} ${chg} on ${p.dexId ?? '?'} (${p.chainId ?? '?'}) vol $${p.volume?.h24 != null ? p.volume.h24.toFixed(0) : '?'}`;
    });
    return `Top DexScreener pairs for ${address.slice(0, 12)}...:\n${rows.join('\n')}`;
}
