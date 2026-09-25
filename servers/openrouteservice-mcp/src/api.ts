export class OrsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OrsError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.OPENROUTESERVICE_API_KEY;
  if (!k) throw new OrsError("Set OPENROUTESERVICE_API_KEY (free openrouteservice key).");
  return k;
}

async function get(path: string): Promise<string> {
  const sep = path.includes("?") ? "&" : "?";
  let res: Response;
  try {
    res = await fetch(`https://api.openrouteservice.org${path}${sep}api_key=${encodeURIComponent(key())}`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new OrsError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new OrsError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function geocode(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 5) || 5, 20);
  return get(`/geocode/search?text=${encodeURIComponent(query)}&size=${n}`);
}

export function reverse(lat: string, lon: string): Promise<string> {
  return get(`/geocode/reverse?point.lat=${encodeURIComponent(lat)}&point.lon=${encodeURIComponent(lon)}&size=1`);
}

export async function directions(fromLon: string, fromLat: string, toLon: string, toLat: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method: "POST",
      headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: key() },
      body: JSON.stringify({ coordinates: [[Number(fromLon), Number(fromLat)], [Number(toLon), Number(toLat)]] }),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new OrsError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new OrsError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 8000);
}
