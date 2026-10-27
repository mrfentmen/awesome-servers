export class RaindropError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RaindropError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.RAINDROP_TOKEN;
  if (!k) throw new RaindropError("Set RAINDROP_TOKEN (Raindrop integrations).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.raindrop.io/rest/v1" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new RaindropError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new RaindropError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function user(): Promise<string> {
  return get("/user");
}

export function collections(): Promise<string> {
  return get("/collections");
}

export function raindrops(collectionId: string): Promise<string> {
  return get(`/raindrops/${encodeURIComponent(collectionId)}?perpage=20`);
}

