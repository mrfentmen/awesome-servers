export class DirectusError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DirectusError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.DIRECTUS_URL;
  if (!b) throw new DirectusError("Set DIRECTUS_URL (your Directus base URL).");
  return b.replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const k = process.env.DIRECTUS_TOKEN;
  if (!k) throw new DirectusError("Set DIRECTUS_TOKEN (static token or OAuth token).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { headers: headers() });
  } catch (e) {
    throw new DirectusError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new DirectusError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listCollections(): Promise<string> {
  return get("/collections");
}

export function listUsers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/users?limit=${n}`);
}

