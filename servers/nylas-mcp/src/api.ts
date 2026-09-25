export class NylasError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NylasError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.us.nylas.com/v3";

function headers(): Record<string, string> {
  const k = process.env.NYLAS_API_KEY;
  if (!k) throw new NylasError("Set NYLAS_API_KEY (free Nylas tier).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: headers() });
  } catch (e) {
    throw new NylasError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new NylasError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function getGrant(): Promise<string> {
  return get("/grants/me");
}

export function listCalendars(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/calendars?limit=${n}`);
}

export function listMessages(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/messages?limit=${n}`);
}

