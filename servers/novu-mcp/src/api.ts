export class NovuError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NovuError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  return (process.env.NOVU_BASE_URL ?? "https://api.novu.co/v1").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const k = process.env.NOVU_API_KEY;
  if (!k) throw new NovuError("Set NOVU_API_KEY (Novu dashboard).");
  return { ...UA, Accept: "application/json", Authorization: `ApiKey ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new NovuError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new NovuError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listSubscribers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/subscribers?page=0&limit=${n}`);
}

export function getSubscriber(subscriberId: string): Promise<string> {
  return get(`/subscribers/${encodeURIComponent(subscriberId)}`);
}

export function listTopics(): Promise<string> {
  return get("/topics?page=0&limit=20");
}

