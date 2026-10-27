export class K6Error extends Error {
  constructor(message: string) {
    super(message)
    this.name = "K6Error"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  return (process.env.K6_URL ?? "http://localhost:6565").replace(/\/$/, "");
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new K6Error(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new K6Error(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 8000);
}

export function getStatus(): Promise<string> {
  return get("/v1/status");
}

export function listMetrics(): Promise<string> {
  return get("/v1/metrics");
}

