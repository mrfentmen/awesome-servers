export class BreweryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BreweryError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.openbrewerydb.org/v1";

async function req(path: string, params: Record<string, string | number | undefined>): Promise<string> {
  void params;
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new BreweryError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new BreweryError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

async function get(path: string): Promise<string> {
  return req(path, {});
}

export function searchBreweries(query: string, by?: string, limit?: string): Promise<string> {
  const field = (by ?? "name").toLowerCase();
  const allowed = ["name", "city", "state", "type"];
  const key = allowed.includes(field) ? `by_${field}` : "by_name";
  const p = new URLSearchParams({ [key]: query, per_page: limit ?? "10" });
  return get(`/breweries?${p.toString()}`);
}

export function getBrewery(id: string): Promise<string> {
  return get(`/breweries/${encodeURIComponent(id)}`);
}

export function randomBrewery(): Promise<string> {
  return get("/breweries/random?size=1");
}

