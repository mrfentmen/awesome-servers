/**
 * Wynncraft API v3 client, keyless.
 * Docs: https://docs.wynncraft.com/
 */
const BASE = "https://api.wynncraft.com/v3";
export class WynncraftError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "wynncraft-mcp/1.0" },
        signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404) {
        const body = (await res.json().catch(() => null));
        throw new WynncraftError(String(body?.detail ?? "Not found"));
    }
    if (!res.ok)
        throw new WynncraftError(`Wynncraft error ${res.status}`);
    return (await res.json());
}
export async function getPlayer(name) {
    const p = await getJson(`/player/${encodeURIComponent(name.trim())}?fullResult`);
    const chars = p.characters ?? {};
    const ids = Object.keys(chars);
    return {
        username: String(p.username ?? name),
        online: Boolean(p.online),
        server: p.server ?? null,
        rank: String(p.rank ?? "Player"),
        guild: p.guild ? String(p.guild.name ?? null) : null,
        playtime: typeof p.playtime === "number" ? p.playtime : undefined,
        characters: ids.slice(0, 8).map((id) => {
            const c = chars[id];
            const cls = String(c.reskin ?? c.type ?? "?").charAt(0).toUpperCase() +
                String(c.reskin ?? c.type ?? "?").slice(1).toLowerCase();
            const lvl = c.level !== undefined ? ` lvl ${c.level}` : "";
            const mode = Array.isArray(c.gamemode) && c.gamemode.length ? ` (${c.gamemode.join(", ")})` : "";
            return `${cls}${lvl}${mode}`;
        }),
        firstJoin: p.firstJoin,
        lastJoin: p.lastJoin,
    };
}
export async function getGuild(name) {
    const g = await getJson(`/guild/${encodeURIComponent(name.trim())}`);
    const members = g.members ?? {};
    const ranks = [];
    for (const [rank, list] of Object.entries(members)) {
        if (rank === "total" || typeof list !== "object" || list === null)
            continue;
        ranks.push(`${rank}: ${Object.keys(list).length}`);
    }
    return {
        name: String(g.name ?? name),
        prefix: g.prefix,
        level: g.level,
        territories: g.territories,
        wars: g.wars,
        created: g.created ? String(g.created).slice(0, 10) : undefined,
        memberTotal: typeof members.total === "number" ? members.total : undefined,
        ranks,
    };
}
const stripHtml = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
export async function searchItems(query, limit = 5) {
    const items = await getJson(`/item/search/${encodeURIComponent(query.trim())}`);
    return items.slice(0, limit).map((it) => ({
        displayName: String(it.displayName ?? it.internalName ?? "?"),
        type: it.type ? `${String(it.type)}${it.subType ? `/${String(it.subType)}` : ""}` : undefined,
        tier: it.tier ? String(it.tier) : undefined,
        level: it.requirements?.level,
        lore: it.lore ? stripHtml(String(it.lore)).slice(0, 160) : undefined,
    }));
}
export function formatPlayer(p) {
    const lines = [
        `${p.username} (${p.rank})${p.online ? ` — ONLINE on ${p.server ?? "?"}` : " — offline"}`,
        p.guild ? `Guild: ${p.guild}` : "",
        p.playtime !== undefined ? `Playtime: ${Math.round(p.playtime)}h` : "",
        p.characters.length ? `Characters (${p.characters.length} shown): ${p.characters.join(" · ")}` : "No characters",
        p.firstJoin ? `First join: ${String(p.firstJoin).slice(0, 10)}` : "",
        p.lastJoin ? `Last join: ${String(p.lastJoin).slice(0, 10)}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatGuild(g) {
    const lines = [
        `${g.name}${g.prefix ? ` [${g.prefix}]` : ""}`,
        g.level !== undefined ? `Level: ${g.level}` : "",
        g.territories !== undefined ? `Territories: ${g.territories}` : "",
        g.wars !== undefined ? `Wars: ${g.wars}` : "",
        g.memberTotal !== undefined ? `Members: ${g.memberTotal}` : "",
        g.ranks.length ? `By rank: ${g.ranks.join(", ")}` : "",
        g.created ? `Created: ${g.created}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatItem(it, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const meta = [it.tier, it.type, it.level !== undefined ? `lvl ${it.level}` : ""].filter(Boolean).join(" · ");
    return `${prefix}${it.displayName}${meta ? ` (${meta})` : ""}${it.lore ? `\n   ${it.lore}` : ""}`;
}
// ---- gap4b4 tools:
export async function mapLocations(args) {
    const query = (args.query ?? "").trim().toLowerCase();
    const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 15), 50));
    const rows = await getJson("/map/locations/markers");
    const matches = rows.filter(r => !query || String(r.name ?? "").toLowerCase().includes(query));
    return `Wynncraft map locations: ${matches.length} matches, ${Math.min(limit, matches.length)} shown\n` + matches.slice(0, limit).map(r => `${String(r.name ?? "not reported").slice(0, 160)} | x ${r.x ?? "not reported"}, y ${r.y ?? "not reported"}, z ${r.z ?? "not reported"} | ${String(r.icon ?? "icon not reported").slice(0, 100)}`).join("\n");
}
