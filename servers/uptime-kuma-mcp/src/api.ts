export class KumaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "KumaError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.UPTIME_KUMA_URL;
  if (!b) throw new KumaError("Set UPTIME_KUMA_URL (your Uptime Kuma base URL).");
  return b.replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { ...UA, Accept: "application/json" };
  if (process.env.UPTIME_KUMA_TOKEN) h.Authorization = `Bearer ${process.env.UPTIME_KUMA_TOKEN}`;
  return h;
}

async function get(path: string, maxChars: number): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { headers: headers() });
  } catch (e) {
    throw new KumaError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new KumaError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, maxChars);
}

export function getStatus(): Promise<string> {
  return get("/api/status", 4000);
}

export function getMetrics(): Promise<string> {
  return get("/metrics", 12000);
}

