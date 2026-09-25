export class NagerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NagerError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://date.nager.at/api/v3" + path, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new NagerError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new NagerError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listCountries(): Promise<string> {
  return get("/AvailableCountries");
}

export function getHolidays(year: string, country: string): Promise<string> {
  return get(`/PublicHolidays/${encodeURIComponent(year)}/${encodeURIComponent(country)}`);
}

export function nextHolidays(country: string): Promise<string> {
  return get(`/NextPublicHolidays/${encodeURIComponent(country)}`);
}

