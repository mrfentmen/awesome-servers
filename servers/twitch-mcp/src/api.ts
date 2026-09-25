export class TwitchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TwitchError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const id = process.env.TWITCH_CLIENT_ID;
  const tok = process.env.TWITCH_TOKEN;
  if (!id || !tok) throw new TwitchError("Set TWITCH_CLIENT_ID and TWITCH_TOKEN (free Twitch app).");
  return { ...UA, Accept: "application/json", "Client-Id": id, Authorization: `Bearer ${tok}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.twitch.tv/helix" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new TwitchError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new TwitchError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function topGames(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/games/top?first=${n}`);
}

export function topStreams(limit?: string, gameId?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  let q = `/streams?first=${n}`;
  if (gameId) q += `&game_id=${encodeURIComponent(gameId)}`;
  return get(q);
}

export function searchChannels(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/search/channels?query=${encodeURIComponent(query)}&first=${n}`);
}

