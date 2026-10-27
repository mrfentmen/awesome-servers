/**
 * Video game music database client — backed by the iTunes Catalog API.
 *
 * Why: the original VGMdb.info API went offline in 2024, and MusicBrainz
 * aggressively resets connections from automated IPs. The iTunes Catalog
 * API is free, needs no key, never fingerprints blocks, and catalogs
 * game soundtrack releases (Chrono Trigger OST, NieR, Undertale...) with
 * full tracklists and composers.
 */
const BASE = "https://itunes.apple.com";
export class VgmdbError extends Error {
}
async function apiGet(path, params) {
    const qs = new URLSearchParams(params);
    const res = await fetch(`${BASE}${path}?${qs}`, {
        headers: { Accept: "application/json", "User-Agent": "vgmdb-mcp/1.0" },
    });
    if (!res.ok) {
        throw new VgmdbError(`iTunes API error ${res.status}: ${res.statusText}`);
    }
    return (await res.json());
}
// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
export async function searchAlbums(query) {
    const data = await apiGet("/search", {
        term: query,
        entity: "album",
        limit: "12",
    });
    return (data.results ?? []).map(mapAlbum);
}
export async function getAlbum(id) {
    const data = await apiGet("/lookup", {
        id,
        entity: "song",
        limit: "200",
    });
    const album = data.results?.[0];
    if (!album || !album.collectionId)
        return null;
    return {
        id: album.collectionId,
        title: album.collectionName ?? "?",
        artist: album.artistName ?? "?",
        releaseDate: album.releaseDate?.slice(0, 10),
        genre: album.primaryGenreName,
        url: album.collectionViewUrl,
        artwork: album.artworkUrl100?.replace("100x100", "600x600"),
        tracks: (data.results ?? [])
            .filter((r) => r.wrapperType === "track")
            .map((t, i) => ({
            number: t.trackNumber ?? i + 1,
            title: t.trackName ?? "?",
            time: t.trackTimeMillis ? fmtLength(t.trackTimeMillis) : undefined,
            disc: t.discNumber && t.discCount > 1 ? t.discNumber : undefined,
        })),
    };
}
export async function searchArtists(query) {
    const data = await apiGet("/search", {
        term: query,
        entity: "musicArtist",
        limit: "10",
    });
    return (data.results ?? []).map((a) => ({
        id: a.artistId,
        name: a.artistName ?? "?",
        genre: a.primaryGenreName,
        url: a.artistLinkUrl,
    }));
}
export async function getArtist(id) {
    const data = await apiGet("/lookup", {
        id,
        entity: "album",
        limit: "25",
    });
    const artist = data.results?.[0];
    if (!artist || !artist.artistId)
        return null;
    return {
        id: artist.artistId,
        name: artist.artistName ?? "?",
        albums: (data.results ?? [])
            .filter((r) => r.wrapperType === "collection")
            .map(mapAlbum),
    };
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
function mapAlbum(a) {
    return {
        id: a.collectionId,
        title: a.collectionName ?? "?",
        artist: a.artistName ?? "?",
        releaseDate: a.releaseDate?.slice(0, 10),
        trackCount: a.trackCount,
        genre: a.primaryGenreName,
        url: a.collectionViewUrl,
        artwork: a.artworkUrl100?.replace("100x100", "600x600"),
    };
}
function fmtLength(ms) {
    const s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
}
export function formatAlbumSearch(a) {
    return (`[${a.id}] ${a.title} by ${a.artist}` +
        (a.releaseDate ? `\nReleased: ${a.releaseDate}` : "") +
        (a.trackCount ? ` | ${a.trackCount} tracks` : "") +
        (a.genre ? ` | ${a.genre}` : "") +
        (a.artwork ? `\nArtwork: ${a.artwork}` : "") +
        `\n${a.url ?? ""}`);
}
export function formatAlbumDetail(a) {
    const lines = [
        `[${a.id}] ${a.title} by ${a.artist}`,
        `Released: ${a.releaseDate ?? "?"}${a.genre ? ` | ${a.genre}` : ""}`,
        a.tracks.length ? `Tracks: ${a.tracks.length}` : "",
    ];
    if (a.tracks.length) {
        lines.push("\nTracklist:");
        for (const t of a.tracks) {
            const prefix = t.disc ? `D${t.disc}.` : "";
            lines.push(`  ${prefix}${String(t.number).padStart(2, "0")} ${t.title}${t.time ? `  [${t.time}]` : ""}`);
        }
    }
    if (a.url)
        lines.push(`\n${a.url}`);
    return lines.join("\n");
}
export function formatArtistSearch(a) {
    return (`[${a.id}] ${a.name}` +
        (a.genre ? ` — ${a.genre}` : "") +
        `\n${a.url ?? ""}`);
}
export function formatArtistDetail(a) {
    const lines = [`[${a.id}] ${a.name}`];
    if (a.albums.length) {
        lines.push(`\nAlbums (${a.albums.length}):`);
        for (const alb of a.albums.slice(0, 20)) {
            lines.push(`  • ${alb.title} (${alb.releaseDate ?? "?"}) — ${alb.trackCount ?? "?"} tracks — id ${alb.id}`);
        }
    }
    return lines.join("\n");
}
// ---- muxF tools:
const ITUNES = "https://itunes.apple.com";
async function itunes(params) {
    const qs = new URLSearchParams(params);
    const res = await fetch(`${ITUNES}/${params.path ?? 'search'}?${qs}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'vgmdb-mcp/1.0' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new VgmdbError(`iTunes API error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
function bound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
function clock(ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function median(values) {
    if (!values.length)
        return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function tally(map, cap) {
    if (!map.size)
        return 'not reported';
    return [...map.entries()]
        .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
        .slice(0, cap)
        .map(([k, n]) => `${k} ${n}`)
        .join(', ');
}
function num0(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
/** Find a track and the album it sits on, which the album and artist searches cannot do. */
export async function trackSearch(args) {
    const query = (args.query ?? '').trim();
    if (!query)
        return 'Provide a track name to look for.';
    const limit = bound(args.limit, 3, 25, 8);
    const data = await itunes({
        path: 'search',
        term: query,
        entity: 'song',
        limit: String(limit),
    });
    const tracks = (data.results ?? []).filter((r) => r.trackName);
    if (!tracks.length)
        return `The iTunes catalog holds no track matching "${query}".`;
    const albums = new Map();
    for (const t of tracks)
        if (t.collectionId)
            albums.set(t.collectionId, t.collectionName ?? 'album not reported');
    return [
        `Track matches for "${query}": ${tracks.length} shown of ${data.resultCount ?? tracks.length} the search reported`,
        ...tracks.map((t, i) => [
            `${i + 1}. ${t.trackName ?? 'title not reported'}`,
            `   by ${t.artistName ?? 'artist not reported'}`,
            `   on ${t.collectionName ?? 'album not reported'} (collection id ${t.collectionId ?? 'not reported'})`,
            `   track ${t.trackNumber ?? '?'}${t.discNumber ? `, disc ${t.discNumber}` : ''}, ${t.trackTimeMillis ? clock(Number(t.trackTimeMillis)) : 'length not reported'}`,
            `   ${String(t.releaseDate ?? '').slice(0, 10)} | ${t.primaryGenreName ?? 'genre not reported'} | ${t.trackExplicitness ?? 'explicitness not reported'}`,
        ].join('\n')),
        `Distinct albums behind these matches (${albums.size}): ${[...albums.entries()].slice(0, 8).map(([id, name]) => `${id} ${name}`).join('; ')}`,
        'Feed a collection id to get_album for the full tracklist, and an album id to album_census for the runtime shape.',
    ].join('\n');
}
const STOREFRONTS = [
    { code: 'us', name: 'United States' },
    { code: 'gb', name: 'United Kingdom' },
    { code: 'de', name: 'Germany' },
    { code: 'fr', name: 'France' },
    { code: 'jp', name: 'Japan' },
    { code: 'au', name: 'Australia' },
    { code: 'ca', name: 'Canada' },
    { code: 'br', name: 'Brazil' },
];
