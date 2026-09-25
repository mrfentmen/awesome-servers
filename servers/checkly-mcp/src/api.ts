export class ChecklyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ChecklyError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

const ENV = "CHECKLY_API_KEY";
const MISSING = "Set CHECKLY_API_KEY (free Checkly tier).";
const BASE = "https://api.checklyhq.com/v1";

function headers(): Record<string, string> {
  const k = process.env[ENV];
  if (!k) throw new ChecklyError(MISSING);
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: headers() });
  } catch (e) {
    throw new ChecklyError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new ChecklyError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listChecks(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/checks?limit=${n}`);
}

export function getCheck(checkId: string): Promise<string> {
  return get(`/checks/${encodeURIComponent(checkId)}`);
}

export function listResults(checkId: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/check-results/${encodeURIComponent(checkId)}?limit=${n}`);
}

