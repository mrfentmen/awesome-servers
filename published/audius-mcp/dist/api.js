/**
 * Audius client — decentralized music platform (underground/independent).
 * Public discovery endpoints are keyless but require an app_name.
 * Docs: https://docs.audius.org/developers/server/ — the discovery
 * provider is a rotating host; we pin the stable community endpoint.
 */
const BASE = "https://discoveryprovider.audius.co/v1";
const APP = "audius-mcp";
export class AudiusError extends Error {
}
async function getJson(path) {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${BASE}${path}${sep}app_name=${APP}`, {
        headers: { Accept: "application/json" },
    });
    if (!res.ok)
        throw new AudiusError(`Audius error ${res.status}: ${res.statusText}`);
    const body = (await res.json());
    return body.data;
}
// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
export async function trendingTracks(genre, limit = 8) {
    const g = genre && genre !== "all" ? `&genre=${encodeURIComponent(genre)}` : "";
    const data = await getJson(`/tracks/trending?limit=${limit}${g}`);
    return data ?? [];
}
export async function searchTracks(query, limit = 8) {
    const data = await getJson(`/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    return data ?? [];
}
export async function searchUsers(query, limit = 8) {
    const data = await getJson(`/users/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    return data ?? [];
}
export async function getUserTracks(userId, limit = 8) {
    const data = await getJson(`/users/${userId}/tracks?limit=${limit}`);
    return data ?? [];
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
export function fmtDur(sec) {
    if (!sec)
        return "";
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}
export function formatTrack(t, index) {
    const head = `${index !== undefined ? `${index + 1}. ` : ""}${t.title}`;
    const artist = t.user?.name ? ` — ${t.user.name}${t.user.handle ? ` (@${t.user.handle})` : ""}` : "";
    const meta = [t.genre, t.mood, fmtDur(t.duration), t.play_count ? `${t.play_count.toLocaleString()} plays` : ""]
        .filter(Boolean)
        .join(" · ");
    const lines = [head + artist, meta, t.permalink ?? `https://audius.co${t.permalink ?? ""}`].filter(Boolean);
    return lines.join("\n");
}
export function formatUser(u, index) {
    const head = `${index !== undefined ? `${index + 1}. ` : ""}${u.name}${u.is_verified ? " ✓" : ""} (@${u.handle})`;
    const meta = [
        u.follower_count ? `${u.follower_count.toLocaleString()} followers` : "",
        u.track_count ? `${u.track_count} tracks` : "",
    ]
        .filter(Boolean)
        .join(" · ");
    const lines = [head, meta, u.bio ? u.bio.slice(0, 200) : "", `https://audius.co/${u.handle}`].filter(Boolean);
    return lines.join("\n");
}
// ---- muxA tools:
function bound(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
function clean(value) {
    return value != null ? String(value) : '';
}
export async function artistFollowers(args) {
    const id = (args.user_id ?? '').trim();
    if (!id)
        return 'Provide an artist user id.';
    const limit = bound(args.limit, 10, 50);
    const rows = await getJson(`/users/${encodeURIComponent(id)}/followers?limit=${limit}`);
    if (!rows?.length)
        return `Audius returned no followers for user ${id}, or the id is not a current user.`;
    return `Followers of Audius user ${id} (${rows.length} shown):\n` +
        rows
            .map((u, i) => {
            const followers = Number(u.follower_count) || 0;
            const tracks = Number(u.track_count) || 0;
            return [
                `${i + 1}. ${clean(u.name) || 'unnamed'}${u.is_verified ? ' ✓' : ''} (@${clean(u.handle) || 'no handle'})`,
                `   ${followers ? `${followers.toLocaleString('en-US')} followers` : 'follower count not reported'}${tracks ? ` · ${tracks} tracks` : ''}`,
                `   https://audius.co/${clean(u.handle)}`,
            ]
                .filter(Boolean)
                .join('\n');
        })
            .join('\n');
}
