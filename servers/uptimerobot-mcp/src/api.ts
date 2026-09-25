export class UptimeRobotError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UptimeRobotError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.UPTIMEROBOT_API_KEY;
  if (!k) throw new UptimeRobotError("Set UPTIMEROBOT_API_KEY (free UptimeRobot tier).");
  return k;
}

async function post(path: string, params: Record<string, string> = {}): Promise<string> {
  const body = new URLSearchParams({ api_key: key(), format: "json", ...params });
  let res: Response;
  try {
    res = await fetch("https://api.uptimerobot.com/v2" + path, {
      method: "POST",
      headers: { ...UA, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (e) {
    throw new UptimeRobotError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new UptimeRobotError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 12000);
}

export function listMonitors(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return post("/getMonitors", { limit: String(n) });
}

export function getMonitor(monitorId: string): Promise<string> {
  return post("/getMonitors", { monitors: monitorId, logs: "1", response_times: "1" });
}

export function getAccount(): Promise<string> {
  return post("/getAccountDetails");
}

