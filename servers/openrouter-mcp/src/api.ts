export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OpenRouterError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) throw new OpenRouterError("Set OPENROUTER_API_KEY (free OpenRouter key).");
  return k;
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1" + path, {
      headers: { ...UA, Accept: "application/json", Authorization: `Bearer ${key()}` },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new OpenRouterError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new OpenRouterError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listModels(): Promise<string> {
  return get("/models").then((t) => {
    try {
      const d = JSON.parse(t) as { data?: Array<{ id: string; name: string }> };
      return JSON.stringify((d.data ?? []).slice(0, 50).map((m) => ({ id: m.id, name: m.name })), null, 2);
    } catch {
      return t.slice(0, 4000);
    }
  });
}

export function keyInfo(): Promise<string> {
  return get("/auth/key");
}

export function credits(): Promise<string> {
  return get("/credits");
}

