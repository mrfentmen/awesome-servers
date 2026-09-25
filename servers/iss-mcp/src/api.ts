export class IssError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "IssError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("http://api.open-notify.org" + path, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new IssError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new IssError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 4000);
}

export function now(): Promise<string> {
  return get("/iss-now.json");
}

export function crew(): Promise<string> {
  return get("/astros.json");
}

