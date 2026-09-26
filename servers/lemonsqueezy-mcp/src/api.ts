export class LemonError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LemonError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.lemonsqueezy.com/v1";

function headers(): Record<string, string> {
  const k = process.env.LEMONSQUEEZY_API_KEY;
  if (!k) throw new LemonError("Set LEMONSQUEEZY_API_KEY (Lemon Squeezy test mode).");
  return { ...UA, Accept: "application/vnd.api+json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new LemonError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new LemonError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listStores(): Promise<string> {
  return get("/stores");
}

export function listProducts(storeId?: string): Promise<string> {
  const q = storeId ? `?filter[store_id]=${encodeURIComponent(storeId)}` : "";
  return get(`/products${q}`);
}

export function getProduct(productId: string): Promise<string> {
  return get(`/products/${encodeURIComponent(productId)}`);
}

