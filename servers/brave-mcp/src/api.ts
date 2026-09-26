export class BraveError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BraveError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.BRAVE_API_KEY;
  if (!k) throw new BraveError("Set BRAVE_API_KEY (free Brave Search key).");
  return { ...UA, Accept: "application/json", "X-Subscription-Token": k };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.search.brave.com/res/v1" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new BraveError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new BraveError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function webSearch(query: string, count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 5) || 5, 20);
  return get(`/web/search?q=${encodeURIComponent(query)}&count=${n}`);
}

export function newsSearch(query: string, count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 5) || 5, 20);
  return get(`/news/search?q=${encodeURIComponent(query)}&count=${n}`);
}

