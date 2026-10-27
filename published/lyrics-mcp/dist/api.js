const BASE = "https://api.lyrics.ovh/v1";
const UA = "mrfentmen-lyrics-mcp/1.0 (https://github.com/mrfentmen)";
export class LyricsError extends Error {
}
export async function getLyrics(args) {
    const artist = (args.artist ?? "").trim();
    const song = (args.song ?? "").trim();
    if (!artist || !song)
        throw new LyricsError("Provide both artist and song title");
    const res = await fetch(`${BASE}/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new LyricsError(`No lyrics found for ${artist} - ${song}`);
    if (!res.ok)
        throw new LyricsError(`Lyrics service error ${res.status}`);
    const d = await res.json();
    const lyrics = (d.lyrics ?? "").trim();
    if (!lyrics)
        throw new LyricsError("No lyrics returned");
    return `${artist} - ${song}\n\n${lyrics.slice(0, 5000)}`;
}
