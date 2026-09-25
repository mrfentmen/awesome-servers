export class StatpingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StatpingError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.STATPING_URL;
  if (!b) throw new StatpingError("Set STATPING_URL (your Statping base URL).");
  return b.replace(/\/$/, "");
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new StatpingError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new StatpingError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 8000);
}

export function listServices(): Promise<string> {
  return get("/api/services");
}

export function getService(serviceId: string): Promise<string> {
  return get(`/api/services/${encodeURIComponent(serviceId)}`);
}

