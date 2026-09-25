export class DohError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DohError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

const PROVIDERS: Record<string, string> = {
  cloudflare: "https://cloudflare-dns.com/dns-query",
  google: "https://dns.google/resolve",
};

async function query(name: string, type: string, provider: string): Promise<string> {
  const base = PROVIDERS[provider] ?? PROVIDERS.cloudflare;
  const q = new URLSearchParams({ name, type });
  let res: Response;
  try {
    res = await fetch(`${base}?${q.toString()}`, {
      headers: { ...UA, Accept: "application/dns-json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new DohError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new DohError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 6000);
}

export function resolve(name: string, type?: string, provider?: string): Promise<string> {
  return query(name, (type ?? "A").toUpperCase(), (provider ?? "cloudflare").toLowerCase());
}

