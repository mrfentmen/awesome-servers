
export interface m0_ArtistArgs {
  name: string;
}

export interface m0_AlbumArgs {
  artist: string;
}

export interface m1_TrackArgs {
  id: number;
}

const m0 = (() => {
const BASE = 'https://www.theaudiodb.com/api/v1/json/2';



async function artist(args: m0_ArtistArgs): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) return 'Provide an artist name.';
  const res = await fetch(`${BASE}/search.php?s=${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': 'mrfentmen-theaudiodb-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`TheAudioDB returned ${res.status}`);
  const data = (await res.json()) as { artists?: Array<Record<string, unknown>> | null };
  const artists = (data.artists ?? []).slice(0, 5);
  if (!artists.length) return `No artist found for "${name}".`;
  return `Artists matching "${name}":\n` +
    artists
      .map((a, i) => {
        const formed = a.strFormedYear ? ` | formed ${a.strFormedYear}` : '';
        const genre = a.strGenre ? ` | ${a.strGenre}` : '';
        return `${i + 1}. ${a.strArtist ?? 'unknown'}${genre}${formed}\n   ${a.strBiographyEN ? String(a.strBiographyEN).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180) : ''}`;
      })
      .join('\n');
}

async function album(args: m0_AlbumArgs): Promise<string> {
  const artistName = (args.artist ?? '').trim();
  if (!artistName) return 'Provide an artist name.';
  const res = await fetch(`${BASE}/searchalbum.php?s=${encodeURIComponent(artistName)}`, {
    headers: { 'User-Agent': 'mrfentmen-theaudiodb-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`TheAudioDB returned ${res.status}`);
  const data = (await res.json()) as { album?: Array<Record<string, unknown>> | null };
  const albums = (data.album ?? []).slice(0, 20);
  if (!albums.length) return `No albums found for "${artistName}".`;
  return `Albums by ${artistName} (${albums.length} shown):\n` +
    albums
      .map((a, i) => `${i + 1}. ${a.strAlbum ?? 'untitled'} (${a.intYearReleased ?? a.intYearFormed ?? ''})`)
      .join('\n');
}

return { album, artist };
})();

const m1 = (() => {
const BASE = 'https://www.theaudiodb.com/api/v1/json/2/track.php';


async function track(args: m1_TrackArgs): Promise<string> {
  const id = Math.floor(args.id ?? 0);
  if (!id) return 'Provide a numeric track ID.';
  const res = await fetch(`${BASE}?m=${id}`, {
    headers: { 'User-Agent': 'mrfentmen-theaudiodb-track-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`TheAudioDB returned ${res.status}`);
  const data = (await res.json()) as { track?: Array<Record<string, unknown>> };
  const rows = data.track ?? [];
  if (!rows.length) return `No track found for ID ${id}.`;
  const t = rows[0];
  const str = (k: string) => (t[k] != null ? String(t[k]) : '');
  const parts = [
    str('strTrack'),
    str('strArtist') ? `by ${str('strArtist')}` : '',
    str('strAlbum') ? `album ${str('strAlbum')}` : '',
    str('intDuration') ? `${Math.round(Number(str('intDuration')) / 60)} min` : '',
  ].filter(Boolean);
  return parts.join(' | ') || `Track ${id}`;
}

return { track };
})();

export const album = m0.album;
export const artist = m0.artist;
export const track = m1.track;
export const m0_album = m0.album;
export const m0_artist = m0.artist;
export const m1_track = m1.track;
