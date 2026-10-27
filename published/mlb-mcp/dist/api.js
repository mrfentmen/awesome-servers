const BASE = "https://statsapi.mlb.com/api/v1";
const UA = "mrfentmen-mlb-mcp/1.0 (https://github.com/mrfentmen)";
export class MlbError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new MlbError(`MLB Stats API returned HTTP ${res.status}`);
    return (await res.json());
}
export async function teams(_args) {
    const d = await get(`${BASE}/teams?sportId=1`);
    const list = (d?.teams ?? []);
    if (!list.length)
        return "No teams found";
    return `MLB teams (${list.length}):\n` + list.map((t, i) => {
        const league = t?.league?.name ?? "";
        const division = t?.division?.name ?? "";
        return `${i + 1}. ${t?.name ?? "n/a"} (${t?.abbreviation ?? ""}) | ${league} ${division ? `| ${division}` : ""}`;
    }).join("\n");
}
export async function schedule(args) {
    const date = (args.date ?? new Date().toISOString().slice(0, 10)).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new MlbError("Provide a date like 2026-08-10");
    const teamId = args.teamId ? Number(args.teamId) : undefined;
    let url = `${BASE}/schedule?sportId=1&date=${date}`;
    if (teamId)
        url += `&teamId=${teamId}`;
    const d = await get(url);
    const games = (d?.dates?.[0]?.games ?? []);
    if (!games.length)
        return `No games on ${date}${teamId ? ` for team ${teamId}` : ""}`;
    return `MLB games on ${date}:\n` + games.map((g, i) => {
        const away = g?.teams?.away?.team?.name ?? "TBD";
        const home = g?.teams?.home?.team?.name ?? "TBD";
        const aR = g?.teams?.away?.score;
        const hR = g?.teams?.home?.score;
        const score = aR != null && hR != null ? ` ${aR}-${hR}` : "";
        const status = g?.status?.detailedState ?? "scheduled";
        return `${i + 1}. ${away} @ ${home}${score} | ${status}`;
    }).join("\n");
}
export async function standings(args) {
    const season = Number(args.season ?? new Date().getFullYear());
    const d = await get(`${BASE}/standings?leagueId=103,104&season=${season}`);
    const records = (d?.records ?? []);
    if (!records.length)
        return `No standings for ${season}`;
    const lines = [];
    for (const rec of records) {
        const divName = rec?.division?.name ?? rec?.league?.name ?? "";
        lines.push(`\n${divName}:`);
        const rows = (rec?.teamRecords ?? []).map((tr) => {
            const pct = tr?.pct ?? (tr?.wins && tr?.losses ? (tr.wins / (tr.wins + tr.losses)).toFixed(3) : "-");
            return `  ${String(tr?.rank ?? "").padStart(2)}. ${tr?.team?.name ?? "n/a"} ${tr?.wins ?? 0}-${tr?.losses ?? 0} (${pct})`;
        });
        lines.push(...rows.slice(0, 20));
    }
    return `MLB standings ${season}:` + lines.join("\n");
}
