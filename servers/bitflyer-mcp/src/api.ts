const BASE = 'https://api.bitflyer.com/v1';
const UA = 'mrfentmen-bitflyer-mcp/1.0 (https://github.com/mrfentmen)';
export class BitflyerError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new BitflyerError(`BitFlyer returned ${res.status}`);
  return (await res.json()) as T;
}

export async function ticker(args: { product?: string }): Promise<string> {
  const product = (args.product ?? 'BTC_JPY').toUpperCase();
  const d = await get<{ product_code?: string; state?: string; timestamp?: string; tick_id?: number; best_bid?: number; best_ask?: number; best_bid_size?: number; best_ask_size?: number; total_bid_depth?: number; total_ask_depth?: number; ltp?: number; volume?: number }>(`${BASE}/ticker?product_code=${encodeURIComponent(product)}`);
  return [
    `${d.product_code ?? product}: ${d.ltp ?? '?'} JPY`,
    `Best bid: ${d.best_bid ?? '?'} (${d.best_bid_size ?? '?'}) | Best ask: ${d.best_ask ?? '?'} (${d.best_ask_size ?? '?'})`,
    `Volume: ${d.volume ?? '?'} | State: ${d.state ?? '?'}`,
    `Time: ${d.timestamp ?? '?'}`,
  ].join('\n');
}

export async function board(args: { product?: string; depth?: number }): Promise<string> {
  const product = (args.product ?? 'BTC_JPY').toUpperCase();
  const depth = Math.max(1, Math.min(args.depth ?? 5, 20));
  const d = await get<{ bids?: Array<{ price?: number; size?: number }>; asks?: Array<{ price?: number; size?: number }> }>(`${BASE}/board?product_code=${encodeURIComponent(product)}`);
  const bids = (d.bids ?? []).slice(0, depth);
  const asks = (d.asks ?? []).slice(0, depth);
  const fmt = (side: string, rows: Array<{ price?: number; size?: number }>) => rows.map((r) => `${side} ${r.price ?? '?'} @ ${r.size ?? '?'}`).join('\n');
  return `Order book ${product} (top ${depth}):\n${fmt('ASK', asks)}\n---\n${fmt('BID', bids)}`;
}

export async function markets(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<Array<{ product_code?: string; market_type?: string }>>(`${BASE}/markets`);
  const rows = (d ?? []).filter((m) => m.market_type === 'Spot').slice(0, 30);
  return `BitFlyer spot markets (${rows.length} shown):\n${rows.map((m, i) => `${i + 1}. ${m.product_code ?? '?'}`).join('\n')}`;
}

// ---- muxA tools:
// The three existing tools cover a single ticker, a single order book and the
// market list. These add the public execution tape, a summary across every
// spot market, and a check of the BTC quoted cross rates against their JPY
// counterparts.
interface BfTicker {
  product_code?: string;
  state?: string;
  timestamp?: string;
  best_bid?: number;
  best_ask?: number;
  best_bid_size?: number;
  best_ask_size?: number;
  total_bid_depth?: number;
  total_ask_depth?: number;
  ltp?: number;
  volume?: number;
}

interface BfExecution {
  id?: number;
  side?: string;
  price?: number;
  size?: number;
  exec_date?: string;
}

interface BfMarket {
  product_code?: string;
  market_type?: string;
}

// A rejected product answers HTTP 400 with a JSON body carrying error_message,
// which the existing helper drops, so the reason is read before throwing.
async function bfGet<T>(path: string, missing: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 404) throw new BitflyerError(missing);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error_message?: string } | null;
    throw new BitflyerError(`BitFlyer answered ${res.status}${body?.error_message ? `: ${body.error_message}` : ''}`);
  }
  return (await res.json()) as T;
}

function bfMid(ticker: BfTicker): number | null {
  if (typeof ticker.best_bid !== 'number' || typeof ticker.best_ask !== 'number') return null;
  return (ticker.best_bid + ticker.best_ask) / 2;
}

function bfSpread(ticker: BfTicker): { spread: number; percent: number } | null {
  const mid = bfMid(ticker);
  if (mid === null || typeof ticker.best_bid !== 'number' || typeof ticker.best_ask !== 'number') return null;
  const spread = ticker.best_ask - ticker.best_bid;
  return { spread, percent: mid === 0 ? 0 : (spread / mid) * 100 };
}

function bfNumber(value: number | undefined, digits = 2): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'not reported';
  return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

export async function marketSummary(_args: Record<string, never> = {}): Promise<string> {
  const markets = await bfGet<BfMarket[]>('/getmarkets', 'BitFlyer returned no market list');
  const spot = (markets ?? []).filter((market) => market.market_type === 'Spot' && market.product_code);
  if (!spot.length) return 'BitFlyer listed no spot markets.';

  const rows: string[] = [];
  const paused: string[] = [];
  for (const market of spot) {
    const product = market.product_code as string;
    const ticker = await bfGet<BfTicker>(`/ticker?product_code=${encodeURIComponent(product)}`, `no ticker for ${product}`);
    const spread = bfSpread(ticker);
    if (ticker.state !== 'RUNNING') paused.push(`${product} reports state ${ticker.state ?? 'unknown'}`);
    const imbalance =
      typeof ticker.total_bid_depth === 'number' && typeof ticker.total_ask_depth === 'number' && ticker.total_ask_depth > 0
        ? ticker.total_bid_depth / ticker.total_ask_depth
        : null;
    rows.push(
      `    ${product.padEnd(9)} last ${bfNumber(ticker.ltp, 4).padStart(14)}  ` +
        `spread ${spread ? `${bfNumber(spread.spread, 6)} (${spread.percent.toFixed(3)} percent)` : 'not reported'}  ` +
        `volume ${bfNumber(ticker.volume, 4)}  ` +
        `book depth bid/ask ${imbalance === null ? 'not reported' : imbalance.toFixed(3)}x`,
    );
  }

  return [
    `BitFlyer spot market summary, ${spot.length} markets, each read from its own ticker snapshot:`,
    ...rows,
    '',
    '  The spread is the difference between the best bid and the best ask, in the quote currency of that market.',
    '  Book depth is total bid size divided by total ask size, so a value above one means more resting size on the bid side.',
    ...(paused.length ? ['', `  Not running normally: ${paused.join('; ')}.`] : ['', '  Every market reports state RUNNING.']),
    '  Prices are not converted between markets, so BTC_JPY and ETH_BTC figures are not comparable directly.',
  ].join('\n');
}

