export class KongError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "KongError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  return (process.env.KONG_ADMIN_URL ?? "http://localhost:8001").replace(/\/$/, "");
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new KongError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new KongError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 8000);
}

export function getStatus(): Promise<string> {
  return get("/status");
}

export function listServices(): Promise<string> {
  return get("/services");
}

export function listRoutes(): Promise<string> {
  return get("/routes");
}

