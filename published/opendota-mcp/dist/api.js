const BASE = "https://api.opendota.com/api";
const UA = "mrfentmen-opendota-mcp/1.0 (https://github.com/mrfentmen)";
export class OpendotaError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new OpendotaError(`OpenDota returned HTTP ${res.status}`);
    return (await res.json());
}
export async function heroes(_args) {
    const d = await get(`${BASE}/heroes`);
    const list = (d ?? []).slice(0, 50);
    if (!list.length)
        return "No heroes found";
    return `Dota 2 heroes (${list.length} shown):\n` + list.map((h, i) => {
        const roles = (h?.roles ?? []).slice(0, 3).join(", ");
        return `${i + 1}. ${h?.localized_name ?? "n/a"} | ${h?.primary_attr ?? ""} | ${h?.attack_type ?? ""}${roles ? ` | ${roles}` : ""}`;
    }).join("\n");
}
export async function heroStats(_args) {
    const d = await get(`${BASE}/heroStats`);
    const list = (d ?? []).slice(0, 25);
    if (!list.length)
        return "No hero stats found";
    return "Dota 2 hero win rates (public matches):\n" + list.map((h, i) => {
        const games = (h?.pub_pick ?? 0) + (h?.pub_win ?? 0);
        const wr = games > 0 ? (((h?.pub_win ?? 0) / games) * 100).toFixed(1) : "n/a";
        return `${i + 1}. ${h?.localized_name ?? "n/a"}: ${wr}% (${games.toLocaleString()} games)`;
    }).join("\n");
}
export async function match(args) {
    const id = Number(args.matchId);
    if (!Number.isInteger(id) || id <= 0)
        throw new OpendotaError("Provide a positive match ID");
    const m = await get(`${BASE}/matches/${id}`);
    if (!m?.match_id)
        throw new OpendotaError(`Match not found: ${id}`);
    const dur = m?.duration != null ? `${Math.floor(m.duration / 60)}m ${m.duration % 60}s` : "n/a";
    const winner = m?.radiant_win != null ? (m.radiant_win ? "Radiant" : "Dire") : "n/a";
    const lines = [
        `Match ${id} | ${dur} | Winner: ${winner}`,
        `Mode: ${m?.game_mode ?? "n/a"} | Region: ${m?.region ?? "n/a"}`,
        `Kills ${m?.radiant_score ?? 0}-${m?.dire_score ?? 0}`,
    ];
    const players = (m?.players ?? []).slice(0, 5);
    if (players.length) {
        lines.push("", "Sample players:");
        players.forEach((p, i) => {
            const hero = p?.hero_name?.replace("npc_dota_hero_", "") ?? "n/a";
            lines.push(`${i + 1}. ${p?.personaname ?? "anon"} (${hero}) | KDA ${p?.kills ?? 0}/${p?.deaths ?? 0}/${p?.assists ?? 0} | GPM ${p?.gold_per_min ?? 0}`);
        });
    }
    return lines.join("\n");
}
export async function player(args) {
    const id = Number(args.accountId);
    if (!Number.isInteger(id) || id <= 0)
        throw new OpendotaError("Provide a positive Steam account ID");
    const p = await get(`${BASE}/players/${id}`);
    if (!p?.profile)
        throw new OpendotaError(`Player not found: ${id}`);
    const prof = p?.profile ?? {};
    const mmr = p?.mmr_estimate?.estimate;
    const lines = [
        `Player: ${prof?.personaname ?? "n/a"}`,
        `Profile: ${prof?.profileurl ?? ""}`,
        `MMR estimate: ${mmr ?? "n/a"}`,
    ];
    if (p?.rank_tier)
        lines.push(`Rank tier: ${p.rank_tier}`);
    if (p?.competitive_rank)
        lines.push(`Competitive rank: ${p.competitive_rank}`);
    return lines.join("\n");
}
// ---- muxB tools:
const OD_COUNT_LABELS = {
    leaver_status: { "0": "completed", "1": "disconnected", "2": "abandoned", "3": "left" },
    game_mode: {
        "0": "unknown", "1": "all pick", "2": "captains mode", "3": "random draft", "4": "single draft",
        "5": "all random", "6": "intro", "7": "directors", "8": "reverse captains mode", "9": "greeviling",
        "10": "tutorial", "11": "mid only", "12": "least played", "13": "limited heroes", "14": "compendium matchmaking",
        "15": "custom", "16": "captains draft", "17": "balanced draft", "18": "ability draft", "19": "event", "20": "all random deathmatch",
        "21": "1v1 mid", "22": "all draft", "23": "turbo", "24": "mutation",
    },
    lobby_type: { "0": "unknown", "1": "lobby", "2": "practice", "6": "direct", "7": "live", "8": "ranked" },
    lane_role: { "0": "safe lane", "1": "mid lane", "2": "off lane", "3": "jungle", "4": "roaming" },
    region: { "1": "US WEST", "2": "US EAST", "3": "EUROPE", "4": "KOREA", "5": "CHINA", "6": "SEA", "7": "SOUTHEAST ASIA" },
    is_radiant: { "0": "Dire", "1": "Radiant" },
};
