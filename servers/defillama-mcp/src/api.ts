const m0 = (() => {
const BASE = 'https://api.llama.fi';

async function chains(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/v2/chains`, {
    headers: { 'User-Agent': 'mrfentmen-defillama-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`DefiLlama returned ${res.status}`);
  const d = (await res.json()) as Array<Record<string, unknown>>;
  if (!d.length) return 'No chain data returned.';
  const fmt = (v: unknown) => {
    const n = Number(v);
    if (!n) return '$0';
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${n.toFixed(0)}`;
  };
  return `DeFi TVL by chain (${d.length} chains):\n` +
    d.slice(0, 20).map((c, i) => {
      const s = (k: string) => (c[k] != null ? String(c[k]) : '');
      return `${i + 1}. ${s('name')} | ${fmt(c.tvl)}`;
    }).join('\n');
}

async function protocol(args: { slug: string }): Promise<string> {
  const slug = (args.slug ?? '').trim();
  if (!slug) return 'Provide a protocol slug.';
  const res = await fetch(`${BASE}/protocol/${encodeURIComponent(slug)}`, {
    headers: { 'User-Agent': 'mrfentmen-defillama-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`DefiLlama returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const s = (k: string) => (d[k] != null ? String(d[k]) : '');
  const tvl = d.tvl ?? [];
  const latest = Array.isArray(tvl) && tvl.length ? (tvl as Array<Record<string, unknown>>).at(-1) : null;
  const chainTvls = (d.currentChainTvls ?? {}) as Record<string, unknown>;
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
const BASE = "https://api.llama.fi"
const UA = "mrfentmen-defi-tvl-mcp/1.0 (https://github.com/mrfentmen)"
class DefiError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new DefiError("DefiLlama rate limit hit, wait and retry")
  if (!res.ok) throw new DefiError(`DefiLlama error ${res.status}`)
  return (await res.json()) as T
}

function fmtUsd(v: number | undefined): string {
  if (v === undefined || v === null) return "n/a"
  return "$" + v.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

async function topProtocols(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 50)
  const d = await get<any[]>(`${BASE}/protocols`)
  const rows = d
    .filter((p: any) => !p?.misrepresentedTokens)
    .sort((a: any, b: any) => (b?.tvl ?? 0) - (a?.tvl ?? 0))
    .slice(0, limit)
  if (!rows.length) return "No protocols returned"
  return rows.map((p: any, i: number) => `${i + 1}. ${p?.name ?? "n/a"} | ${fmtUsd(p?.tvl)} | chains: ${(p?.chains ?? []).slice(0, 4).join(", ") || "n/a"}`).join("\n")
}

async function chainTvl(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 50)
  const d = await get<any[]>(`${BASE}/v2/chains`)
  const rows = [...d].sort((a: any, b: any) => (b?.tvl ?? 0) - (a?.tvl ?? 0)).slice(0, limit)
  if (!rows.length) return "No chains returned"
  return rows.map((c: any, i: number) => `${i + 1}. ${c?.name ?? "n/a"} | ${fmtUsd(c?.tvl)} | ${c?.tokenSymbol ?? ""}`).join("\n")
}

async function protocolInfo(args: { protocol?: string }): Promise<string> {
  const slug = (args.protocol ?? "").trim().toLowerCase().replace(/ /g, "-")
  if (!slug) throw new DefiError("Provide a protocol slug")
  const d = await get<any>(`${BASE}/protocol/${encodeURIComponent(slug)}`)
  return `Protocol: ${d?.name ?? slug}\nCurrent TVL: ${fmtUsd(d?.tvl)}\nChains: ${(d?.chains ?? []).join(", ") || "n/a"}\nCategory: ${d?.category ?? "n/a"}\nDescription: ${d?.description ?? "n/a"}\nWebsite: ${d?.url ?? "n/a"}`
}

async function topYields(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 25)
  const res = await fetch('https://yields.llama.fi/pools', {
    headers: { "User-Agent": UA, Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new DefiError(`DefiLlama error ${res.status}`);
  const d = (await res.json()) as { data?: { project?: string; symbol?: string; chain?: string; apy?: number; tvlUsd?: number }[] };
  const rows = (d.data ?? []).filter((p) => (p.apy ?? 0) > 0)
    .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0)).slice(0, limit);
  if (!rows.length) return 'No yield pools returned.';
  return `Top APY pools (${rows.length} shown):\n` + rows.map((p, i) =>
    `${i + 1}. ${p.project ?? '?'} ${p.symbol ?? ''} on ${p.chain ?? '?'}: ${(p.apy ?? 0).toFixed(2)}% APY, TVL ${fmtUsd(p.tvlUsd)}`).join('\n');
}

async function hacks(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 25)
  const d = await get<{ date?: number; name?: string; technique?: string; amount?: number; chain?: string[] }[]>(`${BASE}/hacks`);
  const rows = [...d].sort((a, b) => (b.date ?? 0) - (a.date ?? 0)).slice(0, limit);
  if (!rows.length) return 'No hacks returned.';
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
class LlamaBatch3Error extends Error {}
async function llamaGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': 'mrfentmen-defillama-mcp/1.0', Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (res.status === 429) throw new LlamaBatch3Error('DefiLlama rate limit hit, wait and retry');
  if (!res.ok) throw new LlamaBatch3Error(`DefiLlama error ${res.status}`);
  return (await res.json()) as T;
}

const usd3 = (n?: number) => (n === undefined || !Number.isFinite(n) ? 'n/a' : `$${Math.round(n).toLocaleString()}`);

type Stablecoin = {
  name?: string; symbol?: string; pegType?: string; pegMechanism?: string; price?: number;
  circulating?: Record<string, number>; circulatingPrevWeek?: Record<string, number>;
};

export async function stablecoins(args: { limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 30);
  const d = await llamaGet<{ peggedAssets?: Stablecoin[] }>(`${STABLECOIN_BASE}/stablecoins?includePrices=true`);
  const rows = d.peggedAssets ?? [];
  if (!rows.length) return 'DefiLlama returned no stablecoins.';
  const value = (a: Stablecoin) => Number(a.circulating?.peggedUSD ?? 0) || Object.values(a.circulating ?? {}).reduce((s, v) => s + (Number(v) || 0), 0);
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

type Overview = {
  total24h?: number; total7d?: number; total30d?: number; totalAllTime?: number; change_1d?: number;
  protocols?: { name?: string; category?: string; chains?: string[]; total24h?: number; total7d?: number; change_1d?: number }[];
};

async function overview(path: 'dexs' | 'fees', verb: string, limit: number): Promise<string> {
  const d = await llamaGet<Overview>(`${LLAMA_BASE}/overview/${path}`);
  const rows = (d.protocols ?? []).filter((p) => Number(p.total24h ?? 0) > 0)
    .sort((a, b) => Number(b.total24h ?? 0) - Number(a.total24h ?? 0)).slice(0, limit);
  if (!rows.length) return `DefiLlama returned no ${verb} data.`;
  return [
    `DefiLlama ${verb}: ${usd3(d.total24h)} in 24h | ${usd3(d.total7d)} in 7d | ${usd3(d.totalAllTime)} all time | 24h change ${d.change_1d ?? '?'}%.`,
    `Top ${rows.length} protocols by 24h ${verb}:`,
    ...rows.map((p, i) => `  ${i + 1}. ${p.name ?? '?'}${p.category ? ` (${p.category})` : ''} | 24h ${usd3(p.total24h)} | 7d ${usd3(p.total7d)} | ${p.change_1d !== undefined ? `${p.change_1d}% in 24h` : 'no 24h change'} | ${(p.chains ?? []).slice(0, 3).join(', ') || 'no chain'}`),
  ].join('\n');
}

export async function dexVolume(args: { limit?: number }): Promise<string> {
  return overview('dexs', 'DEX volume', Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 30));
}

export async function feesOverview(args: { limit?: number }): Promise<string> {
  return overview('fees', 'fees', Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 30));
}
