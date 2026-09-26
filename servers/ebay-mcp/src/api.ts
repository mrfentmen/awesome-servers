export class EbayError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EbayError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.EBAY_OAUTH_TOKEN;
  if (!k) throw new EbayError("Set EBAY_OAUTH_TOKEN (eBay OAuth user token).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}`, "X-EBAY-C-MARKETPLACE-ID": "EBAY_US" };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.ebay.com/buy/browse/v1" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new EbayError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new EbayError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function searchItems(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 200);
  return get(`/item_summary/search?q=${encodeURIComponent(query)}&limit=${n}`);
}

export function getItem(itemId: string): Promise<string> {
  return get(`/item/${encodeURIComponent(itemId)}`);
}

