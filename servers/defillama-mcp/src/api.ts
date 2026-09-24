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

return { DefiError, chainTvl, protocolInfo, topProtocols };
})();

export const DefiError = m1.DefiError;
export const chainTvl = m1.chainTvl;
export const chains = m0.chains;
export const protocol = m0.protocol;
export const protocolInfo = m1.protocolInfo;
export const topProtocols = m1.topProtocols;
export const m0_protocol = m0.protocol;
export const m0_chains = m0.chains;
export const m1_topProtocols = m1.topProtocols;
export const m1_chainTvl = m1.chainTvl;
export const m1_protocolInfo = m1.protocolInfo;
export const m1_DefiError = m1.DefiError;
