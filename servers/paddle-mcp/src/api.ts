export class PaddleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PaddleError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "";

function base(): string {
  return (process.env.PADDLE_BASE_URL ?? "https://api.paddle.com").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const k = process.env.PADDLE_API_KEY;
  if (!k) throw new PaddleError("Set PADDLE_API_KEY (Paddle sandbox key).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new PaddleError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new PaddleError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listProducts(): Promise<string> {
  return get("/products");
}

export function getProduct(productId: string): Promise<string> {
  return get(`/products/${encodeURIComponent(productId)}`);
}

export function listPrices(productId?: string): Promise<string> {
  const q = productId ? `?product_id=${encodeURIComponent(productId)}` : "";
  return get(`/prices${q}`);
}

