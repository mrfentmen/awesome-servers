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

let cachedToken: { token: string; expiresAt: number } | null = null;

function creds(): { id: string; secret: string } {
  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  if (!id || !secret) throw new TwitchError("Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET (free Twitch app).");
  return { id, secret };
}

async function appToken(): Promise<{ id: string; token: string }> {
  const { id, secret } = creds();
  if (cachedToken && Date.now() < cachedToken.expiresAt) return { id, token: cachedToken.token };
  let res: Response;
  try {
    res = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: "client_credentials" }).toString(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new TwitchError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new TwitchError(`Token error HTTP ${res.status}: ${body}`);
  }
  const d = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!d.access_token) throw new TwitchError("Token error: no access_token returned.");
  cachedToken = { token: d.access_token, expiresAt: Date.now() + (d.expires_in ?? 3600) * 1000 - 60000 };
  return { id, token: d.access_token };
}

async function get(path: string): Promise<string> {
  const { id, token } = await appToken();
  let res: Response;
  try {
    res = await fetch("https://api.twitch.tv/helix" + path, {
      headers: { ...UA, Accept: "application/json", "Client-Id": id, Authorization: `Bearer ${token}` },
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

export function getUser(login: string): Promise<string> {
  return get(`/users?login=${encodeURIComponent(login)}`);
}

export function searchChannels(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/search/channels?query=${encodeURIComponent(query)}&first=${n}`);
}

