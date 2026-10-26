const m0 = (() => {
    const BASE = 'https://api.llama.fi';
    async function chains(_args) {
        const res = await fetch(`${BASE}/v2/chains`, {
            headers: { 'User-Agent': 'mrfentmen-defillama-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`DefiLlama returned ${res.status}`);
        const d = (await res.json());
        if (!d.length)
            return 'No chain data returned.';
        const fmt = (v) => {
            const n = Number(v);
            if (!n)
                return '$0';
            if (n >= 1e9)
                return `$${(n / 1e9).toFixed(2)}B`;
            if (n >= 1e6)
                return `$${(n / 1e6).toFixed(1)}M`;
            return `$${n.toFixed(0)}`;
        };
        return `DeFi TVL by chain (${d.length} chains):\n` +
            d.slice(0, 20).map((c, i) => {
                const s = (k) => (c[k] != null ? String(c[k]) : '');
                return `${i + 1}. ${s('name')} | ${fmt(c.tvl)}`;
            }).join('\n');
    }
    async function protocol(args) {
        const slug = (args.slug ?? '').trim();
        if (!slug)
            return 'Provide a protocol slug.';
        const res = await fetch(`${BASE}/protocol/${encodeURIComponent(slug)}`, {
            headers: { 'User-Agent': 'mrfentmen-defillama-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`DefiLlama returned ${res.status}`);
        const d = (await res.json());
        const s = (k) => (d[k] != null ? String(d[k]) : '');
        const tvl = d.tvl ?? [];
        const latest = Array.isArray(tvl) && tvl.length ? tvl.at(-1) : null;
        const chainTvls = (d.currentChainTvls ?? {});
        return [
            `Protocol: ${s('name')}`,
            s('url') ? `Site: ${s('url')}` : '',
            latest ? `Latest TVL: $${Number(latest.tvl ?? 0).toLocaleString()}` : '',
            Object.keys(chainTvls).length ? `Chains: ${Object.entries(chainTvls).slice(0, 8).map(([k, v]) => `${k} $${Math.round(Number(v)).toLocaleString()}`).join(', ')}` : '',
        ].filter(Boolean).join('\n');
    }
    return { chains, protocol };
})();
const m1 = (() => {
    const BASE = "https://api.llama.fi";
    const UA = "mrfentmen-defi-tvl-mcp/1.0 (https://github.com/mrfentmen)";
    class DefiError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
        if (res.status === 429)
            throw new DefiError("DefiLlama rate limit hit, wait and retry");
        if (!res.ok)
            throw new DefiError(`DefiLlama error ${res.status}`);
        return (await res.json());
    }
    function fmtUsd(v) {
        if (v === undefined || v === null)
            return "n/a";
        return "$" + v.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    async function topProtocols(args) {
        const limit = Math.min(args.limit ?? 10, 50);
        const d = await get(`${BASE}/protocols`);
        const rows = d
            .filter((p) => !p?.misrepresentedTokens)
            .sort((a, b) => (b?.tvl ?? 0) - (a?.tvl ?? 0))
            .slice(0, limit);
        if (!rows.length)
            return "No protocols returned";
        return rows.map((p, i) => `${i + 1}. ${p?.name ?? "n/a"} | ${fmtUsd(p?.tvl)} | chains: ${(p?.chains ?? []).slice(0, 4).join(", ") || "n/a"}`).join("\n");
    }
    async function chainTvl(args) {
        const limit = Math.min(args.limit ?? 10, 50);
        const d = await get(`${BASE}/v2/chains`);
        const rows = [...d].sort((a, b) => (b?.tvl ?? 0) - (a?.tvl ?? 0)).slice(0, limit);
        if (!rows.length)
            return "No chains returned";
        return rows.map((c, i) => `${i + 1}. ${c?.name ?? "n/a"} | ${fmtUsd(c?.tvl)} | ${c?.tokenSymbol ?? ""}`).join("\n");
    }
    async function protocolInfo(args) {
        const slug = (args.protocol ?? "").trim().toLowerCase().replace(/ /g, "-");
        if (!slug)
            throw new DefiError("Provide a protocol slug");
        const d = await get(`${BASE}/protocol/${encodeURIComponent(slug)}`);
        return `Protocol: ${d?.name ?? slug}\nCurrent TVL: ${fmtUsd(d?.tvl)}\nChains: ${(d?.chains ?? []).join(", ") || "n/a"}\nCategory: ${d?.category ?? "n/a"}\nDescription: ${d?.description ?? "n/a"}\nWebsite: ${d?.url ?? "n/a"}`;
    }
    async function topYields(args) {
        const limit = Math.min(args.limit ?? 10, 25);
        const res = await fetch('https://yields.llama.fi/pools', {
            headers: { "User-Agent": UA, Accept: 'application/json' }, signal: AbortSignal.timeout(30000)
        });
        if (!res.ok)
            throw new DefiError(`DefiLlama error ${res.status}`);
        const d = (await res.json());
        const rows = (d.data ?? []).filter((p) => (p.apy ?? 0) > 0)
            .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0)).slice(0, limit);
        if (!rows.length)
            return 'No yield pools returned.';
        return `Top APY pools (${rows.length} shown):\n` + rows.map((p, i) => `${i + 1}. ${p.project ?? '?'} ${p.symbol ?? ''} on ${p.chain ?? '?'}: ${(p.apy ?? 0).toFixed(2)}% APY, TVL ${fmtUsd(p.tvlUsd)}`).join('\n');
    }
    async function hacks(args) {
        const limit = Math.min(args.limit ?? 10, 25);
        const d = await get(`${BASE}/hacks`);
        const rows = [...d].sort((a, b) => (b.date ?? 0) - (a.date ?? 0)).slice(0, limit);
        if (!rows.length)
            return 'No hacks returned.';
        return `Largest recent DeFi hacks (${rows.length} shown):\n` + rows.map((h) => {
            const date = h.date ? new Date(h.date * 1000).toISOString().slice(0, 10) : '?';
            return `${date} ${h.name ?? '?'} (${(h.chain ?? []).join('/') || '?'}) $${Number(h.amount ?? 0).toLocaleString()} — ${h.technique ?? '?'}`;
        }).join('\n');
    }
    return { DefiError, chainTvl, protocolInfo, topProtocols, topYields, hacks };
})();
export const DefiError = m1.DefiError;
export const chainTvl = m1.chainTvl;
export const chains = m0.chains;
export const protocol = m0.protocol;
export const protocolInfo = m1.protocolInfo;
export const topProtocols = m1.topProtocols;
export const m0_protocol = m0.protocol;
export const m0_chains = m0.chains;
export const topYields = m1.topYields;
export const hacks = m1.hacks;
export const m1_topProtocols = m1.topProtocols;
export const m1_chainTvl = m1.chainTvl;
export const m1_protocolInfo = m1.protocolInfo;
export const m1_DefiError = m1.DefiError;
// ---- batch-3 tools: extra live market data (2026-09-27) ----
const LLAMA_BASE = 'https://api.llama.fi';
const STABLECOIN_BASE = 'https://stablecoins.llama.fi';
class LlamaBatch3Error extends Error {
}
async function llamaGet(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'mrfentmen-defillama-mcp/1.0', Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
    if (res.status === 429)
        throw new LlamaBatch3Error('DefiLlama rate limit hit, wait and retry');
    if (!res.ok)
        throw new LlamaBatch3Error(`DefiLlama error ${res.status}`);
    return (await res.json());
}
const usd3 = (n) => (n === undefined || !Number.isFinite(n) ? 'n/a' : `$${Math.round(n).toLocaleString()}`);
export async function stablecoins(args) {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 30);
    const d = await llamaGet(`${STABLECOIN_BASE}/stablecoins?includePrices=true`);
    const rows = d.peggedAssets ?? [];
    if (!rows.length)
        return 'DefiLlama returned no stablecoins.';
    const value = (a) => Number(a.circulating?.peggedUSD ?? 0) || Object.values(a.circulating ?? {}).reduce((s, v) => s + (Number(v) || 0), 0);
    const total = rows.reduce((s, a) => s + value(a), 0);
    const top = [...rows].sort((a, b) => value(b) - value(a)).slice(0, limit);
    return [
        `DefiLlama stablecoins: ${rows.length} assets, ${usd3(total)} circulating (pegged-USD value).`,
        `Top ${top.length}:`,
        ...top.map((a, i) => {
            const v = value(a);
            const weekAgo = Number(a.circulatingPrevWeek?.peggedUSD ?? 0);
            const change = weekAgo > 0 ? ` | ${(((v - weekAgo) / weekAgo) * 100).toFixed(1)}% in 7d` : '';
            return `  ${i + 1}. ${a.symbol ?? '?'} — ${a.name ?? '?'} | ${usd3(v)} | ${a.pegMechanism ?? '?'} (${a.pegType ?? '?'}) | price ${a.price ?? '?'}${change}`;
        }),
    ].join('\n');
}
async function overview(path, verb, limit) {
    const d = await llamaGet(`${LLAMA_BASE}/overview/${path}`);
    const rows = (d.protocols ?? []).filter((p) => Number(p.total24h ?? 0) > 0)
        .sort((a, b) => Number(b.total24h ?? 0) - Number(a.total24h ?? 0)).slice(0, limit);
    if (!rows.length)
        return `DefiLlama returned no ${verb} data.`;
    return [
        `DefiLlama ${verb}: ${usd3(d.total24h)} in 24h | ${usd3(d.total7d)} in 7d | ${usd3(d.totalAllTime)} all time | 24h change ${d.change_1d ?? '?'}%.`,
        `Top ${rows.length} protocols by 24h ${verb}:`,
        ...rows.map((p, i) => `  ${i + 1}. ${p.name ?? '?'}${p.category ? ` (${p.category})` : ''} | 24h ${usd3(p.total24h)} | 7d ${usd3(p.total7d)} | ${p.change_1d !== undefined ? `${p.change_1d}% in 24h` : 'no 24h change'} | ${(p.chains ?? []).slice(0, 3).join(', ') || 'no chain'}`),
    ].join('\n');
}
export async function dexVolume(args) {
    return overview('dexs', 'DEX volume', Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 30));
}
export async function feesOverview(args) {
    return overview('fees', 'fees', Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 30));
}
// ---- muxD tools:
/** DefiLlama nests most monetary figures under a per-peg-type object like { peggedUSD: n }. */
function pegValue(source, key = 'peggedUSD') {
    if (!source || typeof source !== 'object')
        return 0;
    const rec = source;
    const direct = rec[key];
    if (direct !== undefined && direct !== null && Number.isFinite(Number(direct)))
        return Number(direct);
    let total = 0;
    for (const v of Object.values(rec)) {
        const n = Number(v);
        if (Number.isFinite(n))
            total += n;
    }
    return total;
}
const dlUsd = (n, dp) => {
    if (!Number.isFinite(n))
        return 'n/a';
    const abs = Math.abs(n);
    if (dp !== undefined)
        return `$${n.toLocaleString(undefined, { maximumFractionDigits: dp, minimumFractionDigits: dp })}`;
    if (abs >= 1e12)
        return `$${(n / 1e12).toFixed(2)}T`;
    if (abs >= 1e9)
        return `$${(n / 1e9).toFixed(2)}B`;
    if (abs >= 1e6)
        return `$${(n / 1e6).toFixed(2)}M`;
    if (abs >= 1e3)
        return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
};
/** Where stablecoin supply actually sits by chain, which is where the liquidity and the users are. */
export async function stablecoinChains(args = {}) {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 15), 1), 60);
    const minShare = Math.max(Number(args.min_share_pct ?? 0) || 0, 0);
    const d = await llamaGet(`${STABLECOIN_BASE}/stablecoinchains`);
    const rows = (Array.isArray(d) ? d : [])
        .map((r) => ({ name: String(r?.name ?? '?'), value: pegValue(r?.totalCirculatingUSD) }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value);
    if (!rows.length)
        return 'DefiLlama returned no chain-level stablecoin supply.';
    const total = rows.reduce((s, r) => s + r.value, 0);
    const kept = minShare > 0 ? rows.filter((r) => (r.value / total) * 100 >= minShare) : rows;
    if (!kept.length) {
        return `No chain holds at least ${minShare}% of stablecoin supply. The largest is ${rows[0].name} at ${((rows[0].value / total) * 100).toFixed(2)}%, so lower the threshold.`;
    }
    const shown = kept.slice(0, limit);
    const topShare = kept.slice(0, 5).reduce((s, r) => s + r.value, 0) / total;
    const width = Math.max(...shown.map((r) => r.name.length), 8);
    const lines = [
        `Stablecoin supply by chain: ${rows.length} chain(s) hold ${dlUsd(total)} in total`,
        `The top 5 chains hold ${((topShare) * 100).toFixed(2)}% of it, so stablecoin liquidity is ${topShare > 0.8 ? 'extremely concentrated' : topShare > 0.5 ? 'concentrated' : 'fairly spread'}.`,
        minShare > 0 ? `Only chains at or above ${minShare}% share are listed.` : '',
        '',
        `${"chain".padEnd(width)}${"supply".padStart(12)}${"share".padStart(8)}  cumulative`,
    ];
    let running = 0;
    for (const r of shown) {
        running += r.value;
        lines.push(`${r.name.slice(0, width).padEnd(width)}${dlUsd(r.value).padStart(12)}${((r.value / total) * 100).toFixed(2).padStart(7)}%${((running / total) * 100).toFixed(2).padStart(11)}%`);
    }
    if (kept.length > shown.length)
        lines.push(`  ...and ${kept.length - shown.length} more chains above the threshold.`);
    lines.push('', 'Supply is measured in USD at current prices, so a depeg shows up here as a fall in value even if the token count is unchanged.');
    return lines.filter((l) => l !== '').join('\n');
}
