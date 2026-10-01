import { AdGuardError } from "./api.js"

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.ADGUARD_URL;
  if (!b) throw new AdGuardError("Set ADGUARD_URL (your AdGuard Home URL).");
  return b.replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { ...UA, Accept: "application/json" };
  const u = process.env.ADGUARD_USER;
  const p = process.env.ADGUARD_PASS;
  if (u && p) h.Authorization = `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;
  return h;
}

async function get(path: string, maxChars: number): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new AdGuardError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new AdGuardError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, maxChars);
}

export function getStatus(): Promise<string> {
  return get("/control/status", 2000);
}

export function getStats(): Promise<string> {
  return get("/control/stats", 4000);
}

export function getQueryLog(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/control/querylog?limit=${n}`, 12000);
}

