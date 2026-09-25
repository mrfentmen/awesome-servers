export class NonprofitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NonprofitError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://projects.propublica.org/nonprofits/api/v2" + path, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new NonprofitError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new NonprofitError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function search(query: string): Promise<string> {
  return get(`/search.json?q=${encodeURIComponent(query)}`);
}

export function details(ein: string): Promise<string> {
  const e = ein.replace(/-/g, "");
  return get(`/organizations/${encodeURIComponent(e)}.json`);
}

