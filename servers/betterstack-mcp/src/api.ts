export class BetterStackError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BetterStackError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

const ENV = "BETTERSTACK_API_KEY";
const MISSING = "Set BETTERSTACK_API_KEY (free Better Stack tier).";
const BASE = "https://uptime.betterstack.com/api/v2";

function headers(): Record<string, string> {
  const k = process.env[ENV];
  if (!k) throw new BetterStackError(MISSING);
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: headers() });
  } catch (e) {
    throw new BetterStackError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new BetterStackError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listMonitors(): Promise<string> {
  return get("/monitors");
}

export function getMonitor(monitorId: string): Promise<string> {
  return get(`/monitors/${encodeURIComponent(monitorId)}`);
}

export function listIncidents(): Promise<string> {
  return get("/incidents");
}

