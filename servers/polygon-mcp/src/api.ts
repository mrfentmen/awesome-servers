export class PolygonError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PolygonError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.POLYGON_API_KEY;
  if (!k) throw new PolygonError("Set POLYGON_API_KEY (free Polygon plan).");
  return k;
}

async function get(path: string): Promise<string> {
  const sep = path.includes("?") ? "&" : "?";
  let res: Response;
  try {
    res = await fetch(`https://api.polygon.io${path}${sep}apikey=${encodeURIComponent(key())}`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new PolygonError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new PolygonError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listTickers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/v3/reference/tickers?limit=${n}`);
}

export function getTicker(ticker: string): Promise<string> {
  return get(`/v3/reference/tickers/${encodeURIComponent(ticker.toUpperCase())}`);
}

export function prevClose(ticker: string): Promise<string> {
  return get(`/v2/aggs/ticker/${encodeURIComponent(ticker.toUpperCase())}/prev`);
}



export function aggregates(ticker: string, from: string, to: string): Promise<string> {
  return get(`/v2/aggs/ticker/${encodeURIComponent(ticker.toUpperCase())}/range/1/day/${encodeURIComponent(from)}/${encodeURIComponent(to)}?limit=30`);
}

export function groupedDaily(date: string): Promise<string> {
  return get(`/v2/aggs/grouped/locale/us/market/stocks/${encodeURIComponent(date)}`).then((t) => t.slice(0, 6000));
}

export function openClose(ticker: string, date: string): Promise<string> {
  return get(`/v1/open-close/${encodeURIComponent(ticker.toUpperCase())}/${encodeURIComponent(date)}`);
}

export function rsi(ticker: string): Promise<string> {
  return get(`/v1/indicators/rsi/${encodeURIComponent(ticker.toUpperCase())}?timespan=day&window=14&limit=5`);
}

export function macd(ticker: string): Promise<string> {
  return get(`/v1/indicators/macd/${encodeURIComponent(ticker.toUpperCase())}?limit=5`);
}

export function dividends(ticker?: string): Promise<string> {
  const q = ticker ? `?ticker=${encodeURIComponent(ticker.toUpperCase())}&limit=10` : "?limit=10";
  return get(`/v3/reference/dividends${q}`);
}

export function splits(ticker?: string): Promise<string> {
  const q = ticker ? `?ticker=${encodeURIComponent(ticker.toUpperCase())}&limit=10` : "?limit=10";
  return get(`/v3/reference/splits${q}`);
}

export function news(ticker: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 5) || 5, 20);
  return get(`/v2/reference/news?ticker=${encodeURIComponent(ticker.toUpperCase())}&limit=${n}`);
}

export function gainers(): Promise<string> {
  return get("/v2/snapshot/locale/us/markets/stocks/gainers").then((t) => t.slice(0, 6000));
}
