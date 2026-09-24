const BASE = 'https://api.kraken.com/0/public';

export interface TickerArgs {
  pair: string;
}

export async function ticker(args: TickerArgs): Promise<string> {
  const pair = (args.pair ?? '').trim().toUpperCase();
  if (!pair) return 'Provide a pair like XBTUSD.';
  const res = await fetch(`${BASE}/Ticker?pair=${encodeURIComponent(pair)}`, {
    headers: { 'User-Agent': 'mrfentmen-kraken-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Kraken returned ${res.status}`);
  const d = (await res.json()) as { result?: Record<string, Record<string, unknown>> };
  const result = d.result ?? {};
  const key = Object.keys(result)[0];
  if (!key) return `No ticker for ${pair}.`;
  const r = result[key];
  const a = (r.a ?? []) as Array<unknown>;
  const c = (r.c ?? []) as Array<unknown>;
  const v = (r.v ?? []) as Array<unknown>;
  const h = (r.h ?? []) as Array<unknown>;
  const l = (r.l ?? []) as Array<unknown>;
  const num = (x: unknown) => (x != null ? Number(x) : NaN);
  return [
    `Kraken ${key}:`,
    `Last: ${String(c[0] ?? '')} | Ask: ${String(a[0] ?? '')}`,
    `24h: high ${String(h[1] ?? '')} low ${String(l[1] ?? '')}`,
    `24h volume: ${String(v[1] ?? '')}`,
    `Spread: ${num(c[0]) - num(a[0])}`,
  ].filter(Boolean).join('\n');
}

export async function assets(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/Assets`, {
    headers: { 'User-Agent': 'mrfentmen-kraken-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Kraken returned ${res.status}`);
  const d = (await res.json()) as { result?: Record<string, Record<string, unknown>> };
  const result = d.result ?? {};
  const keys = Object.keys(result);
  if (!keys.length) return 'No assets returned.';
  return `Kraken assets (${keys.length}):\n` +
    keys.slice(0, 30).map((k, i) => {
      const a = result[k];
      const name = String((a.altname ?? a.asset ?? k));
      return `${i + 1}. ${name}`;
    }).join('\n');
}
