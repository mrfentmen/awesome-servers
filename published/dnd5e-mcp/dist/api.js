/**
 * D&D 5e SRD client — dnd5eapi.co, keyless.
 * Docs: https://www.dnd5eapi.co/docs — free community-hosted SRD data.
 * (The official API moved; we pin the stable community endpoint.)
 */
const BASE = "https://www.dnd5eapi.co/api";
export class DndError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { Accept: "application/json", "User-Agent": "dnd5e-mcp/1.0" },
        redirect: "follow",
    });
    if (!res.ok)
        throw new DndError(`dnd5eapi error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
export async function listMonsters(limit = 30) {
    const d = await getJson(`/monsters?limit=${limit}`);
    return (d.results ?? []).map((r) => ({ index: r.index ?? "", name: r.name ?? "?" }));
}
export async function getMonster(index) {
    try {
        return (await getJson(`/monsters/${encodeURIComponent(index)}`));
    }
    catch (e) {
        if (e instanceof DndError && String(e).includes("404"))
            return null;
        throw e;
    }
}
export async function getSpell(index) {
    try {
        return (await getJson(`/spells/${encodeURIComponent(index)}`));
    }
    catch (e) {
        if (e instanceof DndError && String(e).includes("404"))
            return null;
        throw e;
    }
}
export async function getClassInfo(index) {
    try {
        return (await getJson(`/classes/${encodeURIComponent(index)}`));
    }
    catch (e) {
        if (e instanceof DndError && String(e).includes("404"))
            return null;
        throw e;
    }
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
export function fmtSpeed(speed) {
    if (!speed)
        return "";
    return Object.entries(speed)
        .map(([k, v]) => `${k} ${v}`)
        .join(", ");
}
export function formatMonster(m) {
    const ac = m.armor_class?.map((a) => `${a.value ?? "?"}${a.type ? ` (${a.type})` : ""}`).join(" / ");
    const stats = ["STR", "DEX", "CON", "INT", "WIS", "CHA"]
        .map((s, i) => `${s} ${[m.strength, m.dexterity, m.constitution, m.intelligence, m.wisdom, m.charisma][i] ?? "?"}`)
        .join(" ");
    const lines = [
        `${m.name} — ${m.size ?? ""} ${m.type ?? ""}${m.alignment ? `, ${m.alignment}` : ""}`,
        `AC ${ac ?? "?"} · HP ${m.hit_points ?? "?"} (${m.hit_dice ?? ""}) · Speed ${fmtSpeed(m.speed) || "?"}`,
        `CR ${m.challenge_rating ?? "?"}${m.xp ? ` (${m.xp} XP)` : ""} · ${m.languages ?? "no languages"}`,
        stats,
        m.special_abilities?.length
            ? `\nAbilities:\n` +
                m.special_abilities.map((a) => `• ${a.name}: ${(a.desc ?? "").slice(0, 220)}`).join("\n")
            : "",
        m.actions?.length
            ? `\nActions:\n` + m.actions.map((a) => `• ${a.name}: ${(a.desc ?? "").slice(0, 220)}`).join("\n")
            : "",
        m.image ? `\nhttps://www.dnd5eapi.co${m.image}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatSpell(s) {
    const lines = [
        `${s.name} — level ${s.level ?? 0} ${s.school?.name ?? ""}${s.ritual ? " (ritual)" : ""}`,
        `Casting: ${s.casting_time ?? "?"} · Range: ${s.range ?? "?"} · Components: ${(s.components ?? []).join(", ") || "?"}${s.material ? ` (${s.material})` : ""}`,
        `Duration: ${s.duration ?? "?"}${s.concentration ? " (concentration)" : ""}`,
        "",
        ...(s.desc ?? []).map((d) => d),
        s.higher_level?.length ? `\nAt higher levels: ${s.higher_level.join(" ")}` : "",
        `\nhttps://www.dnd5eapi.co/api/spells/${s.index}`,
    ];
    return lines.join("\n");
}
// ---- muxA tools:
function clamp(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
function text(value, max = 200) {
    if (value == null)
        return "not listed";
    if (Array.isArray(value)) {
        const parts = value.map((v) => String(v)).filter(Boolean);
        return parts.join(", ") || "none";
    }
    const s = String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!s)
        return "not listed";
    return s.length > max ? `${s.slice(0, max)}...` : s;
}
export async function listRaces(args) {
    const d = await getJson("/races?limit=20");
    const all = d.results ?? [];
    if (!all.length)
        throw new DndError("The SRD returned no playable races.");
    const traitLimit = clamp(args.trait_limit, 3, 10);
    const lines = [`D&D 5e SRD playable races: ${all.length}.`];
    for (const [i, r] of all.entries()) {
        if (args.include_details !== true) {
            lines.push(`${i + 1}. ${r.name ?? "?"} | index ${r.index ?? "?"}`);
            continue;
        }
        const full = await getJson(`/races/${r.index}`);
        const bonuses = (full.ability_bonuses ?? []);
        const traits = (full.traits ?? []);
        const langs = (full.languages ?? []);
        const subraces = (full.subraces ?? []);
        lines.push(`${i + 1}. ${full.name ?? r.name ?? "?"} | index ${r.index ?? "?"}`);
        lines.push(`   speed ${text(full.speed, 40)} | size ${text(full.size, 40)} | darkvision ${full.darkvision ? "yes" : "no"}` +
            ` | languages ${langs.length ? langs.map((l) => String(l.name)).join(", ") : "not listed"}` +
            `${subraces.length ? ` | subraces ${subraces.map((s) => String(s.name)).join(", ")}` : ""}`);
        if (bonuses.length) {
            lines.push(`   ability score increases: ${bonuses
                .map((b) => `${String(b.ability_score?.name ?? b.ability_score ?? "?").slice(0, 3).toUpperCase()} +${b.bonus ?? "?"}`)
                .join(", ")}`);
        }
        for (const t of traits.slice(0, traitLimit)) {
            let desc = "";
            try {
                const detail = await getJson(`${t.url ?? `/traits/${t.index}`}`);
                const raw = Array.isArray(detail.desc) ? detail.desc.join(" ") : String(detail.desc ?? "");
                desc = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
            }
            catch {
                desc = "";
            }
            lines.push(`   trait ${t.name ?? "?"}${desc ? `: ${desc.slice(0, 180)}` : ""}`);
        }
    }
    return lines.join("\n");
}
