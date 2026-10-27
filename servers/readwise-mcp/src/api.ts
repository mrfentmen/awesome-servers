export class ReadwiseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ReadwiseError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.READWISE_TOKEN;
  if (!k) throw new ReadwiseError("Set READWISE_TOKEN (Readwise access token).");
  return { ...UA, Accept: "application/json", Authorization: `Token ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://readwise.io/api/v2" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new ReadwiseError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new ReadwiseError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function auth(): Promise<string> {
  return get("/auth/").then((t) => (t.trim() === "" ? "Authenticated (204)." : t.slice(0, 1000)));
}

export function listBooks(): Promise<string> {
  return get("/books/?page_size=20");
}

export function listHighlights(): Promise<string> {
  return get("/highlights/?page_size=10");
}

