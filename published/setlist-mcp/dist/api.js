/**
 * Minimal Setlist.fm REST API v1.0 client.
 *
 * Docs: https://api.setlist.fm/docs/1.0/index.html
 * Requires a free API key (https://www.setlist.fm/settings/api) in the
 * SETLISTFM_API_KEY env var.
 */
const BASE = "https://api.setlist.fm/rest/1.0";
export class SetlistApiError extends Error {
}
function apiKey() {
    const key = process.env.SETLISTFM_API_KEY;
    if (!key) {
        throw new SetlistApiError("SETLISTFM_API_KEY env var is missing. Get a free key at " +
            "https://www.setlist.fm/settings/api and export it before " +
            "starting this server.");
    }
    return key;
}
async function get(path) {
    const key = apiKey();
    const res = await fetch(`${BASE}${path}`, {
        headers: {
            Accept: "application/json",
            "x-api-key": key,
        },
    });
    if (!res.ok) {
        throw new SetlistApiError(`Setlist.fm API error ${res.status}: ${res.statusText}`);
    }
    return (await res.json());
}
export async function searchArtists(name) {
    const data = await get(`/search/artists?artistName=${encodeURIComponent(name)}&p=1&sort=sortName`);
    return data.artist ?? [];
}
export async function getArtistByMbid(mbid) {
    return await get(`/artist/${mbid}`);
}
export async function getSetlists(artistMbid, page = 1, year) {
    const yearParam = year ? `&year=${year}` : "";
    return await get(`/artist/${artistMbid}/setlists?p=${page}${yearParam}`);
}
export async function getSetlist(id) {
    return await get(`/setlist/${id}`);
}
/** Search setlists containing a specific song, used to count live plays. */
export async function searchSetlistsBySong(artistMbid, songName, page = 1) {
    return await get(`/search/setlists?artistMbid=${artistMbid}&songName=${encodeURIComponent(songName)}&p=${page}`);
}
export function formatSetlist(s) {
    const city = s.venue?.city
        ? `${s.venue.city.name}${s.venue.city.country ? ", " + s.venue.city.country.name : ""}`
        : "unknown city";
    const venue = s.venue?.name ?? "unknown venue";
    const tour = s.tour ? ` (${s.tour.name} tour)` : "";
    const songs = s.sets?.set
        ?.flatMap((set) => set.song)
        .map((song, i) => `${i + 1}. ${song.name}${song.info ? ` [${song.info}]` : ""}`)
        .join("\n") ?? "no setlist data";
    return (`Setlist ${s.id} — ${s.eventDate} @ ${venue}, ${city}${tour}\n` +
        `URL: ${s.url}\n${songs}`);
}
