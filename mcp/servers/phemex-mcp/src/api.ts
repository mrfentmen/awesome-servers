const UA = 'mrfentmen-phemex-mcp/1.0';

export interface TickerArgs {
  symbol: string;
}

export async function ticker(args: TickerArgs): Promise<string> {
  const symbol = (args.symbol ?? '').trim().toUpperCase();
  if (!symbol) return 'Provide a symbol like BTCUSD.';
  const res = await fetch(`https://api.phemex.com/v1/md/ticker/24hr?symbol=${encodeURIComponent(symbol)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Phemex returned ${res.status}`);
  const d = (await res.json()) as { error?: unknown; result?: { symbol?: string; lastEp?: number; askEp?: number; bidEp?: number; highEp?: number; lowEp?: number; openEp?: number; turnoverEp?: number } };
  const r = d.result;
  if (!r) throw new Error('Phemex: no result');
  const ep = (v: number | undefined) => (v != null ? v / 1e4 : null);
  const last = ep(r.lastEp);
  const chg = r.openEp ? ((ep(r.lastEp) ?? 0) - ep(r.openEp)!) / ep(r.openEp)! * 100 : null;
  return [
    `Phemex ${r.symbol ?? symbol}:`,
    `Last: ${last != null ? '$' + last.toFixed(2) : '?'} | Ask: ${ep(r.askEp) ?? '?'} | Bid: ${ep(r.bidEp) ?? '?'}`,
    `High: ${ep(r.highEp) ?? '?'} | Low: ${ep(r.lowEp) ?? '?'} | 24h change: ${chg != null ? chg.toFixed(2) + '%' : '?'}`,
  ].filter(Boolean).join('\n');
}

// ---- muxB tools:

async function phemexGet<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.phemex.com${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  const d = (await res.json().catch(() => null)) as { error?: { code?: number; message?: string } | null; result?: T } | null
  // Phemex answers 500 with code 6001 for an unknown symbol, so prefer its own
  // message over the bare status
  if (d?.error) throw new Error(`Phemex: ${d.error.message ?? 'request rejected'}${d.error.code ? ` (code ${d.error.code})` : ''}`)
  if (!res.ok) throw new Error(`Phemex returned ${res.status}`)
  if (!d) throw new Error('Phemex: response was not JSON')
  if (d.result === undefined || d.result === null) throw new Error('Phemex: no result')
  return d.result
}

const phSym = (args: { symbol?: string }): string => {
  const s = (args.symbol ?? '').trim().toUpperCase();
  if (!s) throw new Error('Provide a symbol like BTCUSD.');
  return s;
};

// Phemex quotes perpetual contracts in price epochs (Ep); the existing ticker
// divides by 1e4, so the order book rows use the same scale
const phEp = (v: unknown): string => {
  const n = Number(v);
  return Number.isFinite(n) ? (n / 1e4).toFixed(2) : 'not reported';
}

const phRaw = (v: unknown): string => {
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : 'not reported';
}

// Phemex timestamps are nanoseconds since the epoch
function phemexTime(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 'not reported';
  const ms = n / 1e6;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? 'not reported' : d.toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
}

export interface OrderBookArgs {
  symbol?: string;
  depth?: number;
}

export interface DerivativesMetricsArgs {
  symbol?: string;
}

