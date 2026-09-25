export class JokeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "JokeError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://v2.jokeapi.dev" + path, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new JokeError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new JokeError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 2000);
}

export function getJoke(category?: string): Promise<string> {
  const c = category ?? "Any";
  return get(`/joke/${encodeURIComponent(c)}?safe-mode`);
}

export function listCategories(): Promise<string> {
  return get("/categories");
}

