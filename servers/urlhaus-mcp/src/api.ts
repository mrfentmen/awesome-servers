export class UrlhausError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UrlhausError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://urlhaus-api.abuse.ch/v1";

async function req(path: string, params: Record<string, string | number | undefined>, text = false): Promise<string> {
  void params;
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: { ...UA, Accept: text ? "text/plain" : "application/json" } });
  } catch (e) {
    throw new UrlhausError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new UrlhausError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

function key(): string {
  const k = process.env.URLHAUS_AUTH_KEY;
  if (!k) throw new UrlhausError("Set URLHAUS_AUTH_KEY (free at abuse.ch).");
  return k;
}

async function post(path: string, body: Record<string, string>): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: "POST",
      headers: { ...UA, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded", "Auth-Key": key() },
      body: new URLSearchParams(body).toString(),
    });
  } catch (e) {
    throw new UrlhausError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new UrlhausError(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  return text;
}

export async function recentUrls(limit?: string): Promise<string> {
  const n = clampNum(limit, 10, 1000);
  let res: Response;
  try {
    res = await fetch(`${BASE}/urls/recent/limit/${n}/`, { headers: { ...UA, "Auth-Key": key() } });
  } catch (e) {
    throw new UrlhausError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new UrlhausError(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  return text;
}

export function lookupUrl(url: string): Promise<string> {
  return post("/url/", { url });
}

export function lookupPayload(sha256: string): Promise<string> {
  return post("/payload/", { sha256_hash: sha256 });
}

export function searchTag(tag: string, limit?: string): Promise<string> {
  return post("/tag/", { tag, limit: clampNum(limit, 10, 1000) });
}

function clampNum(v: string | undefined, d: number, m: number): string {
  const n = Math.min(Number(v ?? d) || d, m);
  return String(n);
}

