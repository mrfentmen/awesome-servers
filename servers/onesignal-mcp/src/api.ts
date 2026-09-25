export class OneSignalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OneSignalError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.onesignal.com";

function userHeaders(): Record<string, string> {
  const k = process.env.ONESIGNAL_USER_KEY;
  if (!k) throw new OneSignalError("Set ONESIGNAL_USER_KEY (free OneSignal tier).");
  return { ...UA, Accept: "application/json", Authorization: `Basic ${k}` };
}

function appHeaders(): Record<string, string> {
  const k = process.env.ONESIGNAL_APP_KEY;
  if (!k) throw new OneSignalError("Set ONESIGNAL_APP_KEY (OneSignal app REST API key).");
  return { ...UA, Accept: "application/json", Authorization: `Basic ${k}` };
}

async function get(path: string, headers: Record<string, string>): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers });
  } catch (e) {
    throw new OneSignalError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new OneSignalError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listApps(): Promise<string> {
  return get("/apps", userHeaders());
}

export function getApp(appId: string): Promise<string> {
  return get(`/apps/${encodeURIComponent(appId)}`, userHeaders());
}

export function listNotifications(appId: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  return get(`/notifications?app_id=${encodeURIComponent(appId)}&limit=${n}`, appHeaders());
}

