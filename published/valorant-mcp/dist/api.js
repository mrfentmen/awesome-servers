const BASE = "https://valorant-api.com/v1";
const UA = "mrfentmen-valorant-mcp/1.0 (https://github.com/mrfentmen)";
export class ValorantError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new ValorantError(`Valorant API returned HTTP ${res.status}`);
    return (await res.json());
}
export async function agents(args) {
    const lang = (args.language ?? "en-US").trim();
    const d = await get(`${BASE}/agents?language=${encodeURIComponent(lang)}`);
    const list = (d?.data ?? []).filter((a) => a?.isPlayableCharacter !== false);
    if (!list.length)
        return "No agents found";
    return `Valorant agents (${list.length}):\n` + list.map((a, i) => {
        const role = a?.role?.displayName ?? "no role";
        return `${i + 1}. ${a?.displayName ?? "n/a"} | ${role}\n   ${(a?.description ?? "").slice(0, 120)}`;
    }).join("\n");
}
export async function agent(args) {
    const uuid = (args.uuid ?? "").trim();
    if (!uuid)
        throw new ValorantError("Provide an agent UUID");
    const lang = (args.language ?? "en-US").trim();
    const d = await get(`${BASE}/agents/${encodeURIComponent(uuid)}?language=${encodeURIComponent(lang)}`);
    const a = d?.data;
    if (!a)
        throw new ValorantError(`Agent not found: ${uuid}`);
    const lines = [
        `${a?.displayName ?? "n/a"} | ${a?.role?.displayName ?? ""}`,
        `${a?.description ?? ""}`,
    ];
    if (a?.abilities?.length) {
        lines.push("", "Abilities:");
        a.abilities.forEach((ab, i) => lines.push(`${i + 1}. ${ab?.displayName ?? ""}: ${(ab?.description ?? "").slice(0, 140)}`));
    }
    return lines.join("\n");
}
export async function maps(_args) {
    const d = await get(`${BASE}/maps`);
    const list = (d?.data ?? []);
    if (!list.length)
        return "No maps found";
    return `Valorant maps (${list.length}):\n` + list.map((m, i) => {
        const coords = m?.coordinates ?? "unknown";
        return `${i + 1}. ${m?.displayName ?? "n/a"} | coords ${coords}`;
    }).join("\n");
}
export async function weapons(_args) {
    const d = await get(`${BASE}/weapons`);
    const list = (d?.data ?? []);
    if (!list.length)
        return "No weapons found";
    return `Valorant weapons (${list.length}):\n` + list.map((w, i) => {
        const cost = w?.shopData?.cost;
        return `${i + 1}. ${w?.displayName ?? "n/a"} | ${w?.category ?? ""}${cost != null ? ` | ${cost} credits` : ""}`;
    }).join("\n");
}
/** The game-mode roster, with the rules each mode is played under. */
export async function gameModes(_args) {
    const d = await get(`${BASE}/gamemodes`);
    const list = d.data ?? [];
    if (!list.length)
        return 'No game modes found';
    return `Valorant game modes (${list.length}):\n` +
        list
            .map((m, i) => {
            // The API uses -1 for "this rule does not apply to this mode", so a
            // truthiness check is not enough: only positive values are reported.
            const rounds = Number(m.roundsPerHalf);
            const minutes = Number(m.duration) / 60000;
            const orbs = Number(m.orbCount);
            const rules = [
                m.economyType ? `economy ${m.economyType}` : '',
                Number.isFinite(rounds) && rounds > 0 ? `${rounds} rounds per half` : '',
                Number.isFinite(minutes) && minutes > 0 ? `${Math.round(minutes)} min limit` : '',
                Number.isFinite(orbs) && orbs > 0 ? `${orbs} orbs` : '',
            ]
                .filter(Boolean)
                .join(', ');
            const flags = [
                m.isMinimapHidden ? 'minimap hidden' : '',
                m.allowsMatchTimeouts ? 'timeouts allowed' : '',
            ]
                .filter(Boolean)
                .join(', ');
            const detail = [rules, flags].filter(Boolean).join(' | ');
            return (`${i + 1}. ${m.displayName ?? 'unnamed'} — uuid ${m.uuid ?? 'not reported'}\n` +
                `   ${(m.description ?? 'no description reported').slice(0, 200)}` +
                (detail ? `\n   ${detail}` : ''));
        })
            .join('\n');
}
