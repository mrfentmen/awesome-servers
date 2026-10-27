export class LastfmError extends Error {
    constructor(message) {
        super(message);
        this.name = "LastfmError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function key() {
    const k = process.env.LASTFM_API_KEY;
    if (!k)
        throw new LastfmError("Set LASTFM_API_KEY (free Last.fm key).");
    return k;
}
async function call(params) {
    const q = new URLSearchParams({ ...params, api_key: key(), format: "json" });
    let res;
    try {
        res = await fetch(`https://ws.audioscrobbler.com/2.0/?${q.toString()}`, {
            headers: { ...UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new LastfmError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new LastfmError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function topArtists(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 50);
    return call({ method: "chart.gettopartists", limit: String(n) });
}
export function topTracks(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 50);
    return call({ method: "chart.gettoptracks", limit: String(n) });
}
export function artistInfo(artist) {
    return call({ method: "artist.getinfo", artist, autocorrect: "1" });
}
// ---- muxG tools:
const MB_BASE = "https://musicbrainz.org/ws/2";
const CAA_BASE = "https://coverartarchive.org";
// MusicBrainz asks every client to identify itself and to stay at one request a second.
const MB_UA = "mrfentmen-lastfm-mcp/1.0 (https://github.com/mrfentmen)";
let lastMbCall = 0;
async function mbGet(path) {
    const now = Date.now();
    if (now - lastMbCall < 1100)
        await new Promise((resolve) => setTimeout(resolve, 1100 - (now - lastMbCall)));
    lastMbCall = Date.now();
    const res = await fetch(`${MB_BASE}${path}`, {
        headers: { "User-Agent": MB_UA, Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 503)
        throw new LastfmError("MusicBrainz is rate limiting this client; wait and retry.");
    if (res.status === 404)
        throw new LastfmError("MusicBrainz has no record for that query.");
    if (!res.ok)
        throw new LastfmError(`MusicBrainz returned ${res.status}`);
    const text = await res.text();
    if (!text.trim())
        throw new LastfmError("MusicBrainz returned an empty body.");
    return JSON.parse(text);
}
/** The canonical artist record from MusicBrainz: MBID, aliases, area, life span, tags and discography size. */
export async function musicbrainzArtist(args) {
    const name = String(args?.artist ?? "").trim();
    if (!name)
        throw new LastfmError("Provide an artist name.");
    const n = Math.min(Math.max(Number(args?.limit ?? 3) || 3, 1), 10);
    const data = await mbGet(`/artist?query=${encodeURIComponent(`artist:${name}`)}&fmt=json&limit=${n}`);
    const artists = Array.isArray(data.artists) ? data.artists : [];
    if (!artists.length)
        throw new LastfmError(`MusicBrainz has no artist called "${name}".`);
    const lines = [`MusicBrainz artists matching "${name}": ${data.count ?? artists.length} scored match(es), showing ${artists.length}`];
    for (const [i, artist] of artists.entries()) {
        const span = artist["life-span"] ?? {};
        const aliases = (artist.aliases ?? []).filter((a) => a.name && a.name !== artist.name).slice(0, 6);
        const tags = (artist.tags ?? []).slice(0, 6);
        lines.push(`  ${i + 1}. ${artist.name ?? "name not reported"} (MBID ${artist.id ?? "not reported"}, match score ${artist.score ?? "?"})`);
        lines.push(`     ${artist.type ?? "type not reported"} · ${artist.country ?? "country not reported"}${artist.area?.name ? ` · ${artist.area.name}` : ""}${artist.disambiguation ? ` · ${artist.disambiguation}` : ""}`);
        lines.push(`     active ${span.begin ?? "not reported"}${span.ended ? ` to ${span.ended}` : span.begin ? " and still going" : ""}`);
        if (aliases.length)
            lines.push(`     also known as: ${aliases.map((a) => a.name).join("; ")}`);
        if (tags.length)
            lines.push(`     tags: ${tags.map((t) => `${t.name ?? "?"} (${t.count ?? 0})`).join(", ")}`);
    }
    return lines.join("\n");
}
/** Cover art for a release from the Cover Art Archive, with every published size. */
export async function coverArt(args) {
    const mbid = String(args?.mbid ?? "").trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mbid)) {
        throw new LastfmError("Pass a MusicBrainz identifier, which looks like 1b022e01-4da6-387b-8658-8678046e4cef.");
    }
    const res = await fetch(`${CAA_BASE}/release-group/${encodeURIComponent(mbid)}`, {
        headers: { "User-Agent": MB_UA, Accept: "application/json" },
        redirect: "follow",
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new LastfmError(`The Cover Art Archive has nothing for release group ${mbid}.`);
    if (!res.ok)
        throw new LastfmError(`The Cover Art Archive returned ${res.status}`);
    const text = await res.text();
    if (!text.trim())
        throw new LastfmError("The Cover Art Archive returned an empty body.");
    const data = JSON.parse(text);
    const images = Array.isArray(data.images) ? data.images : [];
    if (!images.length)
        throw new LastfmError(`The Cover Art Archive lists no image for release group ${mbid}.`);
    const fronts = images.filter((image) => image.front === true);
    const lines = [`Cover Art Archive for release group ${mbid}: ${images.length} image(s), ${fronts.length} marked as front cover`];
    for (const [i, image] of images.slice(0, 10).entries()) {
        const sides = [image.front ? "front" : "", image.back ? "back" : ""].filter(Boolean).join("+") || "neither side flagged";
        const sizes = Object.keys(image.thumbnails ?? {}).sort((a, b) => Number(b) - Number(a));
        lines.push(`  ${i + 1}. ${image.id ?? "id not reported"} - ${sides}${image.approved === false ? " · not approved" : ""}${image.comment ? ` · ${String(image.comment).slice(0, 80)}` : ""}`);
        lines.push(`     ${String(image.image ?? "no full size URL").slice(0, 130)}`);
        if (sizes.length)
            lines.push(`     thumbnails: ${sizes.map((size) => `${size}px ${String(image.thumbnails?.[size]).slice(0, 110)}`).join(" | ")}`);
    }
    if (images.length > 10)
        lines.push(`  ...and ${images.length - 10} more image(s).`);
    return lines.join("\n");
}
/** How many release groups an artist has, with their first dates: the discography view Last.fm never gives. */
export async function artistDiscography(args) {
    const name = String(args?.artist ?? "").trim();
    if (!name)
        throw new LastfmError("Provide an artist name.");
    const n = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 50);
    const search = await mbGet(`/artist?query=${encodeURIComponent(`artist:${name}`)}&fmt=json&limit=1`);
    const artist = search.artists?.[0];
    if (!artist?.id)
        throw new LastfmError(`MusicBrainz has no artist called "${name}".`);
    const groups = await mbGet(`/release-group?artist=${encodeURIComponent(artist.id)}&fmt=json&limit=${n}`);
    const rows = groups["release-groups"] ?? [];
    if (!rows.length)
        throw new LastfmError(`MusicBrainz lists no release groups for ${artist.name}.`);
    const albums = rows.filter((row) => row["primary-type"] === "Album");
    const dates = rows.map((row) => Number(String(row["first-release-date"] ?? "").slice(0, 4))).filter((year) => Number.isFinite(year));
    const lines = [
        `${artist.name} on MusicBrainz (MBID ${artist.id}): ${rows.length} release group(s) shown${albums.length ? `, ${albums.length} of them albums` : ""}`,
        dates.length ? `Earliest first-release date ${Math.min(...dates)}, latest ${Math.max(...dates)}` : "First-release dates: not reported",
        "",
    ];
    for (const [i, row] of rows.entries()) {
        const secondary = (row["secondary-types"] ?? []).join(", ");
        lines.push(`  ${i + 1}. ${row.title ?? "title not reported"} - ${row["first-release-date"] ?? "date not reported"} · ${row["primary-type"] ?? "type not reported"}${secondary ? ` (${secondary})` : ""}`);
        lines.push(`     MBID ${row.id ?? "not reported"} · call cover_art with it for the artwork`);
    }
    return lines.join("\n");
}
