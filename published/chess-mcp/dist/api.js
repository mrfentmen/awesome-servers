/**
 * chess.com client. The public API (api.chess.com/pub), keyless.
 * Player profiles, ratings, game archives, leaderboards, titled players.
 */
const PUB = "https://api.chess.com/pub";
export class ChessError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${PUB}${path}`, {
        headers: { "User-Agent": "chess-mcp/1.0" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new ChessError(`chess.com error ${res.status}`);
    return res.json();
}
export async function getPlayer(username) {
    try {
        return await getJson(`/player/${encodeURIComponent(username)}`);
    }
    catch (e) {
        if (e instanceof ChessError && String(e).includes("404"))
            return null;
        throw e;
    }
}
export async function getPlayerStats(username) {
    return getJson(`/player/${encodeURIComponent(username)}/stats`);
}
export async function getPlayerGames(username, year, month) {
    const d = await getJson(`/player/${encodeURIComponent(username)}/games/${year}/${String(month).padStart(2, "0")}`);
    return d?.games ?? [];
}
export async function getLeaderboards() {
    const d = await getJson("/leaderboards");
    const out = {};
    for (const key of ["daily", "rapid", "blitz", "bullet"])
        out[key] = d?.[key] ?? [];
    return out;
}
export async function getTitledPlayers(title) {
    return getJson(`/titled/${encodeURIComponent(title)}`);
}
const PERFS = ["chess_bullet", "chess_blitz", "chess_rapid", "chess_daily"];
export function formatPlayer(p) {
    const joined = p.joined ? new Date(p.joined * 1000).toISOString().slice(0, 10) : undefined;
    const last = p.last_online ? new Date(p.last_online * 1000).toISOString().slice(0, 10) : undefined;
    const lines = [
        `${p.username ?? "?"}${p.title ? ` (${p.title})` : ""}${p.name ? `, ${p.name}` : ""}`,
        `Status: ${p.status ?? "?"} | Followers: ${p.followers ?? "?"}`,
        joined ? `Joined: ${joined}` : "",
        last ? `Last online: ${last}` : "",
        p.url ?? "",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatStats(stats) {
    const lines = [];
    for (const perf of PERFS) {
        const p = stats[perf];
        if (!p?.last)
            continue;
        const best = p.best?.rating != null ? `, best ${p.best.rating}` : "";
        const recStr = p.record
            ? `, record ${rec(p.record)}`
            : "";
        lines.push(`${perf.replace("chess_", "").toUpperCase()}: ${p.last.rating}${best}${recStr}`);
    }
    if (stats.tactics?.highest)
        lines.push(`TACTICS: highest ${stats.tactics.highest.rating}`);
    if (stats.puzzle_rush?.best)
        lines.push(`PUZZLE RUSH: best ${stats.puzzle_rush.best.score}`);
    return lines.join("\n");
}
function rec(r) {
    return `${r.win ?? 0} wins, ${r.loss ?? 0} losses, ${r.draw ?? 0} draws`;
}
export function formatGame(g, index) {
    const white = g.white ?? {};
    const black = g.black ?? {};
    const time = g.end_time ? new Date(g.end_time * 1000).toISOString().slice(0, 10) : "";
    const result = white.result === "win" ? `1-0 (${white.username ?? "White"})` :
        black.result === "win" ? `0-1 (${black.username ?? "Black"})` :
            "1/2-1/2";
    return `${index !== undefined ? `${index + 1}. ` : ""}${white.username ?? "?"} (${white.rating ?? "?"}) vs ${black.username ?? "?"} (${black.rating ?? "?"}) | ${result}${time ? ` | ${time}` : ""} | ${g.time_control ?? "?"}${g.url ? ` | ${g.url}` : ""}`;
}
export function formatBoardRow(r) {
    return `${r.rank ?? "?"}. ${r.username ?? "?"}${r.title ? ` (${r.title})` : ""} score ${r.score ?? "?"}`;
}
