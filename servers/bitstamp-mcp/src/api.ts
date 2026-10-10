const UA = 'mrfentmen-bitstamp-mcp/1.0';

export interface TickerArgs {
  pair: string;
}

export async function ticker(args: TickerArgs): Promise<string> {
  const pair = (args.pair ?? '').trim().toLowerCase();
  if (!pair) return 'Provide a pair like btcusd.';
  const res = await fetch(`https://www.bitstamp.net/api/v2/ticker/${encodeURIComponent(pair)}/`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Bitstamp returned ${res.status}`);
  const d = (await res.json()) as Record<string, string>;
  if (d.status === 'error') throw new Error(`Bitstamp: ${String(d.reason ?? 'error')}`);
  const get = (k: string) => d[k] ?? '?';
  return [
    `Bitstamp ${pair}:`,
    `Last: ${get('last')} | Bid: ${get('bid')} | Ask: ${get('ask')}`,
    `High: ${get('high')} | Low: ${get('low')} | Volume: ${get('volume')}`,
    `Timestamp: ${get('timestamp') ? new Date(Number(get('timestamp')) * 1000).toISOString() : '?'}`,
  ].filter(Boolean).join('\n');
}

// ---- muxA tools:

const BITSTAMP = 'https://www.bitstamp.net/api/v2'

const OHLC_STEPS: Array<[number, string]> = [
  [60, '1 minute'],
  [180, '3 minutes'],
  [300, '5 minutes'],
  [900, '15 minutes'],
  [1800, '30 minutes'],
  [3600, '1 hour'],
  [7200, '2 hours'],
  [14400, '4 hours'],
  [21600, '6 hours'],
  [28800, '8 hours'],
  [43200, '12 hours'],
  [86400, '1 day'],
  [259200, '3 days'],
]

function when(epoch: unknown): string {
  const n = Number(epoch);
  if (!Number.isFinite(n) || n <= 0) return "unknown";
  return new Date(n * 1000).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function clamp(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

async function bitstampGet(path: string): Promise<any> {
  const res = await fetch(`${BITSTAMP}${path}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Bitstamp returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  if (d?.status === "error" || d?.code) {
    const detail = d.reason ?? (d.errors as Array<Record<string, string>> | undefined)?.[0]?.message ?? "error";
    throw new Error(`Bitstamp: ${String(detail)}`);
  }
  return d;
}

export interface OrderBookArgs {
  pair: string;
  group?: number;
  limit?: number;
}

export interface OhlcArgs {
  pair: string;
  step?: number;
  limit?: number;
}

export interface PairsArgs {
  trading_only?: boolean;
  search?: string;
  limit?: number;
}

export async function tradingPairs(args: PairsArgs): Promise<string> {
  const d = (await bitstampGet("/trading-pairs-info/")) as Array<Record<string, unknown>>;
  if (!Array.isArray(d) || !d.length) throw new Error("Bitstamp returned no trading pairs.");
  const q = (args.search ?? "").trim().toLowerCase();
  let rows = d;
  if (q) rows = rows.filter((p) => `${p.name ?? ""} ${p.url_symbol ?? ""}`.toLowerCase().includes(q));
  if (args.trading_only !== false) rows = rows.filter((p) => String(p.trading ?? "").toLowerCase() === "enabled");
  if (!rows.length) {
    return q ? `No trading pair matches "${q}".` : "Bitstamp lists no enabled trading pairs.";
  }
  const limit = clamp(args.limit, 25, 100);
  const shown = rows.slice(0, limit);
  return [
    `Bitstamp trading pairs: ${rows.length} ${rows.length === 1 ? "match" : "matches"}, showing ${shown.length} of ${d.length} total.`,
    ...shown.map((p, i) =>
      `${i + 1}. ${String(p.name ?? "?")} | symbol ${String(p.url_symbol ?? "?")} | base decimals ${p.base_decimals ?? "?"}` +
      ` | min order ${String(p.minimum_order ?? "not reported")} | trading ${p.trading ?? "?"} | instant ${String(p.instant_trading ?? "?")}`),
    rows.length > limit ? `plus ${rows.length - limit} more` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
