export class EpoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EpoError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

let cached: { token: string; expiresAt: number } | null = null;

function creds(): { key: string; secret: string } {
  const key = process.env.EPO_CONSUMER_KEY;
  const secret = process.env.EPO_CONSUMER_SECRET;
  if (!key || !secret) throw new EpoError("Set EPO_CONSUMER_KEY and EPO_CONSUMER_SECRET (free EPO registration).");
  return { key, secret };
}

async function token(): Promise<string> {
  const { key, secret } = creds();
  if (cached && Date.now() < cached.expiresAt) return cached.token;
  let res: Response;
  try {
    res = await fetch("https://ops.epo.org/3.2/auth/accesstoken", {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new EpoError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new EpoError(`Token error HTTP ${res.status}: ${body}`);
  }
  const d = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!d.access_token) throw new EpoError("Token error: no access_token.");
  cached = { token: d.access_token, expiresAt: Date.now() + (d.expires_in ?? 1200) * 1000 - 60000 };
  return d.access_token;
}

async function get(path: string): Promise<string> {
  const t = await token();
  let res: Response;
  try {
    res = await fetch("https://ops.epo.org/3.2/rest-services" + path, {
      headers: { ...UA, Accept: "application/json", Authorization: `Bearer ${t}` },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new EpoError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new EpoError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function search(query: string, range?: string): Promise<string> {
  const r = range ?? "1-10";
  return get(`/published-data/search?q=${encodeURIComponent(query)}&Range=${encodeURIComponent(r)}`);
}

export function family(country: string, number: string, kind: string): Promise<string> {
  return get(`/family/publication/docdb/${encodeURIComponent(country)}.${encodeURIComponent(number)}.${encodeURIComponent(kind)}/`);
}

