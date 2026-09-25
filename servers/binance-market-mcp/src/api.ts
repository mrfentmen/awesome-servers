const BASE = "https://data-api.binance.vision/api/v3"
const UA = "mrfentmen-binance-market-mcp/1.0 (https://github.com/mrfentmen)"
export class BinanceError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new BinanceError("Binance rate limit hit, wait and retry")
  if (!res.ok) throw new BinanceError(`Binance error ${res.status}`)
  return (await res.json()) as T
}

const VALID = /^[A-Z0-9]{4,20}$/

export async function ticker(args: { symbol?: string }): Promise<string> {
  const symbol = (args.symbol ?? "").trim().toUpperCase()
  if (!VALID.test(symbol)) throw new BinanceError("Provide a symbol like BTCUSDT")
  const t = await get<Record<string, unknown>>(`${BASE}/ticker/24hr?symbol=${encodeURIComponent(symbol)}`)
  if (t?.code) throw new BinanceError(`Binance: ${String(t.msg ?? "invalid symbol")}`)
  const change = Number(t?.priceChangePercent ?? 0)
  return `${symbol} 24h:\nPrice: ${Number(t?.lastPrice ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 })}\nChange: ${change.toFixed(2)}% (${Number(t?.priceChange ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 })})\nHigh: ${t?.highPrice ?? "n/a"} | Low: ${t?.lowPrice ?? "n/a"}\nVolume: ${Number(t?.volume ?? 0).toLocaleString()} ${symbol.replace(/USDT$/, "")}`
}

export async function klines(args: { symbol?: string; interval?: string; limit?: number }): Promise<string> {
  const symbol = (args.symbol ?? "").trim().toUpperCase()
  if (!VALID.test(symbol)) throw new BinanceError("Provide a symbol like BTCUSDT")
  const interval = (args.interval ?? "1d").toLowerCase()
  if (!["1m", "5m", "15m", "1h", "4h", "1d", "1w"].includes(interval)) throw new BinanceError("Interval must be 1m, 5m, 15m, 1h, 4h, 1d, or 1w")
  const limit = Math.min(args.limit ?? 7, 100)
  const d = await get<any[]>(`${BASE}/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`)
  if (!Array.isArray(d)) throw new BinanceError(`Binance: ${(d as any)?.msg ?? "invalid symbol"}`)
  return d.map((k: any) => {
    const date = new Date(k[0]).toISOString().slice(0, 10)
    return `${date} | O ${Number(k[1]).toFixed(2)} H ${Number(k[2]).toFixed(2)} L ${Number(k[3]).toFixed(2)} C ${Number(k[4]).toFixed(2)}`
  }).join("\n")
}

export async function price(args: { symbol?: string }): Promise<string> {
  const symbol = (args.symbol ?? "").trim().toUpperCase()
  if (!VALID.test(symbol)) throw new BinanceError("Provide a symbol like BTCUSDT")
  const d = await get<Record<string, unknown>>(`${BASE}/ticker/price?symbol=${encodeURIComponent(symbol)}`)
  if (d?.code) throw new BinanceError(`Binance: ${String(d.msg ?? "invalid symbol")}`)
  return `${symbol}: ${Number(d.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 })}`
}

export async function book(args: { symbol?: string }): Promise<string> {
  const symbol = (args.symbol ?? "").trim().toUpperCase()
  if (!VALID.test(symbol)) throw new BinanceError("Provide a symbol like BTCUSDT")
  const d = await get<Record<string, unknown>>(`${BASE}/ticker/bookTicker?symbol=${encodeURIComponent(symbol)}`)
  if (d?.code) throw new BinanceError(`Binance: ${String(d.msg ?? "invalid symbol")}`)
  return `${symbol} best bid/ask:\nBid: ${d.bidPrice ?? 'n/a'} x ${d.bidQty ?? 'n/a'}\nAsk: ${d.askPrice ?? 'n/a'} x ${d.askQty ?? 'n/a'}`;
}

export async function avg(args: { symbol?: string }): Promise<string> {
  const symbol = (args.symbol ?? "").trim().toUpperCase()
  if (!VALID.test(symbol)) throw new BinanceError("Provide a symbol like BTCUSDT")
  const d = await get<Record<string, unknown>>(`${BASE}/avgPrice?symbol=${encodeURIComponent(symbol)}`)
  if (d?.code) throw new BinanceError(`Binance: ${String(d.msg ?? "invalid symbol")}`)
  return `${symbol} 5-minute average price: ${Number(d.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 })} (interval ${d.mins ?? 5} min)`;
}

export async function depth(args: { symbol?: string; limit?: number }): Promise<string> {
  const symbol = (args.symbol ?? "").trim().toUpperCase()
  if (!VALID.test(symbol)) throw new BinanceError("Provide a symbol like BTCUSDT")
  const limit = Math.min(Math.max(args.limit ?? 5, 1), 20)
  const d = await get<{ bids?: string[][]; asks?: string[][]; code?: number; msg?: string }>(`${BASE}/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`)
  if (d?.code) throw new BinanceError(`Binance: ${String(d.msg ?? "invalid symbol")}`)
  const fmt = (rows: string[][] | undefined) => (rows ?? []).map((r) => `${r[0]} x ${r[1]}`).join(', ');
  return `${symbol} order book (top ${limit}):\nBids: ${fmt(d.bids)}\nAsks: ${fmt(d.asks)}`;
}

export async function markets(): Promise<string> {
  const d = await get<{ symbols?: { symbol?: string; status?: string }[] }>(`${BASE}/exchangeInfo`)
  const symbols = d.symbols ?? [];
  const trading = symbols.filter((s) => s.status === 'TRADING').length;
  const sample = symbols.slice(0, 12).map((s) => s.symbol).join(', ');
  return `Binance lists ${symbols.length} symbols (${trading} TRADING). Sample: ${sample}. Full list omitted for size.`;
}
