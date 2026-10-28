const BASE = "https://musicbrainz.org/ws/2";
const headers = { Accept: "application/json", "User-Agent": "mrfentmen-musicbrainz-mcp/1.0 (https://github.com/mrfentmen)" };
let last = 0;
let queue = Promise.resolve();
export class MusicBrainzError extends Error {
}
async function waitTurn() { const delay = Math.max(0, 1050 - (Date.now() - last)); if (delay)
    await new Promise((resolve) => setTimeout(resolve, delay)); last = Date.now(); }
async function request(path) {
    const run = queue.then(async () => { await waitTurn(); const res = await fetch(`${BASE}${path}`, { headers, signal: AbortSignal.timeout(20000) }); if (!res.ok)
        throw new MusicBrainzError(`MusicBrainz error ${res.status}`); return (await res.json()); });
    queue = run.then(() => undefined, () => undefined);
    return run;
}
export function searchArtists(query, limit = 10) { return request(`/artist/?query=${encodeURIComponent(query)}&fmt=json&limit=${limit}`); }
export function searchReleases(query, limit = 10) { return request(`/release/?query=${encodeURIComponent(query)}&fmt=json&limit=${limit}`); }
export function searchRecordings(query, limit = 10) { return request(`/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=${limit}`); }
export function getArtist(id) { return request(`/artist/${encodeURIComponent(id)}?fmt=json`); }
export function formatArtist(a, index) { return [`${index === undefined ? "" : `${index + 1}. `}${a.name ?? "Unknown artist"}`, a.type ? `Type: ${a.type}` : "", a.country ? `Country: ${a.country}` : "", a["life-span"]?.begin ? `Started: ${a["life-span"]?.begin}` : "", a["life-span"]?.end ? `Ended: ${a["life-span"]?.end}` : "", a.id ? `MBID: ${a.id}` : ""].filter(Boolean).join("\n"); }
export function formatRelease(r, index) { return [`${index === undefined ? "" : `${index + 1}. `}${r.title ?? "Untitled release"}`, r["artist-credit"]?.length ? `Artist: ${r["artist-credit"].map((a) => a.name ?? a.artist?.name).filter(Boolean).join(", ")}` : "", r.date ? `Date: ${r.date}` : "", r.country ? `Country: ${r.country}` : "", r.status ? `Status: ${r.status}` : "", r.id ? `MBID: ${r.id}` : ""].filter(Boolean).join("\n"); }
export function formatRecording(r, index) { return [`${index === undefined ? "" : `${index + 1}. `}${r.title ?? "Untitled recording"}`, r["artist-credit"]?.length ? `Artist: ${r["artist-credit"].map((a) => a.name ?? a.artist?.name).filter(Boolean).join(", ")}` : "", r.length ? `Length: ${Math.round(r.length / 1000)} seconds` : "", r.releases?.length ? `Releases: ${r.releases.slice(0, 8).map((x) => x.title).filter(Boolean).join(", ")}` : "", r.id ? `MBID: ${r.id}` : ""].filter(Boolean).join("\n"); }
