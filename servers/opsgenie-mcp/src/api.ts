export class OpsgenieError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OpsgenieError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.OPSGENIE_API_KEY;
  if (!k) throw new OpsgenieError("Set OPSGENIE_API_KEY (free Opsgenie tier).");
  return { ...UA, Accept: "application/json", Authorization: `GenieKey ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.opsgenie.com/v2" + path, { headers: headers() });
  } catch (e) {
    throw new OpsgenieError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new OpsgenieError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listAlerts(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/alerts?limit=${n}`);
}

export function getAlert(alertId: string): Promise<string> {
  return get(`/alerts/${encodeURIComponent(alertId)}`);
}

export function listOnCalls(): Promise<string> {
  return get("/on-calls");
}

