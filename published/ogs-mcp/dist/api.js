/**
 * Online-Go.com API v1 client, keyless.
 * Docs: https://online-go.com/api
 */
const BASE = "https://online-go.com/api/v1";
export class OgsError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "ogs-mcp/1.0" },
        signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404)
        throw new OgsError("Not found on Online-Go.com.");
    if (!res.ok)
        throw new OgsError(`Online-Go.com error ${res.status}`);
    return (await res.json());
}
const overallRating = (p) => {
    const r = p.ratings?.overall;
    return typeof r?.rating === "number" ? Math.round(r.rating) : undefined;
};
export async function searchPlayers(username, limit = 5) {
    const data = await getJson(`/players?username=${encodeURIComponent(username)}`);
    return (data.results ?? []).slice(0, limit).map((p) => ({
        id: p.id,
        username: String(p.username ?? "?"),
        country: p.country,
        rating: overallRating(p),
    }));
}
export async function getPlayer(id) {
    if (!/^\d+$/.test(id.trim()))
        throw new OgsError(`Player id must be numeric, got "${id}". Search first to find it.`);
    const p = await getJson(`/players/${id.trim()}`);
    if (!p || p.id === undefined)
        return null;
    const ratings = p.ratings ?? {};
    return {
        id: p.id,
        username: String(p.username ?? "?"),
        country: p.country,
        rating: overallRating(p),
        ratings: Object.entries(ratings)
            .filter(([, v]) => v && typeof v.rating === "number")
            .slice(0, 8)
            .map(([k, v]) => `${k}: ${Math.round(v.rating)}`),
    };
}
export async function recentGames(id, limit = 5) {
    if (!/^\d+$/.test(id.trim()))
        throw new OgsError(`Player id must be numeric, got "${id}".`);
    const data = await getJson(`/players/${id.trim()}/games/?page_size=${Math.min(Math.max(limit, 1), 20)}`);
    return (data.results ?? []).slice(0, limit).map((g) => {
        const players = (g.players ?? {});
        const black = (players.black ?? {});
        const white = (players.white ?? {});
        const outcome = typeof g.outcome === "string" && g.outcome ? g.outcome : undefined;
        const detail = typeof g.related?.detail === "string" ? g.related.detail : undefined;
        return {
            id: detail ? Number(detail.split("/").filter(Boolean).pop()) || undefined : undefined,
            white: white.username ? String(white.username) : undefined,
            black: black.username ? String(black.username) : undefined,
            outcome,
        };
    });
}
export function formatPlayer(p, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${p.id}] ${p.username}${p.rating !== undefined ? ` (${p.rating})` : ""}${p.country ? ` [${String(p.country).toUpperCase()}]` : ""}`;
}
export function formatDetails(p) {
    const lines = [
        `[${p.id}] ${p.username}${p.rating !== undefined ? ` (overall ${p.rating})` : ""}${p.country ? ` [${String(p.country).toUpperCase()}]` : ""}`,
        `Profile: https://online-go.com/user/view/${p.id}`,
        p.ratings.length ? `Ratings: ${p.ratings.join(" · ")}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatGame(g, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const vs = g.white || g.black ? `${g.black ?? "?"} (B) vs ${g.white ?? "?"} (W)` : "game";
    return `${prefix}${vs}${g.outcome ? ` — ${g.outcome}` : ""}${g.id !== undefined ? ` (https://online-go.com/game/${g.id})` : ""}`;
}
// ---- muxC tools:
// The API returns rules and board size as separate fields, and one is often absent.
function g(value) {
    return value === undefined || value === null || value === "" ? "" : String(value);
}
/** Public OGS clubs and groups, with member counts. */
export async function groupList(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 8, 20));
    const d = await getJson(`/groups/?page_size=${limit}`);
    const rows = d.results ?? [];
    if (!rows.length)
        return "No OGS groups returned.";
    return `Online-Go.com groups (${d.count ?? rows.length} total, ${rows.length} shown):\n` +
        rows
            .map((g, i) => {
            const link = g.related?.detail;
            return `${i + 1}. ${g.name || g.summary?.slice(0, 80) || "(unnamed)"}\n   id ${g.id} | members ${g.member_count ?? "not reported"} | ${g.is_public ? "public" : "private"}${g.hide_details ? " | details hidden" : ""}${link ? `\n   https://online-go.com${link}` : ""}`;
        })
            .join("\n");
}
