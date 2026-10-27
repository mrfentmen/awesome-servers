
export interface m0_QuoteArgs {
  symbol: string;
  range?: string;
}
export interface m0_SearchArgs {
  query: string;
}

const m0 = (() => {
const UA = 'mrfentmen-yfinance-mcp/1.0';



async function quote(args: m0_QuoteArgs): Promise<string> {
  const symbol = String(args.symbol).trim().toUpperCase();
  const range = String(args?.range ?? '5d').trim();
  const allowed = new Set(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']);
  if (!allowed.has(range)) throw new Error(`Invalid range ${range}. Use ${[...allowed].join(', ')}.`);
  const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`);
  const d = (await res.json()) as { chart?: { result?: Array<{ meta?: { currency?: string; symbol?: string; regularMarketPrice?: number; previousClose?: number; fiftyTwoWeekHigh?: number; fiftyTwoWeekLow?: number; longName?: string; marketTime?: number }; timestamp?: number[]; indicators?: { quote?: Array<{ open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; close?: (number | null)[] }> } }> } };
  const r = d.chart?.result?.[0];
  if (!r?.meta?.symbol) throw new Error(`No quote for ${symbol}.`);
  const quote = r.indicators?.quote?.[0];
  const closes = quote?.close ?? [];
  const lastClose = [...closes].reverse().find((c): c is number => c != null);
  const prev = r.meta.previousClose;
  const change = lastClose != null && prev != null ? lastClose - prev : null;
  const pct = change != null && prev ? (change / prev) * 100 : null;
  return `${r.meta.longName ?? r.meta.symbol} (${r.meta.symbol})\nCurrency: ${r.meta.currency ?? '?'} | Range: ${range}\nPrice: ${r.meta.regularMarketPrice ?? lastClose ?? '?'}${change != null && pct != null ? ` (${change >= 0 ? '+' : ''}${change.toFixed(2)} / ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)` : ''}\nPrevious close: ${prev ?? '?'}\n52w range: ${r.meta.fiftyTwoWeekLow ?? '?'} - ${r.meta.fiftyTwoWeekHigh ?? '?'}\nLast trade: ${r.meta.marketTime ? new Date(r.meta.marketTime * 1000).toISOString() : '?'}`;
}

async function search(args: m0_SearchArgs): Promise<string> {
  const res = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(args.query)}&quotesCount=8&newsCount=0`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`);
  const d = (await res.json()) as { quotes?: Array<{ symbol?: string; shortname?: string; exchange?: string; quoteType?: string }> };
  const quotes = d.quotes ?? [];
  if (!quotes.length) return `No symbols matching "${args.query}".`;
  return `Symbols matching "${args.query}":\n` + quotes.slice(0, 8).map((q, i) => `${i + 1}. ${q.symbol ?? '?'} - ${q.shortname ?? '?'} (${q.exchange ?? '?'}, ${q.quoteType ?? '?'})`).join('\n');
}

return { quote, search };
})();

const m1 = (() => {
const UA = "mrfentmen-stock-quotes-mcp/1.0 (https://github.com/mrfentmen)"
class StockError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new StockError(`Market data error ${res.status}`)
  return (await res.json()) as T
}

async function quote(args: { symbol?: string; days?: number }): Promise<string> {
  const symbol = (args.symbol ?? "").trim().toUpperCase()
  if (!symbol) throw new StockError("Provide a stock symbol")
  const days = Math.min(Math.max(args.days ?? 10, 1), 365)
  const range = days <= 5 ? "5d" : days <= 30 ? "1mo" : days <= 90 ? "3mo" : "1y"
  const d = await get<any>(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`)
  const r = d.chart?.result?.[0]
  if (!r) throw new StockError(`No data for ${symbol}`)
  const meta = r.meta ?? {}
  const quotes = r.indicators?.quote?.[0] ?? {}
  const closes = (quotes.close ?? []).filter((v: number | null) => v != null).slice(-days)
  const latest = closes[closes.length - 1]
  const prev = closes[closes.length - 2]
  const change = latest !== undefined && prev !== undefined ? ((latest - prev) / prev) * 100 : null
  const times = (r.timestamp ?? []).slice(-Math.min(closes.length, 5)).map((t: number) => new Date(t * 1000).toISOString().slice(0, 10))
  const recent = closes.slice(-5).map((c: number, i: number) => `${times[i] ?? "?"}: ${c ?? "n/a"}`).join("\n")
  return `${meta.shortName ?? meta.symbol ?? symbol} (${meta.symbol ?? ""}) ${meta.currency ?? ""}\nLatest: ${latest ?? "n/a"}${change !== null ? ` (${change >= 0 ? "+" : ""}${change.toFixed(2)}% vs prior close)` : ""}\nRecent closes:\n${recent}`
}

async function searchSymbol(args: { query?: string }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new StockError("Provide a company name")
  const d = await get<any>(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`)
  const quotes = d.quotes ?? []
  return quotes.map((x: any) =>
    `${x.symbol ?? ""} | ${x.shortname ?? x.longname ?? ""} (${x.exchDisp ?? x.exchange ?? ""})`
  ).join("\n") || "No symbols found"
}

return { StockError, quote, searchSymbol };
})();

export const StockError = m1.StockError;
export const quote = m0.quote;
export const search = m0.search;
export const searchSymbol = m1.searchSymbol;
export const m0_quote = m0.quote;
export const m0_search = m0.search;
export const m1_quote = m1.quote;
export const m1_StockError = m1.StockError;
export const m1_searchSymbol = m1.searchSymbol;

const m2 = (() => {
const BASE2 = 'https://query1.finance.yahoo.com';
const UA2 = 'mrfentmen-yfinance-mcp/1.0';

async function get2<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA2, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new m1.StockError(`Market data error ${res.status}`);
  return (await res.json()) as T;
}

const clamp2 = (value: number | undefined, fallback: number, max = 25) =>
  Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);

interface ScreenerQuote {
  symbol?: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
}

async function movers(kind: 'day_gainers' | 'day_losers' | 'most_actives', limit: number): Promise<string> {
  const scrIds = kind === 'day_gainers' ? 'day_gainers' : kind === 'day_losers' ? 'day_losers' : 'most_actives';
  const titles: Record<string, string> = { day_gainers: 'Day gainers', day_losers: 'Day losers', most_actives: 'Most actives' };
  const d = await get2<{ finance?: { result?: { quotes?: ScreenerQuote[] }[] } }>(
    `${BASE2}/v1/finance/screener/predefined/saved?scrIds=${scrIds}&count=${limit}`);
  const list = (d.finance?.result?.[0]?.quotes ?? []).slice(0, limit);
  if (!list.length) return `No ${titles[kind].toLowerCase()} returned.`;
  return `${titles[kind]} (${list.length} shown):\n` + list.map((q, i) =>
    `${i + 1}. ${q.symbol ?? '?'} ${q.shortName ?? ''} $${q.regularMarketPrice ?? '?'} (${Number(q.regularMarketChangePercent ?? 0).toFixed(2)}%)`.trim()).join('\n');
}

async function gainers(args: { limit?: number }): Promise<string> {
  return movers('day_gainers', clamp2(args.limit, 10));
}

async function losers(args: { limit?: number }): Promise<string> {
  return movers('day_losers', clamp2(args.limit, 10));
}

async function actives(args: { limit?: number }): Promise<string> {
  return movers('most_actives', clamp2(args.limit, 10));
}

async function trending(args: { limit?: number }): Promise<string> {
  const limit = clamp2(args.limit, 10);
  const d = await get2<{ finance?: { result?: { quotes?: { symbol?: string }[] }[] } }>(
    'https://query2.finance.yahoo.com/v1/finance/trending/US?count=20');
  const symbols = (d.finance?.result?.[0]?.quotes ?? []).map((q) => q.symbol).filter(Boolean).slice(0, limit);
  if (!symbols.length) return 'No trending symbols returned.';
  return `Trending US tickers (${symbols.length} shown, use quote for prices):\n` + symbols.join(', ');
}

return { gainers, losers, actives, trending };
})();

export const gainers = m2.gainers;
export const losers = m2.losers;
export const actives = m2.actives;
export const trending = m2.trending;
// ---- batch-5 tools: dividend history, volume spikes, benchmark compare (2026-09-27) ----

const CHART_RANGES = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"] as const

const chartRange = (range?: string): string => {
  const wanted = String(range ?? "1y").trim()
  if (!(CHART_RANGES as readonly string[]).includes(wanted)) {
    throw new StockError(`Invalid range "${wanted}". Use one of: ${CHART_RANGES.join(", ")}.`)
  }
  return wanted
}

interface ChartDividend {
  date: number
  amount: number
}

interface ChartData {
  symbol: string
  name?: string
  currency?: string
  times: number[]
  closes: Array<number | null>
  volumes: Array<number | null>
  dividends: ChartDividend[]
}

/** One chart request against the v8 endpoint, which is the only Yahoo market endpoint that answers without a key. */
async function yahooChart(symbol: string, range: string, events?: string): Promise<ChartData> {
  const sym = String(symbol ?? "").trim().toUpperCase()
  if (!sym) throw new StockError("Provide a stock symbol like AAPL.")
  const query = `range=${range}&interval=1d${events ? `&events=${events}` : ""}`
  const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?${query}`, {
    headers: { "User-Agent": "mrfentmen-yfinance-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 404) throw new StockError(`Yahoo Finance has no data for ${sym}.`)
  if (!res.ok) throw new StockError(`Yahoo Finance returned ${res.status} for ${sym}.`)
  const d = (await res.json()) as {
    chart?: {
      result?: Array<{
        meta?: { symbol?: string; longName?: string; shortName?: string; currency?: string; regularMarketPrice?: number }
        timestamp?: number[]
        indicators?: { quote?: Array<{ close?: Array<number | null>; volume?: Array<number | null> }> }
        events?: { dividends?: Record<string, { amount?: number; date?: number }> }
      }>
    }
  }
  const r = d.chart?.result?.[0]
  if (!r?.meta?.symbol) throw new StockError(`No chart data for ${sym}.`)
  const series = r.indicators?.quote?.[0] ?? {}
  const dividends = Object.entries(r.events?.dividends ?? {})
    .map(([key, value]) => ({ date: Number(value?.date ?? key), amount: Number(value?.amount) }))
    .filter((entry) => Number.isFinite(entry.date) && Number.isFinite(entry.amount) && entry.amount > 0)
    .sort((a, b) => a.date - b.date)
  return {
    symbol: r.meta.symbol,
    name: r.meta.longName ?? r.meta.shortName,
    currency: r.meta.currency,
    times: r.timestamp ?? [],
    closes: series.close ?? [],
    volumes: series.volume ?? [],
    dividends,
  }
}

const dayOf = (unixSeconds: number) => new Date(unixSeconds * 1000).toISOString().slice(0, 10)

/**
 * Every dividend the chart range returned, the total paid per share, and a
 * year by year breakdown, so a yield argument can be checked against the
 * actual payments instead of a quoted number.
 */
export async function dividendHistory(args: { symbol?: string; range?: string }): Promise<string> {
  const range = chartRange(args.range)
  const data = await yahooChart(args.symbol ?? "", range, "div")
  const label = `${data.symbol}${data.name ? ` (${data.name})` : ""}${data.currency ? ` · ${data.currency}` : ""}`
  if (!data.dividends.length) {
    return `${label}: no dividend payments recorded in the last ${range}. The company may not pay a dividend, or try a longer range such as 5y or max.`
  }
  const perYear = new Map<string, { total: number; count: number }>()
  for (const entry of data.dividends) {
    const year = dayOf(entry.date).slice(0, 4)
    const current = perYear.get(year) ?? { total: 0, count: 0 }
    perYear.set(year, { total: current.total + entry.amount, count: current.count + 1 })
  }
  const years = [...perYear.keys()].sort()
  const total = data.dividends.reduce((sum, entry) => sum + entry.amount, 0)
  const latest = data.dividends[data.dividends.length - 1]
  const previous = data.dividends.length > 1 ? data.dividends[data.dividends.length - 2] : undefined
  const change =
    previous && previous.amount > 0 ? ((latest.amount - previous.amount) / previous.amount) * 100 : NaN

  return [
    `Dividend history — ${label}, range ${range}`,
    `  Payments: ${data.dividends.length} | total paid per share: ${total.toFixed(4)}`,
    `  Most recent: ${latest.amount.toFixed(4)} on ${dayOf(latest.date)}${Number.isFinite(change) ? ` (${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs the payment before)` : ""}`,
    "",
    "Paid per share, by calendar year:",
    ...years.map((year) => {
      const row = perYear.get(year)!
      return `  ${year}: ${row.total.toFixed(4)} across ${row.count} payment(s)`
    }),
    "",
    "The first and last year in a range are usually partial, so read the middle years as the real annual rate.",
  ].join("\n")
}

/**
 * Today's volume against the average of the days before it. A spike is how
 * news, an index rebalance or a squeeze shows up before the price story does.
 */
export async function volumeSpike(args: { symbol?: string; lookback?: number }): Promise<string> {
  const lookback = Math.min(Math.max(Math.trunc(Number(args.lookback) || 90), 5), 1000)
  const range =
    lookback <= 5 ? "5d" : lookback <= 21 ? "1mo" : lookback <= 63 ? "3mo" : lookback <= 126 ? "6mo" : lookback <= 250 ? "1y" : lookback <= 500 ? "2y" : "5y"
  const data = await yahooChart(args.symbol ?? "", range)
  const rows = data.times
    .map((time, index) => ({ time, close: data.closes[index], volume: data.volumes[index] }))
    .filter((row): row is { time: number; close: number | null; volume: number } => Number.isFinite(row.volume) && (row.volume ?? 0) > 0)
  if (rows.length < 5) throw new StockError(`Not enough trading days for ${data.symbol} in ${range}.`)
  const window = rows.slice(-lookback)
  const latest = window[window.length - 1]
  const baseline = window.slice(0, -1)
  const average = baseline.reduce((sum, row) => sum + row.volume, 0) / baseline.length
  const ratio = average > 0 ? latest.volume / average : NaN
  const previous = rows[rows.length - 2]
  const move =
    previous?.close != null && latest.close != null && previous.close !== 0
      ? ((latest.close - previous.close) / previous.close) * 100
      : NaN
  const verdict =
    !Number.isFinite(ratio)
      ? "no baseline"
      : ratio >= 3
        ? "unusual spike"
        : ratio >= 2
          ? "notable spike"
          : ratio >= 1.5
            ? "above normal"
            : ratio <= 0.5
              ? "unusually quiet"
              : "normal"
  const heaviest = [...window].sort((a, b) => b.volume - a.volume).slice(0, 3)

  return [
    `Volume check — ${data.symbol}${data.name ? ` (${data.name})` : ""}, ${window.length} trading day(s) of ${range}`,
    `  Latest (${dayOf(latest.time)}): ${latest.volume.toLocaleString()} shares${Number.isFinite(move) ? `, price ${move >= 0 ? "+" : ""}${move.toFixed(2)}% on the day` : ""}`,
    `  Average of the ${baseline.length} days before: ${Math.round(average).toLocaleString()} shares`,
    `  Latest vs that average: ${Number.isFinite(ratio) ? `${ratio.toFixed(2)}x → ${verdict}` : "n/a"}`,
    "",
    "Heaviest days in the window:",
    ...heaviest.map((row) => `  ${dayOf(row.time)} — ${row.volume.toLocaleString()} shares${row.close != null ? ` at ${row.close}` : ""}`),
    "",
    "Volume counts shares traded, not buyers, and a spike on a low average is easier to reach than one on a busy stock.",
  ].join("\n")
}

/**
 * Two to five symbols over the same range, ranked by percent return, with the
 * spread between the best and the worst.
 */
export async function benchmarkCompare(args: { symbols?: string[]; range?: string }): Promise<string> {
  const range = chartRange(args.range)
  const symbols = [...new Set((args.symbols ?? []).map((s) => String(s ?? "").trim().toUpperCase()).filter(Boolean))]
  if (symbols.length < 2) throw new StockError("Give at least two symbols to compare, e.g. ['AAPL', 'MSFT'].")
  if (symbols.length > 5) throw new StockError("Compare at most 5 symbols per call.")

  const rows: Array<{ symbol: string; name?: string; currency?: string; first: number; last: number; change: number; days: number }> = []
  const failed: string[] = []
  for (const symbol of symbols) {
    try {
      const data = await yahooChart(symbol, range)
      const closes = data.closes.filter((value): value is number => Number.isFinite(value))
      const first = closes[0]
      const last = closes[closes.length - 1]
      if (first == null || last == null || first === 0) throw new StockError("no usable closes")
      rows.push({
        symbol: data.symbol,
        name: data.name,
        currency: data.currency,
        first,
        last,
        change: ((last - first) / first) * 100,
        days: closes.length,
      })
    } catch (e) {
      failed.push(`${symbol}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  if (!rows.length) throw new StockError(`No chart data for any of: ${symbols.join(", ")}.`)
  rows.sort((a, b) => b.change - a.change)
  const spread = rows.length > 1 ? rows[0].change - rows[rows.length - 1].change : NaN

  return [
    `Benchmark compare over ${range} (percent return from the first close to the latest):`,
    "",
    ...rows.map((row, i) => {
      const move = row.change
      return `  ${i + 1}. ${row.symbol}${row.name ? ` (${row.name})` : ""} — ${move >= 0 ? "+" : ""}${move.toFixed(2)}% | ${row.first} → ${row.last}${row.currency ? ` ${row.currency}` : ""} over ${row.days} close(s)`
    }),
    "",
    Number.isFinite(spread) ? `Spread between best and worst: ${spread.toFixed(2)} percentage points.` : "",
    rows[0].change < 0 ? `Every symbol in this set is down over ${range}.` : `Best performer: ${rows[0].symbol}.`,
    failed.length ? `No data for: ${failed.join("; ")}` : "",
    "",
    "Returns cover the whole range only: dividends are not included, and a symbol with fewer closes was listed part way through it.",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
