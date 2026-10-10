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

// ---- muxH tools:
// Every tool above asks Spotify's API about an artist or a release, and Spotify
// answers with a name, an image and a follower count. These two ask two questions
// Spotify cannot answer at all, from two keyless services in the same domain:
// which artist a name actually refers to, and what is charting right now.

const SP_MB_UA = "mcfentmen-spotify-mcp/1.2 ( https://github.com/mcfentmen/spotify-mcp )";
const MB = "https://musicbrainz.org/ws/2";
const DEEZER = "https://api.deezer.com";

interface MbArtist {
  id?: string;
  name?: string;
  "sort-name"?: string;
  type?: string;
  country?: string;
  score?: number;
  disambiguation?: string;
  gender?: string;
  area?: { name?: string };
  "begin-area"?: { name?: string };
  "end-area"?: { name?: string };
  "life-span"?: { begin?: string | null; end?: string | null; ended?: boolean };
  aliases?: { name?: string; locale?: string | null; primary?: boolean | null; type?: string }[];
  tags?: { name?: string; count?: number }[];
}

interface MbReleaseGroup {
  id?: string;
  title?: string;
  "first-release-date"?: string;
  "primary-type"?: string;
  "secondary-types"?: string[];
  disambiguation?: string;
}

async function mbGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    // MusicBrainz asks every anonymous client for a descriptive User-Agent and
    // allows one request a second, so these calls are serialised by the caller.
    res = await fetch(`${MB}/${path}`, {
      headers: { "User-Agent": SP_MB_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new SpotifyError(`Could not reach MusicBrainz: ${(e as Error).message}`);
  }
  if (res.status === 503) {
    throw new SpotifyError("MusicBrainz is rate-limiting this client; it allows one anonymous request a second, so retry in a moment.");
  }
  if (!res.ok) throw new SpotifyError(`MusicBrainz returned HTTP ${res.status}.`);
  return (await res.json()) as T;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface DeezerChartTrack {
  id?: number; title?: string; title_version?: string; link?: string; duration?: number;
  rank?: number; explicit_lyrics?: boolean; preview?: string;
  artist?: { id?: number; name?: string; link?: string };
  album?: { id?: number; title?: string; link?: string; cover_medium?: string; release_date?: string };
}
interface DeezerChartAlbum {
  id?: number; title?: string; link?: string; record_type?: string; nb_tracks?: number;
  fans?: number; release_date?: string; duration?: number; explicit_lyrics?: boolean;
  artist?: { id?: number; name?: string; link?: string };
  cover_medium?: string;
}
interface DeezerChartArtist {
  id?: number; name?: string; link?: string; nb_album?: number; nb_fan?: number;
  radio?: boolean; tracklist?: string;
}

async function deezerGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${DEEZER}/${path}`, {
      headers: { "User-Agent": SP_MB_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new SpotifyError(`Could not reach Deezer: ${(e as Error).message}`);
  }
  if (!res.ok) throw new SpotifyError(`Deezer returned HTTP ${res.status}.`);
  const body = (await res.json()) as T & { error?: { message?: string; type?: string } };
  if (body?.error) throw new SpotifyError(`Deezer reported: ${body.error.message ?? body.error.type ?? "unknown error"}`);
  return body;
}

const mmss = (seconds?: number): string => {
  if (!seconds || !Number.isFinite(seconds)) return "not reported";
  const m = Math.floor(seconds / 60);
  return `${m}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
};

/**
 * Which artist a name actually refers to. MusicBrainz keeps the disambiguation
 * hint, the aliases, the life span and the begin area that decide whether a name
 * is one performer or thirty, which is the question behind every "is this the same
 * artist" mistake made against a streaming catalogue.
 */
export async function artistIdentity(args: { name: string; limit?: number }): Promise<string> {
  const name = String(args.name ?? "").trim();
  if (!name) throw new SpotifyError("Give an artist name to resolve, for example 'Radiohead' or 'Sade'.");
  const limit = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), 15);

  const found = await mbGet<{ count?: number; artists?: MbArtist[] }>(
    `artist?query=${encodeURIComponent(`artist:"${name}"`)}&fmt=json&limit=${limit}`,
  );
  const artists = found.artists ?? [];
  if (!artists.length) {
    return `MusicBrainz holds no artist matching "${name}". It indexes people, groups and ensembles; try a shorter or differently spelled name.`;
  }

  const lines: string[] = [];
  const chosen = artists[0];
  if (chosen.id) {
    const full = await mbGet<MbArtist>(`artist/${chosen.id}?fmt=json&inc=aliases%2Btags`);
    await pause(1100);
    const groups = await mbGet<{
      "release-group-count"?: number;
      "release-groups"?: MbReleaseGroup[];
    }>(`release-group?artist=${chosen.id}&fmt=json&limit=100`);
    const span = full["life-span"] ?? {};
    const tags = (full.tags ?? []).filter((t) => (t.count ?? 0) >= 2).slice(0, 10);
    const types = new Map<string, number>();
    for (const g of groups["release-groups"] ?? []) {
      const key = g["primary-type"] ?? "not classified";
      types.set(key, (types.get(key) ?? 0) + 1);
    }
    const dated = (groups["release-groups"] ?? [])
      .map((g) => String(g["first-release-date"] ?? "").slice(0, 4))
      .filter((y) => /^\d{4}$/.test(y))
      .sort();

    lines.push(`MusicBrainz identity for "${name}"`);
    lines.push(`  resolved to: ${full.name ?? chosen.name} (${full.type ?? "type not reported"}${full.country ? `, ${full.country}` : ""})`);
    lines.push(`  MusicBrainz id: ${full.id ?? chosen.id}`);
    lines.push(`  disambiguation: ${full.disambiguation || "none recorded"}`);
    lines.push(`  active: ${span.begin ?? "begin not recorded"}${span.ended ? ` to ${span.end ?? "?"}` : " to present"}`);
    if (full["begin-area"]?.name) lines.push(`  began in: ${full["begin-area"].name}`);
    if (full["end-area"]?.name) lines.push(`  ended in: ${full["end-area"].name}`);
    if (full.gender) lines.push(`  gender: ${full.gender}`);
    lines.push(`  release groups: ${(groups["release-group-count"] ?? 0).toLocaleString()}${types.size ? ` — ${[...types.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${n} ${t.toLowerCase()}`).join(", ")}` : ""}`);
    if (dated.length) lines.push(`  first release ${dated[0]}, most recent ${dated[dated.length - 1]}`);
    if (tags.length) lines.push(`  tags: ${tags.map((t) => `${t.name} (${t.count})`).join(", ")}`);
    const aliases = (full.aliases ?? []).filter((a) => a.name);
    if (aliases.length) {
      lines.push(`  ${aliases.length} alias(es): ${aliases.slice(0, 12).map((a) => `${a.name}${a.locale ? ` [${a.locale}]` : ""}`).join(", ")}`);
    }
    lines.push("");
  }

  if (artists.length > 1) {
    lines.push(`Other MusicBrainz entries for the same name (${artists.length} matched, so a name is not a unique key):`);
    for (const a of artists.slice(1, limit)) {
      const span = a["life-span"] ?? {};
      lines.push(
        `  - ${a.name} (${a.type ?? "?"}${a.country ? `, ${a.country}` : ""}) ${span.begin ?? "?"}${span.ended ? `-${span.end ?? "?"}` : "present"}` +
          `${a.disambiguation ? ` — ${a.disambiguation}` : ""} [score ${a.score ?? 0}, id ${a.id}]`,
      );
    }
  }

  lines.push("");
  lines.push("Read this before merging any two artists: MusicBrainz identifiers are the join key, and a name is not. The counts above come from MusicBrainz's release-group index, which groups a release rather than counting physical or digital copies.");
  return lines.join("\n");
}

/**
 * What is charting, editorially rather than by play count. Spotify's Web API
 * exposes no trending endpoint to a client-credentials app, so this reads the
 * service that does publish one, alongside the album and artist charts.
 */
export async function musicCharts(args: { kind?: string; limit?: number; genre?: string }): Promise<string> {
  const kindInput = String(args.kind ?? "tracks").trim().toLowerCase();
  const kinds: string[] = ["tracks", "albums", "artists"].includes(kindInput) ? [kindInput] : ["tracks", "albums", "artists"];
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 50);
  const genre = String(args.genre ?? "").trim();
  const charts: string[] = [];
  let chartedTracks: DeezerChartTrack[] = [];

  for (const kind of kinds) {
    const query = genre ? `?limit=${limit}&genre=${encodeURIComponent(genre)}` : `?limit=${limit}`;
    const payload = await deezerGet<{ data?: unknown[] }>(`chart/0/${kind}${query}`);
    const rows = payload.data ?? [];
    charts.push(`Deezer ${kind} chart${genre ? `, genre "${genre}"` : ""} — ${rows.length} entry(ies) returned:`);
    if (!rows.length) {
      charts.push("  no entries for this selection");
    } else if (kind === "tracks") {
      const tracks = rows as DeezerChartTrack[];
      chartedTracks = tracks;
      charts.push(
        ...tracks.map((t, i) =>
          `  ${String(i + 1).padStart(2)}. ${t.title}${t.title_version ? ` (${t.title_version})` : ""} — ${t.artist?.name ?? "artist not reported"}` +
            `\n      ${mmss(t.duration)} | rank ${t.rank ?? "not reported"} | ${t.explicit_lyrics ? "explicit" : "clean"} | ${t.preview ? "30s preview available" : "no preview"} | ${t.link ?? ""}`,
        ),
      );
    } else if (kind === "albums") {
      const albums = rows as DeezerChartAlbum[];
      charts.push(
        ...albums.map((a, i) =>
          `  ${String(i + 1).padStart(2)}. ${a.title} — ${a.artist?.name ?? "artist not reported"}` +
            `\n      ${a.record_type ?? "type not reported"} | released ${a.release_date ?? "not reported"} | ${a.nb_tracks ?? "?"} track(s) | ${mmss(a.duration)} | ${a.fans ?? "?"} fan(s)${a.explicit_lyrics ? " | explicit" : ""}`,
        ),
      );
    } else {
      const artists = rows as DeezerChartArtist[];
      charts.push(
        ...artists.map((a, i) =>
          `  ${String(i + 1).padStart(2)}. ${a.name}` +
            `\n      album count ${a.nb_album ?? "not published in this chart"} | fan count ${a.nb_fan === undefined ? "not published in this chart" : a.nb_fan.toLocaleString()}` +
            ` | ${a.radio ? "has a Deezer radio station" : "no radio station"} | id ${a.id}`,
        ),
      );
    }
    charts.push("");
  }

  const flags = chartedTracks.filter((t) => t.explicit_lyrics).length;
  charts.push(
    chartedTracks.length
      ? `${flags} of ${chartedTracks.length} charted track(s) carry explicit lyrics.`
      : "Explicit flags are reported where the chart publishes them.",
  );
  charts.push(
    "Deezer's top chart is editorial: it is a curated selection, not a play-count leaderboard, so it will not match any streaming count. Chart position is a snapshot of one request and will have moved by the time you read this.",
  );
  return charts.join("\n");
}
