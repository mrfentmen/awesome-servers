/**
 * NHL client. Keyless. Team stats come from the NHL stats REST API,
 * standings and the daily schedule from the live game API.
 */
const STATS = "https://api.nhle.com/stats/rest/en";
const WEB = "https://api-web.nhle.com/v1";
export class NhlError extends Error {
}
async function getJson(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": "nhl-mcp/1.0" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new NhlError(`NHL API error ${res.status} for ${url}`);
    return res.json();
}
export async function getTeamStats(season = "20252026", limit = 10) {
    const d = await getJson(`${STATS}/team/summary?cayenneExp=seasonId%3D${season}&limit=${limit}`);
    return (d?.data ?? []).slice(0, limit);
}
export async function getStandings() {
    const d = await getJson(`${WEB}/standings/now`);
    return d?.standings ?? [];
}
export async function getSchedule() {
    const d = await getJson(`${WEB}/schedule/now`);
    const games = [];
    for (const week of d?.gameWeek ?? []) {
        for (const g of week.games ?? []) {
            games.push({
                id: g.id,
                gameState: g.gameState,
                startTimeUTC: g.startTimeUTC,
                awayAbbrev: g.awayTeam?.abbrev,
                homeAbbrev: g.homeTeam?.abbrev,
                awayScore: g.awayTeam?.score ?? null,
                homeScore: g.homeTeam?.score ?? null,
            });
        }
    }
    return games;
}
export function formatTeamStats(t) {
    const lines = [
        `[${t.teamAbbrev ?? "?"}] ${t.teamFullName ?? "Unknown team"}`,
        `${t.gamesPlayed ?? "?"} GP, ${t.wins ?? "?"} wins, ${t.losses ?? "?"} losses, ${t.otLosses ?? "?"} OT losses`,
        `Points: ${t.points ?? "?"} | GF: ${t.goalsFor ?? "?"} | GA: ${t.goalsAgainst ?? "?"}`,
        `Power play: ${t.powerPlayPct?.toFixed(1) ?? "?"}% | Penalty kill: ${t.penaltyKillPct?.toFixed(1) ?? "?"}%`,
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatStanding(r, index) {
    const lines = [
        `${index !== undefined ? `${index + 1}. ` : ""}[${r.teamAbbrev ?? "?"}] ${r.teamName ?? "?"}`,
        `${r.gamesPlayed ?? "?"} GP, ${r.wins ?? "?"} W, ${r.losses ?? "?"} L, ${r.otLosses ?? "?"} OTL, ${r.points ?? "?"} pts (${(r.pointsPctg ?? 0).toFixed(3)})`,
        r.goalDifferential != null ? `Goal diff: ${r.goalDifferential > 0 ? "+" : ""}${r.goalDifferential}` : "",
        r.streakCode ? `Streak: ${r.streakCode}` : "",
        [r.conferenceName, r.divisionName].filter(Boolean).join(" / "),
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatGame(g) {
    const when = g.startTimeUTC ? new Date(g.startTimeUTC).toISOString().slice(0, 16).replace("T", " ") + " UTC" : "soon";
    const state = g.gameState === "OFF" ? "Final" : g.gameState === "LIVE" ? "Live" : "Scheduled";
    const score = g.awayScore != null && g.homeScore != null ? `${g.awayScore}-${g.homeScore}` : "vs";
    return `${state}: ${g.awayAbbrev ?? "?"} ${score} ${g.homeAbbrev ?? "?"} (${when})`;
}
