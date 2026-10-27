export class GotifyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GotifyError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
function base(): string {
  const b = process.env.GOTIFY_BASE_URL;
  if (!b) throw new GotifyError("Set GOTIFY_BASE_URL (your Gotify server, e.g. https://push.example.com).");
  return b.replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const k = process.env.GOTIFY_TOKEN;
  if (!k) throw new GotifyError("Set GOTIFY_TOKEN (Gotify client token).");
  return { ...UA, Accept: "application/json", "X-Gotify-Key": k };
}

async function req(path: string, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: { ...headers(), ...(init.headers ?? {}) }, ...init });
  } catch (e) {
    throw new GotifyError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new GotifyError(`HTTP ${res.status}: ${body}`);
  }
  return res;
}

export function sendMessage(title: string, message: string, priority?: string): Promise<string> {
  return req("/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, message, priority: priority !== undefined ? Number(priority) : 5 }),
  }).then((r) => r.text()).then((t) => t.slice(0, 2000));
}

export function listMessages(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return req(`/message?limit=${n}`).then((r) => r.text()).then((t) => t.slice(0, 12000));
}

export function listApps(): Promise<string> {
  return req("/application").then((r) => r.text()).then((t) => t.slice(0, 8000));
}

