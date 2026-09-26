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

