const BASE = 'https://api.gateio.ws/api/v4/spot';

export interface TickerArgs {
  symbol: string;
}

export async function ticker(args: TickerArgs): Promise<string> {
  const symbol = (args.symbol ?? '').trim().toUpperCase();
  if (!symbol) return 'Provide a trading pair like BTC_USDT.';
  const normalized = symbol.includes('_') ? symbol : symbol.replace(/(USDT|USDC|USD|BTC|ETH)$/, '_$1');
  const url = `${BASE}/tickers?currency_pair=${encodeURIComponent(normalized)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-gateio-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Gate.io returned ${res.status}`);
  const rows = (await res.json()) as Array<Record<string, string>>;
  const row = rows.find((r) => r.currency_pair === normalized) ?? rows[0];
  if (!row?.last) return `No price found for ${normalized}.`;
  return `${row.currency_pair ?? normalized} on Gate.io:\n` +
    [
      `Price: ${row.last}`,
      `24h high: ${row.high_24h ?? 'n/a'}`,
      `24h low: ${row.low_24h ?? 'n/a'}`,
      `24h volume: ${Number(row.base_volume ?? 0).toLocaleString()}`,
    ].join('\n');
}

// ---- muxC tools:

const GATE_BASE = "https://api.gateio.ws/api/v4/spot"
const GATE_UA = "mrfentmen-gateio-mcp/1.0"

class GateError extends Error {}

/** BTC, ETH, SOL and BTC_USDT all normalise to the pair Gate.io expects. */
function gatePair(symbol: string): string {
  const raw = (symbol ?? "").trim().toUpperCase()
  if (!raw) throw new GateError("Provide a trading pair like BTC_USDT or ETHUSDT")
  if (raw.includes("_")) return raw
  const quote = ["USDT", "USDC", "BTC", "ETH", "BNB"].find((q) => raw.endsWith(q) && raw.length > q.length)
  if (!quote) return raw
  return `${raw.slice(0, -quote.length)}_${quote}`
}

async function gateGet<T>(path: string): Promise<T> {
  const res = await fetch(`${GATE_BASE}${path}`, {
    headers: { "User-Agent": GATE_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new GateError(`Gate.io returned ${res.status}`)
  return (await res.json()) as T
}

/** OHLC candlesticks for a pair, oldest first in the returned window. */
export async function candlesticks(args: { symbol?: string; interval?: string; limit?: number }): Promise<string> {
  const pair = gatePair(args.symbol ?? "")
  const allowed = ["10s", "1m", "5m", "15m", "30m", "1h", "4h", "8h", "1d", "7d", "30d"]
  const interval = (args.interval ?? "1h").trim().toLowerCase()
  if (!allowed.includes(interval)) throw new GateError(`interval must be one of: ${allowed.join(", ")}`)
  const limit = Math.max(1, Math.min(args.limit ?? 10, 100))
  const rows = await gateGet<string[][]>(
    `/candlesticks?currency_pair=${encodeURIComponent(pair)}&interval=${interval}&limit=${limit}`,
  )
  if (!rows.length) return `Gate.io returned no ${interval} candles for ${pair}.`
  return [
    `${pair} ${interval} candlesticks on Gate.io (${rows.length} shown, oldest first)`,
    "Time (UTC) | open | high | low | close | base volume | quote volume",
    ...rows.map((r) => {
      const t = new Date(Number(r[0]) * 1000).toISOString().slice(0, 16).replace("T", " ")
      return `${t} | ${r[1]} | ${r[2]} | ${r[3]} | ${r[4]} | ${Number(r[5]).toFixed(2)} | ${Number(r[6]).toFixed(2)}`
    }),
  ].join("\n")
}
