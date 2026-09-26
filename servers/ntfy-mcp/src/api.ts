export class NtfyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NtfyError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  return (process.env.NTFY_BASE_URL ?? "https://ntfy.sh").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { ...UA, Accept: "application/json" };
  if (process.env.NTFY_TOKEN) h.Authorization = `Bearer ${process.env.NTFY_TOKEN}`;
  return h;
}

async function call(topic: string, method: string, body?: string, query = ""): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${base()}/${encodeURIComponent(topic)}${query}`, {
      method,
      headers: { ...headers(), ...(method === "POST" ? { Title: "MCP" } : {}) },
      body,
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new NtfyError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 8000);
}

export function publish(topic: string, message: string): Promise<string> {
  return call(topic, "POST", message);
}

export function poll(topic: string): Promise<string> {
  return call(topic, "GET", undefined, "/json?poll=1");
}

