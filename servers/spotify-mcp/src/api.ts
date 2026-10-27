export class SpotifyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SpotifyError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

let cached: { token: string; expiresAt: number } | null = null;

function creds(): { id: string; secret: string } {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new SpotifyError("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET (free Spotify app).");
  return { id, secret };
}

async function token(): Promise<string> {
  const { id, secret } = creds();
  if (cached && Date.now() < cached.expiresAt) return cached.token;
  let res: Response;
  try {
    res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new SpotifyError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new SpotifyError(`Token error HTTP ${res.status}: ${body}`);
  }
  const d = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!d.access_token) throw new SpotifyError("Token error: no access_token.");
  cached = { token: d.access_token, expiresAt: Date.now() + (d.expires_in ?? 3600) * 1000 - 60000 };
  return d.access_token;
}

async function get(path: string): Promise<string> {
  const t = await token();
  let res: Response;
  try {
    res = await fetch("https://api.spotify.com/v1" + path, {
      headers: { ...UA, Accept: "application/json", Authorization: `Bearer ${t}` },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new SpotifyError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new SpotifyError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function search(query: string, type?: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 5) || 5, 50);
  return get(`/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type ?? "track,artist,album")}&limit=${n}`);
}

export function getArtist(artistId: string): Promise<string> {
  return get(`/artists/${encodeURIComponent(artistId)}`);
}

export function getAlbum(albumId: string): Promise<string> {
  return get(`/albums/${encodeURIComponent(albumId)}`);
}



export function getTrack(trackId: string): Promise<string> {
  return get(`/tracks/${encodeURIComponent(trackId)}`);
}

export function artistTop(artistId: string): Promise<string> {
  return get(`/artists/${encodeURIComponent(artistId)}/top-tracks?market=US`);
}

export function artistAlbums(artistId: string): Promise<string> {
  return get(`/artists/${encodeURIComponent(artistId)}/albums?limit=10&market=US`);
}

export function newReleases(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  return get(`/browse/new-releases?limit=${n}`);
}

export function getEpisode(episodeId: string): Promise<string> {
  return get(`/episodes/${encodeURIComponent(episodeId)}?market=US`);
}

export function getShow(showId: string): Promise<string> {
  return get(`/shows/${encodeURIComponent(showId)}?market=US`);
}

export function browseCategories(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  return get(`/browse/categories?limit=${n}`);
}
