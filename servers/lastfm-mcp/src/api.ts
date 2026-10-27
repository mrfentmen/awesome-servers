export class LastfmError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LastfmError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.LASTFM_API_KEY;
  if (!k) throw new LastfmError("Set LASTFM_API_KEY (free Last.fm key).");
  return k;
}

async function call(params: Record<string, string>): Promise<string> {
  const q = new URLSearchParams({ ...params, api_key: key(), format: "json" });
  let res: Response;
  try {
    res = await fetch(`https://ws.audioscrobbler.com/2.0/?${q.toString()}`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new LastfmError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new LastfmError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function topArtists(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  return call({ method: "chart.gettopartists", limit: String(n) });
}

export function topTracks(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  return call({ method: "chart.gettoptracks", limit: String(n) });
}

export function artistInfo(artist: string): Promise<string> {
  return call({ method: "artist.getinfo", artist, autocorrect: "1" });
}

