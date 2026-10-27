export class EveonlineError extends Error {
    constructor(message) {
        super(message);
        this.name = "EveonlineError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
function stripHtml(html) {
    return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
async function req(url, init = {}) {
    const res = await fetch(url, { headers: { ...UA, ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new EveonlineError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getStatus(datasource) {
    let url = `https://esi.evetech.net/latest/status/`;
    const qs = new URLSearchParams();
    if (datasource !== undefined)
        qs.append("datasource", String(datasource));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function search(query, categories, strict, datasource) {
    let url = `https://esi.evetech.net/latest/search/`;
    const qs = new URLSearchParams();
    qs.append("categories", String(categories));
    qs.append("search", String(query));
    if (strict !== undefined)
        qs.append("strict", String(strict));
    if (datasource !== undefined)
        qs.append("datasource", String(datasource));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getCharacter(characterId, datasource) {
    let url = `https://esi.evetech.net/latest/characters/${encodeURIComponent(String(characterId))}/`;
    const qs = new URLSearchParams();
    if (datasource !== undefined)
        qs.append("datasource", String(datasource));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getCorporation(corporationId, datasource) {
    let url = `https://esi.evetech.net/latest/corporations/${encodeURIComponent(String(corporationId))}/`;
    const qs = new URLSearchParams();
    if (datasource !== undefined)
        qs.append("datasource", String(datasource));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getAlliance(allianceId, datasource) {
    let url = `https://esi.evetech.net/latest/alliances/${encodeURIComponent(String(allianceId))}/`;
    const qs = new URLSearchParams();
    if (datasource !== undefined)
        qs.append("datasource", String(datasource));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getMarketPrices(datasource) {
    let url = `https://esi.evetech.net/latest/markets/prices/`;
    const qs = new URLSearchParams();
    if (datasource !== undefined)
        qs.append("datasource", String(datasource));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
// ---- muxD tools:
/**
 * This ESI deployment is partial. Verified live on 2026-09-27:
 *   works: /status/, /markets/prices/, /universe/factions/, /universe/regions/,
 *          /universe/regions/{id}/, /universe/constellations/{id}/, /incursions/,
 *          /alliances/{id}/corporations/
 *   gone:  /search/ (404, so the server's existing search tool cannot work),
 *          /universe/ids/ (POST rejects its own documented field),
 *          /market/{stats,history,orders}/, /universe/stations/,
 *          /universe/structureTypes/, /corporations/{id}/outposts/,
 *          /characters/{id}/{corporation_history,portraits}
 *   stubbed: /universe/types/ and /universe/groups/ return bare integer arrays
 *          with no names, so no type or market-group catalogue can be built.
 * 404 here is ambiguous between "route removed" and "entity not found", so the
 * body is checked: a missing route answers with the plain text "404 page not
 * found" while a real route with a bad id answers with a JSON error.
 */
const ESI = "https://esi.evetech.net/latest";
async function esi(path) {
    const res = await fetch(`${ESI}${path}`, { headers: { ...UA, Accept: "application/json" } });
    const body = await res.text();
    if (!res.ok) {
        if (/404 page not found/i.test(body)) {
            throw new EveonlineError(`ESI has no route ${path} on this deployment. Several character, market and universe routes have been removed or stubbed, and a 404 here can mean either a missing route or an id that does not exist.`);
        }
        throw new EveonlineError(`HTTP ${res.status}: ${body.slice(0, 250)}`);
    }
    try {
        return JSON.parse(body);
    }
    catch {
        throw new EveonlineError(`ESI returned a non-JSON body for ${path}: ${body.slice(0, 200)}`);
    }
}
const esiNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};
function renderFaction(f, showDesc, index) {
    const prefix = index ? `${index + 1}. ` : "";
    const stations = esiNum(f?.station_count);
    const stationSystems = esiNum(f?.station_system_count);
    const corp = esiNum(f?.corporation_id);
    const militia = esiNum(f?.militia_corporation_id);
    const home = esiNum(f?.solar_system_id);
    const size = esiNum(f?.size_factor);
    const lines = [
        `${prefix}${f?.name ?? "(unnamed)"}  [faction ${f?.faction_id ?? "?"}]`,
        corp ? `run by corporation ${corp}` : "not run by a player corporation",
        home ? `home solar system ${home}` : "no home solar system published",
        stations !== null ? `holds ${stations.toLocaleString()} station(s)${stationSystems !== null ? ` across ${stationSystems.toLocaleString()} system(s)` : ""}` : "station count not published",
        militia ? `militia corporation ${militia}, so this faction holds territory through a player body` : "no militia corporation, so this faction cannot hold territory",
        f?.is_unique === true
            ? "flagged is_unique: a permanent NPC faction, not a player-run one"
            : "not flagged is_unique, so it is an incidental entity rather than a power",
        size !== null ? `size factor ${size}` : "",
    ].filter(Boolean);
    if (showDesc && f?.description)
        lines.push("", String(f.description).replace(/\s+/g, " ").trim());
    return lines.join("\n");
}
/** Live factional warfare: which constellations are contested, by whom, and whether a boss is present. */
export async function incursionWatch(args) {
    const raw = await esi("/incursions/");
    const rows = Array.isArray(raw) ? raw : [];
    if (!rows.length) {
        return [
            "No active incursions.",
            "",
            "Factional warfare moves in waves and a lull between them is normal, so an empty list means the current wave is not contested rather than that the feature is broken. Corps report the next scheduled wave separately; this endpoint only carries the state that is live right now.",
        ].join("\n");
    }
    const factions = await esi("/universe/factions/").catch(() => []);
    const factionName = new Map();
    for (const f of factions) {
        const id = esiNum(f?.faction_id);
        if (id !== null)
            factionName.set(id, String(f?.name ?? `faction ${id}`));
    }
    const filtered = rows.filter((r) => {
        if (args.faction_id !== undefined && esiNum(r?.faction_id) !== Math.floor(args.faction_id))
            return false;
        if (args.constellation_id !== undefined && esiNum(r?.constellation_id) !== Math.floor(args.constellation_id))
            return false;
        return true;
    });
    if (!filtered.length) {
        return [
            `No active incursion matches ${args.faction_id !== undefined ? `faction ${args.faction_id}` : ""}${args.faction_id !== undefined && args.constellation_id !== undefined ? " and " : ""}${args.constellation_id !== undefined ? `constellation ${args.constellation_id}` : ""}. ${rows.length} incursion(s) are active right now, listing: ${[...new Set(rows.map((r) => factionName.get(esiNum(r?.faction_id) ?? -1) ?? `faction ${r?.faction_id}`))].join(", ")}.`,
        ].join("\n");
    }
    const named = [];
    for (const r of filtered) {
        const cid = esiNum(r?.constellation_id) ?? 0;
        let cname = `constellation ${cid}`;
        try {
            const d = await esi(`/universe/constellations/${cid}/`);
            if (d?.name)
                cname = `${d.name} (${cid})`;
        }
        catch { /* keep the id */ }
        const fid = esiNum(r?.faction_id) ?? 0;
        named.push({
            constellation: cname,
            constellationId: cid,
            faction: factionName.get(fid) ?? `faction ${fid}`,
            factionId: fid,
            boss: r?.has_boss === true,
            systems: Array.isArray(r?.infested_solar_systems) ? r.infested_solar_systems.map(Number) : [],
        });
    }
    named.sort((a, b) => a.faction.localeCompare(b.faction) || a.constellation.localeCompare(b.constellation));
    const totalSystems = named.reduce((a, n) => a + n.systems.length, 0);
    const bosses = named.filter((n) => n.boss);
    const lines = [
        `Factional warfare: ${named.length} active incursion(s), ${totalSystems} infested solar system(s)`,
        "",
        `${"faction".padEnd(30)}${"constellation".padEnd(26)}${"systems".padEnd(9)}boss`,
    ];
    for (const n of named) {
        lines.push(`${n.faction.slice(0, 29).padEnd(30)}${n.constellation.slice(0, 25).padEnd(26)}${String(n.systems.length).padEnd(9)}${n.boss ? "PRESENT" : "no"}`);
    }
    lines.push("", "A boss event means a faction is running a sanctioned capital-complex assault in that constellation. Bosses are announced separately by the factions themselves and are the only reliably known schedule in this feature, so a boss row is a real time window while everything else here is live state with no timetable.");
    if (bosses.length) {
        lines.push("", `Boss event present in: ${bosses.map((b) => `${b.faction} at ${b.constellation}`).join("; ")}. A faction preparing a boss will stop reinforcing its other incursions beforehand, so the appearance of one narrows where the next pressure lands.`);
    }
    else {
        lines.push("", "No boss is present in any active incursion, so no capital-complex assault is running right now.");
    }
    const byFaction = new Map();
    for (const n of named)
        byFaction.set(n.faction, (byFaction.get(n.faction) ?? 0) + n.systems.length);
    const ranked = [...byFaction.entries()].sort((a, b) => b[1] - a[1]);
    lines.push("", `System count by faction: ${ranked.map(([f, n]) => `${f} ${n}`).join("; ")}.`);
    lines.push("", "This is live state read once, not a watch. Solar system ids are returned rather than names, because the system detail routes are not available on this deployment, and an id alone cannot be turned into a system name from here.");
    return lines.join("\n");
}
