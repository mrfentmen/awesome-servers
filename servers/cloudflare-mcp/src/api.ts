export class CloudflareError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CloudflareError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.CLOUDFLARE_API_TOKEN;
  if (!k) throw new CloudflareError("Set CLOUDFLARE_API_TOKEN (Cloudflare API token).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.cloudflare.com/client/v4" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new CloudflareError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CloudflareError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listZones(): Promise<string> {
  return get("/zones?per_page=20");
}

export function listAccounts(): Promise<string> {
  return get("/accounts?per_page=20");
}

export function listDns(zoneId: string): Promise<string> {
  return get(`/zones/${encodeURIComponent(zoneId)}/dns_records?per_page=50`);
}

