const BASE = 'https://api.deezer.com/search';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide a search query.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const url = `${BASE}?q=${encodeURIComponent(q)}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-deezer-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Deezer returned ${res.status}`);
  const data = (await res.json()) as {
    total?: number;
    data?: Array<{
      title?: string;
      artist?: { name?: string };
      album?: { title?: string };
      duration?: number;
      link?: string;
    }>;
  };
  const tracks = (data.data ?? []).slice(0, limit);
  if (!tracks.length) return `No Deezer tracks for "${q}".`;
  return `Deezer tracks for "${q}" (${data.total ?? tracks.length} total, ${tracks.length} shown):\n` +
    tracks
      .map((t, i) => {
        const dur = t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')}` : '';
        return `${i + 1}. ${t.title ?? 'untitled'} | ${t.artist?.name ?? ''} | ${t.album?.title ?? ''} | ${dur}`;
      })
      .join('\n');
}

// ---- muxA tools:

const DEEZER = "https://api.deezer.com";

function clamp(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

async function deezerGet(path: string): Promise<any> {
  const res = await fetch(`${DEEZER}${path}`, {
    headers: { "User-Agent": "mrfentmen-deezer-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Deezer returned ${res.status}`);
  const d = (await res.json()) as any;
  if (d?.error) throw new Error(`Deezer: ${String(d.error.message ?? d.error.type ?? "error")}`);
  return d;
}

function clock(seconds: unknown): string {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return "unknown length";
  const m = Math.floor(n / 60);
  return `${m}:${String(n % 60).padStart(2, "0")}`;
}

export interface ArtistArgs {
  artist: string;
  limit?: number;
}

export interface TrackArgs {
  track_id: number;
}

export interface AlbumArgs {
  album_id: number;
  limit?: number;
}

export async function albumDetails(args: AlbumArgs): Promise<string> {
  const id = Number(args.album_id);
  if (!Number.isFinite(id) || id <= 0) throw new Error("Provide a Deezer album id, e.g. 302127.");
  const limit = clamp(args.limit, 20, 50);
  const a = await deezerGet(`/album/${id}`);
  const tracks = (a.tracks?.data ?? []) as Array<Record<string, any>>;
  const genres = (a.genres?.data ?? []) as Array<Record<string, any>>;
  const contributors = (a.contributors ?? []) as Array<Record<string, any>>;
  return [
    `${a.title ?? "?"} by ${a.artist?.name ?? "?"} (album id ${a.id})`,
    `Released ${a.release_date ?? "?"} on ${a.label ?? "an unlisted label"} | UPC ${a.upc ?? "not published"} | ${a.record_type ?? "?"}`,
    `${a.nb_tracks ?? tracks.length} track(s), ${clock(a.duration)} total, ${Number(a.fans ?? 0).toLocaleString("en-US")} fans`,
    `Explicit ${a.explicit_lyrics ? "yes" : "no"} | genres ${genres.length ? genres.map((g) => g.name).join(", ") : "not tagged"} | contributors ${contributors.length ? contributors.map((c) => c.name).join(", ") : "none listed"}`,
    "Tracklist:",
    ...tracks.slice(0, limit).map(
      (t, i) => `  ${i + 1}. ${t.title ?? "?"}${t.title_version ? ` (${t.title_version})` : ""} | ${clock(t.duration)} | track id ${t.id ?? "?"}`,
    ),
    tracks.length > limit ? `  plus ${tracks.length - limit} more tracks` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
