/**
 * Chess.com Published-Data API client, keyless.
 * Docs: https://www.chess.com/news/view/published-data-api
 */
const BASE = "https://api.chess.com/pub";
const UA = "chesscom-mcp/1.0";
export class ChessComError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404)
        throw new ChessComError("Not found on Chess.com.");
    if (res.status === 403 || res.status === 401) {
        throw new ChessComError("Chess.com refused the request (Cloudflare). Try again later or from a residential IP.");
    }
    if (res.status === 429)
        throw new ChessComError("Chess.com rate limit hit; wait a minute and retry.");
    if (!res.ok)
        throw new ChessComError(`Chess.com error ${res.status}`);
    return (await res.json());
}
const countryCode = (url) => url?.split("/").filter(Boolean).pop();
const fmtDate = (ts) => typeof ts === "number" ? new Date(ts * 1000).toISOString().slice(0, 10) : undefined;
export async function getPlayer(username) {
    const p = await getJson(`/player/${encodeURIComponent(username.trim())}`);
    return {
        username: String(p.username ?? username),
        title: p.title,
        name: p.name || undefined,
        followers: p.followers,
        country: countryCode(p.country),
        joined: fmtDate(p.joined),
        lastOnline: fmtDate(p.last_online),
        league: p.league,
        url: p.url,
    };
}
const line = (node) => {
    if (!node)
        return {};
    const last = node.last;
    const best = node.best;
    const rec = node.record;
    return {
        rating: last?.rating,
        best: best?.rating,
        record: rec ? `${rec.win ?? 0}W/${rec.loss ?? 0}L/${rec.draw ?? 0}D` : undefined,
    };
};
export async function getStats(username) {
    const s = await getJson(`/player/${encodeURIComponent(username.trim())}/stats`);
    return {
        daily: line(s.chess_daily),
        rapid: line(s.chess_rapid),
        blitz: line(s.chess_blitz),
        bullet: line(s.chess_bullet),
        tactics: { highest: s.tactics?.highest?.rating },
        puzzleRush: { best: s.puzzle_rush?.best?.score },
    };
}
export async function dailyPuzzle() {
    const p = await getJson("/puzzle");
    const ts = typeof p.publish_time === "number" ? p.publish_time : undefined;
    return {
        title: p.title,
        url: p.url,
        fen: p.fen,
        publishDate: fmtDate(ts),
    };
}
export const LEADERBOARD_CATEGORIES = ["daily", "live_rapid", "live_blitz", "live_bullet", "tactics"];
export async function leaderboards(category, limit = 10) {
    const data = await getJson("/leaderboards");
    const rows = data[category] ?? [];
    return rows.slice(0, limit).map((r) => ({
        rank: r.rank,
        username: String(r.username ?? "?"),
        score: r.score,
        country: countryCode(r.country),
    }));
}
export function formatProfile(p) {
    const lines = [
        `${p.username}${p.title ? ` (${p.title})` : ""}${p.name ? ` — ${p.name}` : ""}`,
        p.followers !== undefined ? `Followers: ${p.followers}` : "",
        p.country ? `Country: ${p.country.toUpperCase()}` : "",
        p.league ? `League: ${p.league}` : "",
        p.joined ? `Joined: ${p.joined}` : "",
        p.lastOnline ? `Last online: ${p.lastOnline}` : "",
        p.url ? `Profile: ${p.url}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatStats(username, s) {
    const row = (label, l) => l?.rating !== undefined
        ? `${label}: ${l.rating}${l.best ? ` (best ${l.best})` : ""}${l.record ? ` [${l.record}]` : ""}`
        : "";
    const lines = [
        `Ratings for ${username}`,
        row("Daily", s.daily),
        row("Rapid", s.rapid),
        row("Blitz", s.blitz),
        row("Bullet", s.bullet),
        s.tactics?.highest !== undefined ? `Tactics highest: ${s.tactics.highest}` : "",
        s.puzzleRush?.best !== undefined ? `Puzzle Rush best: ${s.puzzleRush.best}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatPuzzle(p) {
    const lines = [
        p.title ? `${p.title}${p.publishDate ? ` (${p.publishDate})` : ""}` : "Daily puzzle",
        p.url ? `Solve: ${p.url}` : "",
        p.fen ? `FEN: ${p.fen}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatLeaders(category, rows) {
    if (rows.length === 0)
        return `No ${category} leaderboard right now.`;
    return (`Chess.com ${category} leaderboard:\n\n` +
        rows.map((r) => `${r.rank ?? "?"}. ${r.username} — ${r.score ?? "?"}${r.country ? ` (${r.country.toUpperCase()})` : ""}`).join("\n"));
}
// ---- muxA tools:
function day(epoch) {
    const n = Number(epoch);
    if (!Number.isFinite(n) || n <= 0)
        return "unknown";
    return new Date(n * 1000).toISOString().slice(0, 16).replace("T", " ");
}
export async function clubProfile(args) {
    const id = (args.club_id ?? "").trim();
    if (!id)
        throw new Error("Provide a club id or slug, e.g. lichess.");
    const res = await fetch(`${BASE}/club/${encodeURIComponent(id)}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
        if (res.status === 404)
            return `No public Chess.com club matches "${id}".`;
        throw new Error(`Chess.com returned ${res.status}`);
    }
    const c = (await res.json());
    const admins = Array.isArray(c.admin) ? c.admin : [];
    const country = String(c.country ?? "").split("/").pop() ?? "not reported";
    return [
        `${c.name ?? id} (club id ${c.club_id ?? "?"})`,
        `Visibility ${c.visibility ?? "unknown"} | members ${c.members_count ?? "?"} | average daily rating ${c.average_daily_rating ?? "not reported"}`,
        `Country ${country || "not reported"} | created ${day(c.created)} | last activity ${day(c.last_activity)}`,
        `Admins: ${admins.length ? admins.map((a) => String(a).split("/").pop()).join(", ") : "none listed"}`,
        `Join: ${c.join_request ?? "not reported"}`,
        c.url ? `Page: ${c.url}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
