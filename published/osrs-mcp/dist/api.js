/**
 * Old School RuneScape client.
 *  - Hiscores:  index_lite.ws returns plain text, one line per skill.
 *  - GE prices: the official runescape.wiki prices API (keyless, free).
 */
const HISCORES = {
    normal: "https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws",
    ironman: "https://secure.runescape.com/m=hiscore_oldschool_ironman/index_lite.ws",
    ultimate: "https://secure.runescape.com/m=hiscore_oldschool_ultimate/index_lite.ws",
    hardcore: "https://secure.runescape.com/m=hiscore_oldschool_hardcore_ironman/index_lite.ws",
    deadman: "https://secure.runescape.com/m=hiscore_oldschool_deadman/index_lite.ws",
};
const PRICES = "https://prices.runescape.wiki/api/v1/osrs";
const UA = "osrs-mcp/1.0 (https://github.com/mrfentmen/osrs-mcp)";
export class OsrsError extends Error {
}
async function fetchText(url) {
    const res = await fetch(url, {
        headers: { Accept: "text/plain", "User-Agent": UA },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
        if (res.status === 404)
            throw new OsrsError(`Player not found (404).`);
        throw new OsrsError(`OSRS API error ${res.status}: ${res.statusText}`);
    }
    return await res.text();
}
async function fetchJson(url) {
    const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": UA },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new OsrsError(`OSRS API error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
// ---------------------------------------------------------------------------
// Hiscores
// ---------------------------------------------------------------------------
const SKILLS = [
    "attack", "defence", "strength", "hitpoints", "ranged", "prayer", "magic",
    "cooking", "woodcutting", "fletching", "fishing", "firemaking", "crafting",
    "smithing", "mining", "herblore", "agility", "thieving", "slayer", "farming",
    "runecraft", "hunter", "construction",
];
const ACTIVITIES = [
    "League Points", "Deadman Points", "Bounty Hunter - Hunter", "Bounty Hunter - Rogue",
    "Bounty Hunter (Legacy) - Hunter", "Bounty Hunter (Legacy) - Rogue",
    "Clue Scrolls (all)", "Clue Scrolls (beginner)", "Clue Scrolls (easy)",
    "Clue Scrolls (medium)", "Clue Scrolls (hard)", "Clue Scrolls (elite)",
    "Clue Scrolls (master)", "LMS - Rank", "PvP Arena - Rank", "Soul Wars Zeal",
    "Rifts closed", "Colosseum Glory", "Collections Logged", "Collection Log Slots",
    "Abyssal Sire", "Alchemical Hydra", "Amoxliatl", "Araxxor", "Artio", "Barrows Chests",
    "Bryophyta", "Callisto", "Calvar'ion", "Cerberus", "Chambers of Xeric",
    "Chambers of Xeric: Challenge Mode", "Chaos Elemental", "Chaos Fanatic", "Commander Zilyana",
    "Corporeal Beast", "Crazy Archaeologist", "Dagannoth Prime", "Dagannoth Rex",
    "Dagannoth Supreme", "Deranged Archaeologist", "Duke Sucellus", "General Graardor",
    "Giant Mole", "Grotesque Guardians", "Hespori", "Kalphite Queen", "King Black Dragon",
    "Kraken", "Kree'Arra", "K'ril Tsutsaroth", "Lunar Chests", "Mimic", "Mogres",
    "Nex", "Nightmare", "Phosani's Nightmare", "Obor", "Phantom Muspah", "Sarachnis",
    "Scorpia", "Scurrius", "Skotizo", "Sol Heredit", "Spindel", "Tempoross", "The Gauntlet",
    "The Corrupted Gauntlet", "The Leviathan", "The Whisperer", "The Hueycoatl", "The Royal Titans",
    "Theatre of Blood", "Theatre of Blood: Hard Mode", "Thermonuclear Smoke Devil",
    "Tombs of Amascut", "Tombs of Amascut: Expert Mode", "TzKal-Zuk", "TzTok-Jad", "Vardorvis",
    "Venenatis", "Vet'ion", "Vorkath", "Wintertodt", "Zalcano", "Zulrah",
];
export async function getPlayerStats(username, mode = "normal") {
    const text = await fetchText(`${HISCORES[mode]}?player=${encodeURIComponent(username)}`);
    const lines = text.trim().split("\n").filter((l) => l.trim().length > 0);
    // Line 0 is the overall entry (rank, total level, total xp).
    const [or, ol, ox] = lines[0].split(",").map((n) => parseInt(n, 10));
    const overall = { skill: "overall", rank: or, level: ol, xp: ox };
    const skills = [];
    for (let i = 0; i < SKILLS.length; i++) {
        // Skills start at line 1 (line 0 is the overall entry).
        const [rank, level, xp] = lines[i + 1].split(",").map((n) => parseInt(n, 10));
        skills.push({ skill: SKILLS[i], rank, level, xp });
    }
    const activities = [];
    for (let i = 0; i < ACTIVITIES.length; i++) {
        const raw = lines[SKILLS.length + i];
        if (!raw)
            break;
        const [rank, score] = raw.split(",").map((n) => parseInt(n, 10));
        activities.push({ activity: ACTIVITIES[i], rank, score });
    }
    return { username, mode, overall, skills, activities };
}
let mappingCache = null;
async function mapping() {
    if (!mappingCache) {
        mappingCache = await fetchJson(`${PRICES}/mapping`);
    }
    return mappingCache;
}
export async function getItemPrice(name) {
    const map = await mapping();
    const q = name.toLowerCase().trim();
    const entry = map.find((m) => m.name.toLowerCase() === q) ??
        map.find((m) => m.name.toLowerCase().includes(q));
    if (!entry)
        return null;
    const latest = await fetchJson(`${PRICES}/latest`);
    const price = latest.data[String(entry.id)] ?? {};
    return {
        name: entry.name,
        id: entry.id,
        high: price.high ?? -1,
        low: price.low ?? -1,
        members: entry.members,
    };
}
/**
 * Hottest items on the GE right now, ranked by trade volume in the last
 * hour (the wiki prices API exposes current prices + volume; there is no
 * historical change endpoint, so "movement" is measured as activity).
 */
export async function getHotItems(limit = 10) {
    const [map, data] = await Promise.all([
        mapping(),
        fetchJson(`${PRICES}/1h`),
    ]);
    const nameById = new Map(map.map((m) => [m.id, m.name]));
    const items = [];
    for (const [id, d] of Object.entries(data.data)) {
        const volume = (d.highPriceVolume ?? 0) + (d.lowPriceVolume ?? 0);
        if (volume <= 0)
            continue;
        items.push({
            name: nameById.get(Number(id)) ?? `item ${id}`,
            id: Number(id),
            avgHigh: d.avgHighPrice ?? -1,
            avgLow: d.avgLowPrice ?? -1,
            volume,
        });
    }
    items.sort((a, b) => b.volume - a.volume);
    return items.slice(0, limit);
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
// Activities that aren't boss kill counts (points, ranks, misc scores).
const NON_KC = new Set([
    "League Points", "Deadman Points",
    "Bounty Hunter - Hunter", "Bounty Hunter - Rogue",
    "Bounty Hunter (Legacy) - Hunter", "Bounty Hunter (Legacy) - Rogue",
    "Clue Scrolls (all)", "Clue Scrolls (beginner)", "Clue Scrolls (easy)",
    "Clue Scrolls (medium)", "Clue Scrolls (hard)", "Clue Scrolls (elite)",
    "Clue Scrolls (master)", "LMS - Rank", "PvP Arena - Rank", "Soul Wars Zeal",
    "Rifts closed", "Colosseum Glory", "Collections Logged", "Collection Log Slots",
]);
export function formatStats(p) {
    const total = p.overall;
    const lines = [
        `${p.username} (${p.mode}) — Overall: level ${total.level}, ${total.xp.toLocaleString()} XP, rank ${total.rank.toLocaleString()}`,
    ];
    const notable = p.skills
        .filter((s) => s.level >= 90 || (s.level >= 70 && s.xp > 0))
        .sort((a, b) => b.level - a.level)
        .slice(0, 8);
    lines.push(`Top skills: ${notable.map((s) => `${s.skill} ${s.level} (${s.xp.toLocaleString()} xp)`).join(" | ")}`);
    const clue = p.activities.find((a) => a.activity === "Clue Scrolls (all)");
    if (clue && clue.score > 0)
        lines.push(`Clue scrolls: ${clue.score.toLocaleString()} completed`);
    const kc = p.activities.filter((a) => a.score > 0 && !NON_KC.has(a.activity));
    if (kc.length) {
        lines.push(`Boss KC: ${kc
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
            .map((a) => `${a.activity.split(" ")[0]} ${a.score.toLocaleString()}`)
            .join(" | ")}`);
    }
    return lines.join("\n");
}
/** Find GE items by partial name, straight off the wiki item mapping. */
export async function searchItems(query, limit = 15) {
    const q = query.toLowerCase().trim();
    if (!q)
        return [];
    const map = await mapping();
    const hits = map.filter((m) => m.name.toLowerCase().includes(q));
    hits.sort((a, b) => {
        // Exact match first, then prefix matches, then shortest name.
        const aExact = a.name.toLowerCase() === q ? 0 : a.name.toLowerCase().startsWith(q) ? 1 : 2;
        const bExact = b.name.toLowerCase() === q ? 0 : b.name.toLowerCase().startsWith(q) ? 1 : 2;
        if (aExact !== bExact)
            return aExact - bExact;
        return a.name.length - b.name.length;
    });
    return hits.slice(0, Math.min(limit, 40)).map((m) => ({
        id: m.id,
        name: m.name,
        members: m.members,
        alch: m.highalch ?? 0,
    }));
}
/** Daily/hourly price series for one item (the wiki keeps ~365 points per step). */
export async function getPriceHistory(name, timestep = "24h", points = 14) {
    const q = name.toLowerCase().trim();
    if (!q)
        return null;
    const map = await mapping();
    const entry = map.find((m) => m.name.toLowerCase() === q) ?? map.find((m) => m.name.toLowerCase().includes(q));
    if (!entry)
        return null;
    const res = await fetchJson(`${PRICES}/timeseries?timestep=${timestep}&id=${entry.id}`);
    const rows = Array.isArray(res.data) ? res.data : [];
    const slice = rows.slice(-Math.min(Math.max(points, 1), 60));
    return {
        item: { id: entry.id, name: entry.name, members: entry.members, alch: entry.highalch ?? 0 },
        timestep,
        points: slice.map((r) => ({
            timestamp: r.timestamp ?? 0,
            avgHigh: r.avgHighPrice ?? null,
            avgLow: r.avgLowPrice ?? null,
            highVolume: r.highPriceVolume ?? 0,
            lowVolume: r.lowPriceVolume ?? 0,
        })),
    };
}
/**
 * Margin between the instant-buy and instant-sell price, for items that
 * actually trade. `margin * volume` is a rough "gp per hour" signal, so
 * illiquid items with a huge spread do not dominate the list.
 */
export async function getFlips(limit = 10, minVolume = 100) {
    const [map, latest, hourly] = await Promise.all([
        mapping(),
        fetchJson(`${PRICES}/latest`),
        fetchJson(`${PRICES}/1h`),
    ]);
    const nameById = new Map(map.map((m) => [m.id, m.name]));
    const flips = [];
    for (const [id, vol] of Object.entries(hourly.data)) {
        const volume = (vol.highPriceVolume ?? 0) + (vol.lowPriceVolume ?? 0);
        if (volume < minVolume)
            continue;
        const price = latest.data[id];
        const high = price?.high ?? 0;
        const low = price?.low ?? 0;
        if (!high || !low || high <= low)
            continue;
        const margin = high - low;
        // `low` is the instant-sell price (what you pay to buy), `high` is the
        // instant-buy price (what you receive when selling), so buy low, sell high.
        flips.push({
            id: Number(id),
            name: nameById.get(Number(id)) ?? `item ${id}`,
            buy: low,
            sell: high,
            margin,
            roiPct: (margin / low) * 100,
            volume,
            potential: margin * volume,
        });
    }
    flips.sort((a, b) => b.potential - a.potential);
    return flips.slice(0, Math.min(Math.max(limit, 1), 25));
}
const gp = (value) => (value > 0 ? `${value.toLocaleString()} gp` : "n/a");
const count = (value) => value.toLocaleString();
const numOr = (value, fallback) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);
function findItem(map, name) {
    const q = (name ?? "").toLowerCase().trim();
    if (!q)
        return null;
    return map.find((m) => m.name.toLowerCase() === q) ?? map.find((m) => m.name.toLowerCase().includes(q)) ?? null;
}
/**
 * How much of an item actually trades in a day, and how many buy-limit windows
 * that volume represents — the wiki API publishes volume but nothing that
 * relates it to the 4-hourly GE buy limit, which is what a buyer needs.
 */
export async function itemVolume(args) {
    const size = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 30);
    const [map, volumes] = await Promise.all([mapping(), fetchJson(`${PRICES}/volumes`)]);
    const volumeOf = (id) => Math.trunc(volumes.data[String(id)] ?? 0);
    const wanted = (args.name ?? "").trim();
    if (wanted) {
        const entry = findItem(map, wanted);
        if (!entry)
            throw new OsrsError(`No Grand Exchange item matches "${wanted}".`);
        const volume = volumeOf(entry.id);
        const buyLimit = Math.trunc(entry.limit ?? 0);
        const windows = buyLimit > 0 && volume > 0 ? (volume / buyLimit).toFixed(1) : "n/a";
        return [
            `Traded volume: ${entry.name} (id ${entry.id}${entry.members ? ", members" : ""})`,
            `  24h volume: ${count(volume)} item(s)`,
            `  GE buy limit: ${buyLimit > 0 ? `${count(buyLimit)} per 4 hours, so ${count(buyLimit * 6)} a day` : "not published"}`,
            `  daily volume covers ${windows} buy-limit window(s)`,
            volume === 0 ? "  nothing traded today, so any price you see is stale." : "",
            buyLimit > 0 && volume > 0 && volume < buyLimit ? "  thin market: a day's trade is less than one buy limit, so expect slow fills." : "",
        ].filter((line) => line !== "").join("\n");
    }
    const rows = map
        .map((m) => ({ name: m.name, id: m.id, members: m.members, volume: volumeOf(m.id), buyLimit: Math.trunc(m.limit ?? 0) }))
        .filter((row) => row.volume > 0)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, size);
    if (!rows.length)
        throw new OsrsError("The wiki volume feed returned no traded items.");
    const total = map.reduce((sum, m) => sum + volumeOf(m.id), 0);
    return [
        `Most traded items in the last 24 hours (top ${rows.length} of ${map.length} items)`,
        `Whole market: ${count(total)} item(s) changed hands across every item.`,
        "",
        ...rows.map((row, i) => `${String(i + 1).padStart(2)}. ${row.name}${row.members ? " *" : ""} — ${count(row.volume)} traded, buy limit ${row.buyLimit > 0 ? `${count(row.buyLimit)}/4h (x${(row.volume / row.buyLimit).toFixed(1)} a day)` : "n/a"}`),
        "",
        "* members-only item.",
    ].join("\n");
}
/**
 * One item's price in every window the wiki publishes (instant, 5 minutes, an
 * hour, a day), so a buy or sell is not made off a single stale print.
 */
export async function priceWindows(args) {
    const map = await mapping();
    const entry = findItem(map, args.name);
    if (!entry)
        throw new OsrsError(`No Grand Exchange item matches "${args.name}".`);
    const key = String(entry.id);
    const [latest, fiveMin, hour, day] = await Promise.all([
        fetchJson(`${PRICES}/latest`),
        fetchJson(`${PRICES}/5m`),
        fetchJson(`${PRICES}/1h`),
        fetchJson(`${PRICES}/24h`),
    ]);
    const instant = latest.data[key] ?? {};
    const window = (shape, label) => {
        const row = shape.data[key];
        if (!row)
            return `  ${label.padEnd(8)} no trades in this window`;
        const high = numOr(row.avgHighPrice, 0);
        const low = numOr(row.avgLowPrice, 0);
        const volume = (row.highPriceVolume ?? 0) + (row.lowPriceVolume ?? 0);
        return `  ${label.padEnd(8)} buy ${gp(high)} | sell ${gp(low)} | ${count(Math.trunc(volume))} traded`;
    };
    const dayRow = day.data[key];
    const dayHigh = numOr(dayRow?.avgHighPrice, 0);
    const instantHigh = numOr(instant.high, 0);
    const drift = dayHigh > 0 && instantHigh > 0 ? ((instantHigh - dayHigh) / dayHigh) * 100 : 0;
    return [
        `Price windows: ${entry.name} (id ${entry.id}${entry.members ? ", members" : ""})`,
        `  instant  buy ${gp(numOr(instant.high, 0))} | sell ${gp(numOr(instant.low, 0))}`,
        window(fiveMin, "5m"),
        window(hour, "1h"),
        window(day, "24h"),
        "",
        dayHigh > 0
            ? `The instant buy price is ${drift >= 0 ? "up" : "down"} ${Math.abs(drift).toFixed(1)}% against the 24h average of ${gp(dayHigh)}.`
            : "No 24h average to compare against.",
        `Buy limit ${numOr(entry.limit, 0) > 0 ? `${gp(numOr(entry.limit, 0))} per 4 hours` : "not published"} — windows with no trades mean an illiquid item, not a free price.`,
    ].join("\n");
}
/**
 * Which items are worth high-alching right now: the alchemy value against the
 * current sell price, ranked, with the buy limit that caps the profit per
 * window. The nature rune is not included, so the figure is gross.
 */
export async function alchProfit(args) {
    const size = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 40);
    const [map, latest] = await Promise.all([mapping(), fetchJson(`${PRICES}/latest`)]);
    const rows = map
        .filter((m) => !args.membersOnly || m.members)
        .map((m) => {
        const price = latest.data[String(m.id)] ?? {};
        const sell = numOr(price.low, 0);
        const highalch = Math.trunc(m.highalch ?? 0);
        return { name: m.name, id: m.id, members: m.members, sell, highalch, profit: highalch > 0 && sell > 0 ? highalch - sell : 0, buyLimit: Math.trunc(m.limit ?? 0) };
    })
        .filter((row) => row.profit > 0)
        .sort((a, b) => b.profit - a.profit)
        .slice(0, size);
    if (!rows.length)
        throw new OsrsError("No item is profitable to alch at the current prices.");
    return [
        `Best high-alchemy margins (gross, before the nature rune)`,
        "",
        ...rows.map((row, i) => `${String(i + 1).padStart(2)}. ${row.name}${row.members ? " *" : ""} — buy ${gp(row.sell)}, alch ${gp(row.highalch)}, profit ${gp(row.profit)} each${row.buyLimit > 0 ? `, ${gp(row.buyLimit)}/4h` : ""}`),
        "",
        "profit = high alch value minus the current buy price; a nature rune costs extra.",
        "* members-only item.",
    ].join("\n");
}
const PLAYER_MODES = Object.keys(HISCORES);
function parseMode(mode) {
    const wanted = (mode ?? "normal").toLowerCase().trim();
    const found = PLAYER_MODES.find((m) => m === wanted);
    if (!found)
        throw new OsrsError(`Unknown mode "${mode}". Use one of: ${PLAYER_MODES.join(", ")}.`);
    return found;
}
/**
 * Two players side by side: overall level and XP gap, the skills with the
 * biggest difference, and the activities where both have a score.
 */
export async function playerCompare(args) {
    const mode = parseMode(args.mode);
    const [a, b] = await Promise.all([getPlayerStats(args.playerA, mode), getPlayerStats(args.playerB, mode)]);
    return renderCompare(a, b, mode);
}
function renderCompare(a, b, mode) {
    const bByName = new Map(b.skills.map((s) => [s.skill, s]));
    const diffs = a.skills
        .filter((s) => s.level > 0 || (bByName.get(s.skill)?.level ?? 0) > 0)
        .map((s) => {
        const other = bByName.get(s.skill);
        return { skill: s.skill, levelGap: s.level - (other?.level ?? 0), xpGap: s.xp - (other?.xp ?? 0), a: s, b: other };
    })
        .sort((x, y) => Math.abs(y.xpGap) - Math.abs(x.xpGap));
    const levelGap = a.overall.level - b.overall.level;
    const xpGap = a.overall.xp - b.overall.xp;
    const bAct = new Map(b.activities.map((entry) => [entry.activity, entry]));
    const shared = a.activities
        .filter((entry) => entry.score > 0 && (bAct.get(entry.activity)?.score ?? 0) > 0)
        .map((entry) => ({ activity: entry.activity, a: entry.score, b: bAct.get(entry.activity)?.score ?? 0 }))
        .sort((x, y) => Math.abs(y.a - y.b) - Math.abs(x.a - x.b))
        .slice(0, 8);
    return [
        `Player compare (${mode})`,
        `  ${a.username}: total level ${count(a.overall.level)}, ${count(a.overall.xp)} xp, rank ${count(a.overall.rank)}`,
        `  ${b.username}: total level ${count(b.overall.level)}, ${count(b.overall.xp)} xp, rank ${count(b.overall.rank)}`,
        "",
        levelGap === 0
            ? "Identical total level."
            : `${levelGap > 0 ? a.username : b.username} holds ${Math.abs(levelGap)} more total level(s) and ${count(Math.abs(xpGap))} more xp.`,
        "",
        "Biggest skill gaps:",
        ...diffs
            .slice(0, 10)
            .map((d) => `  ${d.skill.padEnd(14)} ${d.a.level} vs ${d.b?.level ?? 0} (level ${d.levelGap >= 0 ? "+" : "-"}${Math.abs(d.levelGap)}, xp ${d.xpGap >= 0 ? "+" : "-"}${count(Math.abs(d.xpGap))})`),
        shared.length ? "\nActivities both have scores in:" : "\nNeither player has a shared scored activity.",
        ...shared.map((s) => `  ${s.activity}: ${count(s.a)} vs ${count(s.b)}`),
    ].join("\n");
}
// ---- muxH tools:
const WIKI = "https://oldschool.runescape.wiki/api.php";
const WIKI_UA = "osrs-mcp/1.1 (https://github.com/mrfentmen/osrs-mcp)";
const WIKI_CATEGORY_SKIP = /^Category:(Content released in|Notes?|Redirects?|Articles needing |Wiki (?:reference|maintenance)|Pages with |Magic (?:numbers|IDs)|Update:)/;
async function wikiGet(params) {
    const url = `${WIKI}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
    const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": WIKI_UA },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new OsrsError(`OSRS Wiki API error ${res.status}: ${res.statusText}`);
    const body = (await res.json());
    if (body?.error)
        throw new OsrsError(`OSRS Wiki rejected the query: ${body.error.info ?? "unknown reason"}`);
    return body;
}
const stripTags = (html) => html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
/**
 * Search the Old School RuneScape Wiki. The GE tools answer "what does this
 * cost"; this answers "what is this thing", over the same item names.
 */
export async function wikiSearch(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new OsrsError("Give something to search the wiki for.");
    const size = Math.min(Math.max(Math.trunc(args.limit ?? 8), 1), 20);
    const res = await wikiGet({
        action: "query",
        list: "search",
        srsearch: q,
        srlimit: String(size),
        srprop: "wordcount|snippet",
    });
    const hits = res.query?.search ?? [];
    if (!hits.length)
        throw new OsrsError(`The OSRS Wiki has no page matching "${q}".`);
    const total = res.query?.searchinfo?.totalhits;
    return [
        `OSRS Wiki search: "${q}"${typeof total === "number" ? ` (${count(total)} pages match)` : ""}`,
        "",
        ...hits.map((hit, i) => {
            const snippet = hit.snippet ? stripTags(hit.snippet) : "";
            const words = typeof hit.wordcount === "number" ? `, ${count(hit.wordcount)} words` : "";
            return `${String(i + 1).padStart(2)}. ${hit.title}${words}\n    ${snippet ? `${snippet.slice(0, 180)}` : "no snippet"}`;
        }),
    ].join("\n");
}
/**
 * The wiki article for a Grand Exchange item: what it is, where it comes from
 * and how it is classified, next to what the exchange is paying right now.
 */
export async function itemLore(args) {
    const map = await mapping();
    const entry = findItem(map, args.name);
    if (!entry)
        throw new OsrsError(`No Grand Exchange item matches "${args.name}".`);
    const page = await wikiGet({
        action: "query",
        prop: "extracts|pageprops|categories",
        exintro: "1",
        explaintext: "1",
        cllimit: "80",
        titles: entry.name,
    });
    const found = Object.values(page.query?.pages ?? {})[0];
    if (!found || found.missing !== undefined) {
        return [`${entry.name} (id ${entry.id}) has a Grand Exchange entry but no Old School RuneScape Wiki article.`, "Nothing to report beyond the price tools."].join("\n");
    }
    const latest = await fetchJson(`${PRICES}/latest`);
    const price = latest.data[String(entry.id)] ?? {};
    const high = numOr(price.high, 0);
    const low = numOr(price.low, 0);
    const categories = (found.categories ?? [])
        .map((c) => c.title ?? "")
        .filter((title) => title.startsWith("Category:") && !WIKI_CATEGORY_SKIP.test(title))
        .map((title) => title.slice("Category:".length));
    const shown = categories.slice(0, 14);
    const summary = (found.pageprops?.description ?? found.extract ?? "").trim();
    return [
        `${found.title ?? entry.name} — wiki article (id ${found.pageid ?? "not reported"})`,
        summary ? `\n${summary.slice(0, 420)}` : "\nThe wiki publishes no summary for this page.",
        "",
        `Grand Exchange right now: buy ${gp(high)} | sell ${gp(low)}${entry.members ? " | members only" : ""}`,
        `  high alch ${gp(Math.trunc(entry.highalch ?? 0))}, GE buy limit ${numOr(entry.limit, 0) > 0 ? `${count(Math.trunc(entry.limit ?? 0))} per 4 hours` : "not published"}`,
        found.pageprops?.page_image_free ? `Wiki image: ${found.pageprops.page_image_free}` : "Wiki image: not reported",
        "",
        shown.length ? `Classified as: ${shown.join(" | ")}${categories.length > shown.length ? ` (+${categories.length - shown.length} more categories)` : ""}` : "The wiki page carries no item categories.",
    ].join("\n");
}
