/**
 * Blizzard Battle.net API client. Needs BLIZZARD_CLIENT_ID + BLIZZARD_CLIENT_SECRET
 * (free at https://develop.battle.net/). Uses client-credentials grant; token cached.
 * Docs: https://develop.battle.net/documentation
 */
const REGIONS = ["us", "eu", "kr", "tw"];
export class BlizzardError extends Error {
}
let cached = null;
async function appToken(region) {
    const id = process.env.BLIZZARD_CLIENT_ID;
    const secret = process.env.BLIZZARD_CLIENT_SECRET;
    if (!id || !secret) {
        throw new BlizzardError("Set BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET (free at develop.battle.net).");
    }
    if (cached && cached.exp > Date.now() + 60000)
        return cached.token;
    const res = await fetch(`https://${region}.battle.net/oauth/token`, {
        method: "POST",
        headers: {
            "User-Agent": "blizzard-mcp/1.0",
            Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new BlizzardError(`Blizzard OAuth failed (${res.status}). Check client id/secret.`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json());
    if (!data.access_token)
        throw new BlizzardError("Blizzard OAuth returned no token.");
    cached = { token: data.access_token, exp: Date.now() + (data.expires_in ?? 86000) * 1000 };
    return cached.token;
}
async function api(region, path, namespace) {
    const res = await fetch(`https://${region}.api.blizzard.com${path}?namespace=${namespace}&locale=en_US`, {
        headers: { "User-Agent": "blizzard-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${await appToken(region)}` },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new BlizzardError("Not found.");
    if (!res.ok)
        throw new BlizzardError(`Blizzard error ${res.status}`);
    return (await res.json());
}
function checkRegion(r) {
    const clean = r.trim().toLowerCase();
    if (REGIONS.includes(clean))
        return clean;
    throw new BlizzardError(`Region must be one of ${REGIONS.join(", ")}, got "${r}".`);
}
export async function wowTokenPrice(region) {
    const rg = checkRegion(region);
    const d = await api(rg, "/data/wow/token/index", `dynamic-${rg}`);
    const price = d.price;
    const updated = d.last_updated_timestamp ? new Date(d.last_updated_timestamp).toISOString().slice(0, 10) : "?";
    return `WoW Token (${rg.toUpperCase()}): ${(Number(price) / 10000).toLocaleString()} gold (updated ${updated})`;
}
export async function wowAchievements(region, limit = 10) {
    const rg = checkRegion(region);
    const d = await api(rg, "/data/wow/achievement/index", `static-${rg}`);
    const rows = Array.isArray(d.achievements) ? d.achievements : [];
    return rows.slice(0, limit).map((a) => ({ id: Number(a.id), name: String(a.name ?? "?") }));
}
export async function diabloSeasons(region) {
    const rg = checkRegion(region);
    const d = await api(rg, "/data/d3/season/index", `static-${rg}`);
    const rows = Array.isArray(d.season) ? d.season : [];
    return rows.slice(-5).map((s) => ({ id: Number(s.id), name: undefined })).reverse();
}
// ---- muxB tools:
// Blizzard's usual daily reset and the server clock each region's realms run on.
// Both are overridable, because a realm can be moved and maintenance windows move.
const BZ_REALMS = {
    us: { zone: "America/Los_Angeles", resetHour: 5, label: "US realms (Pacific)" },
    eu: { zone: "Europe/Berlin", resetHour: 2, label: "EU realms (Central Europe)" },
    kr: { zone: "Asia/Seoul", resetHour: 5, label: "Korean realms" },
    tw: { zone: "Asia/Taipei", resetHour: 5, label: "Taiwan realms" },
};
function bzParts(zone, date) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: zone,
        hour12: false,
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
    const out = {};
    for (const p of fmt.formatToParts(date))
        out[p.type] = p.value;
    return out;
}
/** UTC instant of a given wall-clock time in a zone, resolved by Intl. */
function bzZonedToUtc(zone, year, month, day, hour, minute) {
    // start from the naive reading as if it were UTC, then correct by the zone offset
    const naive = Date.UTC(year, month - 1, day, hour, minute);
    let guess = naive;
    for (let i = 0; i < 3; i++) {
        const p = bzParts(zone, new Date(guess));
        const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), (Number(p.hour) % 24) * 1, Number(p.minute));
        const drift = naive - asUtc;
        if (drift === 0)
            break;
        guess += drift;
    }
    return new Date(guess);
}
const bzDay = (ms) => Math.floor(ms / 86400000);
function bzWhen(ms, zone) {
    const p = bzParts(zone, new Date(ms));
    return `${p.weekday} ${p.day}/${p.month}/${p.year} ${String(Number(p.hour) % 24).padStart(2, "0")}:${p.minute}`;
}
function bzHuman(ms) {
    const abs = Math.abs(ms);
    const d = Math.floor(abs / 86400000);
    const h = Math.floor((abs % 86400000) / 3600000);
    const m = Math.floor((abs % 3600000) / 60000);
    const parts = d > 0 ? `${d}d ` : "";
    return `${parts}${h}h ${m}m`;
}
export async function resetCalendar(args) {
    const region = String(args.region ?? "us").trim().toLowerCase();
    const known = BZ_REALMS[region];
    if (!known)
        throw new BlizzardError(`Region must be one of ${Object.keys(BZ_REALMS).join(", ")}, got "${args.region}".`);
    const playerZone = (args.timezone ?? "").trim();
    if (playerZone) {
        try {
            new Intl.DateTimeFormat("en-GB", { timeZone: playerZone });
        }
        catch {
            throw new BlizzardError(`"${playerZone}" is not an IANA timezone name, e.g. Europe/London or America/New_York.`);
        }
    }
    const zone = playerZone || known.zone;
    const resetHour = args.reset_hour === undefined ? known.resetHour : Math.min(Math.max(Math.round(Number(args.reset_hour)), 0), 23);
    const weeks = Math.min(Math.max(Number(args.weeks ?? 1), 1), 4);
    const now = Date.now();
    const nowParts = bzParts(known.zone, new Date(now));
    const out = [
        `${known.label}: server time ${bzWhen(now, known.zone)} (server clock ${known.zone}), your time ${bzWhen(now, zone)} (${zone}).`,
        `Daily reset at ${String(resetHour).padStart(2, "0")}:00 server time.`,
    ];
    const resets = [];
    let offsetSeen = "";
    let offsetChanged = false;
    for (let d = 0; d <= weeks * 7 + 2; d++) {
        const p = bzParts(known.zone, new Date(now + d * 86400000));
        const at = bzZonedToUtc(known.zone, Number(p.year), Number(p.month), Number(p.day), resetHour, 0).getTime();
        if (at <= now)
            continue;
        if (resets.length > 0 && at - resets[resets.length - 1] < 82800000)
            continue;
        resets.push(at);
        const off = new Intl.DateTimeFormat("en-GB", { timeZone: known.zone, timeZoneName: "shortOffset" }).format(new Date(at));
        if (offsetSeen === "")
            offsetSeen = off;
        else if (off !== offsetSeen)
            offsetChanged = true;
    }
    const first = resets.length > 0 ? resets[0] : 0;
    const zoneTag = new Intl.DateTimeFormat("en-GB", { timeZone: zone, timeZoneName: "short" })
        .formatToParts(new Date(first === 0 ? now : first))
        .find((p) => p.type === "timeZoneName")?.value ?? zone;
    const schedule = resets.map((at, i) => {
        const tag = i === 0 ? "next one" : `${bzHuman(at - first)} later`;
        return `  ${bzWhen(at, zone)} ${zoneTag}  (in ${bzHuman(at - now)}, ${tag})`;
    });
    if (offsetChanged) {
        schedule.push("  note: the server clock offset changes inside this window, so these are not evenly spaced in real hours");
    }
    out.push("", `Next ${resets.length} reset(s):`, ...schedule);
    out.push("", "Weekly maintenance opens on Tuesday at the same reset hour and closes about three hours later.", `Next reset in your own zone: ${first === 0 ? "not resolvable" : bzWhen(first, zone)}.`, "Countdowns use daylight saving rules, so they stay right across a clock change.");
    return out.join("\n");
}
