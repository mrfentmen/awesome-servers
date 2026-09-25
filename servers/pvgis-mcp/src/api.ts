export class PvgisError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PvgisError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://re.jrc.ec.europa.eu/api/v5_3" + path, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(60000),
    });
  } catch (e) {
    throw new PvgisError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new PvgisError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 8000);
}

export function pvYield(lat: string, lon: string, peakpower?: string, loss?: string): Promise<string> {
  return get(`/PVcalc?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&peakpower=${encodeURIComponent(peakpower ?? "1")}&loss=${encodeURIComponent(loss ?? "14")}&outputformat=json`);
}

export function radiation(lat: string, lon: string): Promise<string> {
  return get(`/MRcalc?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&outputformat=json`);
}

