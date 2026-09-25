export class F1Error extends Error {
  constructor(message: string) {
    super(message)
    this.name = "F1Error"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.jolpi.ca/ergast/f1" + path, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new F1Error(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new F1Error(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function drivers(season?: string, limit?: string): Promise<string> {
  const s = season ?? "current";
  const n = Math.min(Number(limit ?? 10) || 10, 30);
  return get(`/${encodeURIComponent(s)}/driverStandings.json?limit=${n}`);
}

export function constructors(season?: string): Promise<string> {
  const s = season ?? "current";
  return get(`/${encodeURIComponent(s)}/constructorStandings.json`);
}

export function schedule(season?: string): Promise<string> {
  const s = season ?? "current";
  return get(`/${encodeURIComponent(s)}.json?limit=30`);
}

