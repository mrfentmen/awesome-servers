export class PostmarkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PostmarkError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.postmarkapp.com";

function headers(): Record<string, string> {
  const k = process.env.POSTMARK_SERVER_TOKEN;
  if (!k) throw new PostmarkError("Set POSTMARK_SERVER_TOKEN (free Postmark tier).");
  return { ...UA, Accept: "application/json", "X-Postmark-Server-Token": k };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new PostmarkError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new PostmarkError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function getServer(): Promise<string> {
  return get("/server");
}

export function listTemplates(count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 10) || 10, 100);
  return get(`/templates?count=${n}&offset=0`);
}

export function listOutbound(count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 10) || 10, 100);
  return get(`/messages/outbound?count=${n}&offset=0`);
}

