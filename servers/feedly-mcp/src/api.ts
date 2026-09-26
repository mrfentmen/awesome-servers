export class FeedlyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FeedlyError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.FEEDLY_TOKEN;
  if (!k) throw new FeedlyError("Set FEEDLY_TOKEN (Feedly developer token).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.feedly.com/v3" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new FeedlyError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new FeedlyError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function profile(): Promise<string> {
  return get("/profile");
}

export function subscriptions(): Promise<string> {
  return get("/subscriptions");
}

export function streamContents(streamId: string, count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 10) || 10, 100);
  return get(`/streams/${encodeURIComponent(streamId)}/contents?count=${n}`);
}

