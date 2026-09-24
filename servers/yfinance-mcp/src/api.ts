
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
