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



interface ORModel { id: string; name: string; context_length?: number; pricing?: { prompt?: string; completion?: string }; }

async function allModels(): Promise<ORModel[]> {
  const t = await listModelsRaw();
  try {
    const d = JSON.parse(t) as { data?: ORModel[] };
    return d.data ?? [];
  } catch {
    return [];
  }
}

async function listModelsRaw(): Promise<string> {
  return get("/models");
}

export async function getModel(modelId: string): Promise<string> {
  const items = await allModels();
  const m = items.find((x) => x.id === modelId);
  if (!m) throw new OpenRouterError(`Model not found: ${modelId}.`);
  return JSON.stringify(m, null, 2);
}

export async function searchModels(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  const q = query.toLowerCase();
  const items = await allModels();
  const hits = items.filter((m) => m.id.toLowerCase().includes(q) || (m.name ?? "").toLowerCase().includes(q)).slice(0, n);
  return JSON.stringify(hits.map((m) => ({ id: m.id, name: m.name })), null, 2);
}

export async function freeModels(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 50);
  const items = await allModels();
  const hits = items.filter((m) => m.id.endsWith(":free")).slice(0, n);
  return JSON.stringify(hits.map((m) => ({ id: m.id, name: m.name })), null, 2);
}

export async function longestContext(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  const items = await allModels();
  items.sort((a, b) => (b.context_length ?? 0) - (a.context_length ?? 0));
  return JSON.stringify(items.slice(0, n).map((m) => ({ id: m.id, context_length: m.context_length })), null, 2);
}

export function modelEndpoints(author: string, slug: string): Promise<string> {
  return get(`/models/${encodeURIComponent(author)}/${encodeURIComponent(slug)}/endpoints`);
}

export function generationStats(generationId: string): Promise<string> {
  return get(`/generation?id=${encodeURIComponent(generationId)}`);
}
