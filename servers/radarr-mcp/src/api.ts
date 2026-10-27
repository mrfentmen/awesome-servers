export class RadarrError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RadarrError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.RADARR_URL;
  if (!b) throw new RadarrError("Set RADARR_URL (your Radarr base URL).");
  return b.replace(/\/$/, "");
}

function key(): string {
  const k = process.env.RADARR_API_KEY;
  if (!k) throw new RadarrError("Set RADARR_API_KEY (Settings > General).");
  return k;
}

async function get(path: string): Promise<string> {
  const sep = path.includes("?") ? "&" : "?";
  let res: Response;
  try {
    res = await fetch(`${base()}${path}${sep}apikey=${encodeURIComponent(key())}`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(30000),
    });
  } catch (e) {
    throw new RadarrError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new RadarrError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listMovies(): Promise<string> {
  return get("/api/v3/movie");
}

export function getQueue(): Promise<string> {
  return get("/api/v3/queue?page=1&pageSize=20&includeUnknownMovieItems=true");
}

export function getHealth(): Promise<string> {
  return get("/api/v3/health");
}

