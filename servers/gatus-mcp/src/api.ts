export class GatusError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GatusError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.GATUS_URL;
  if (!b) throw new GatusError("Set GATUS_URL (your Gatus base URL).");
  return b.replace(/\/$/, "");
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new GatusError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new GatusError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listEndpoints(): Promise<string> {
  return get("/api/v1/endpoints");
}

export function getEndpointStatuses(key: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/api/v1/endpoints/${encodeURIComponent(key)}/statuses?page=1&pageSize=${n}`);
}

