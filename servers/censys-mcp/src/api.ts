export class CensysError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CensysError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://search.censys.io/api/v2";

function headers(): Record<string, string> {
  const id = process.env.CENSYS_API_ID;
  const secret = process.env.CENSYS_API_SECRET;
  if (!id || !secret) throw new CensysError("Set CENSYS_API_ID and CENSYS_API_SECRET (free Censys tier).");
  const b64 = typeof Buffer !== "undefined" ? Buffer.from(`${id}:${secret}`).toString("base64") : btoa(`${id}:${secret}`);
  return { ...UA, Accept: "application/json", Authorization: "Basic " + b64 };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new CensysError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CensysError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function getHost(ip: string): Promise<string> {
  return get(`/hosts/${encodeURIComponent(ip)}`);
}

export function searchHosts(query: string, perPage?: string): Promise<string> {
  const n = Math.min(Number(perPage ?? 10) || 10, 100);
  return get(`/hosts/search?q=${encodeURIComponent(query)}&per_page=${n}`);
}

