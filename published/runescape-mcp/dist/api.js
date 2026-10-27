const m0 = (() => {
    const UA = 'mrfentmen-runescape-mcp/1.0';
    async function hiscore(args) {
        const player = (args.player ?? '').trim();
        if (!player)
            return 'Provide a player name.';
        const url = `https://secure.runescape.com/m=hiscore/index_lite.ws?player=${encodeURIComponent(player)}`;
        const res = await fetch(url, {
            headers: { 'User-Agent': UA, Accept: 'text/plain' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`RuneScape returned ${res.status}`);
        const text = await res.text();
        const lines = text.split('\n').filter(Boolean);
        if (!lines.length)
            return `No hiscore data for ${player}.`;
        const skills = ['Overall', 'Attack', 'Defence', 'Strength', 'Constitution', 'Ranged', 'Prayer', 'Magic', 'Cooking', 'Woodcutting', 'Fletching', 'Fishing', 'Firemaking', 'Crafting', 'Smithing', 'Mining', 'Herblore', 'Agility', 'Thieving', 'Slayer', 'Farming', 'Runecrafting', 'Hunter', 'Construction', 'Summoning', 'Dungeoneering', 'Divination', 'Invention', 'Archaeology', 'Necromancy'];
        const rows = lines.slice(0, 30).map((l, i) => {
            const parts = l.split(',');
            const rank = parts[0];
            const level = parts[1];
            const xp = parts[2];
            const name = skills[i] ?? `Skill ${i}`;
            return `${name}: level ${level ?? '?'} (xp ${xp ?? '?'}, rank ${rank ?? '?'})`;
        });
        return `RuneScape 3 hiscore for ${player}:\n${rows.join('\n')}`;
    }
    return { hiscore };
})();
const m1 = (() => {
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
    class OsrsError extends Error {
    }
    async function fetchText(url) {
        const res = await fetch(url, {
            headers: { Accept: "text/plain", "User-Agent": UA },
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
    async function getPlayerStats(username, mode = "normal") {
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
    // ---------------------------------------------------------------------------
    // Grand Exchange
    // ---------------------------------------------------------------------------
    let mappingCache = null;
    async function mapping() {
        if (!mappingCache) {
            mappingCache = await fetchJson(`${PRICES}/mapping`);
        }
        return mappingCache;
    }
    async function getItemPrice(name) {
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
    async function getHotItems(limit = 10) {
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
    function formatStats(p) {
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
    return { OsrsError, formatStats, getHotItems, getItemPrice, getPlayerStats };
})();
export const OsrsError = m1.OsrsError;
export const formatStats = m1.formatStats;
export const getHotItems = m1.getHotItems;
export const getItemPrice = m1.getItemPrice;
export const getPlayerStats = m1.getPlayerStats;
export const hiscore = m0.hiscore;
export const m0_hiscore = m0.hiscore;
export const m1_getHotItems = m1.getHotItems;
export const m1_getPlayerStats = m1.getPlayerStats;
export const m1_OsrsError = m1.OsrsError;
export const m1_getItemPrice = m1.getItemPrice;
export const m1_formatStats = m1.formatStats;
// ---- gap2d tools:
// The Old School RuneScape Wiki is an open MediaWiki instance, so it answers the
// same api.php the rest of the wiki family does. Nothing here touches the
// hiscore or Grand Exchange services: this is the encyclopaedic side, which the
// server had no way to reach before.
const RS_WIKI_API = 'https://oldschool.runescape.wiki/api.php';
const RS_WIKI_PAGE = 'https://oldschool.runescape.wiki/wiki/';
const RS_WIKI_UA = 'mrfentmen-runescape-mcp/1.0 (https://github.com/mrfentmen)';
async function rsWikiGet(params) {
    const qs = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
    const res = await fetch(`${RS_WIKI_API}?${qs.toString()}`, {
        headers: { 'User-Agent': RS_WIKI_UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`The OSRS Wiki returned ${res.status}`);
    return (await res.json());
}
function rsWikiUrl(title) {
    return `${RS_WIKI_PAGE}${encodeURIComponent(title.replace(/ /g, '_'))}`;
}
/** Resolve a free-text topic to a wiki page title, preferring an exact title. */
async function rsWikiResolve(topic) {
    const want = topic.trim();
    const found = await rsWikiGet({
        action: 'query',
        list: 'search',
        srsearch: want,
        srlimit: '5',
    });
    const hits = found.query?.search ?? [];
    const exact = hits.find((h) => (h.title ?? '').toLowerCase() === want.toLowerCase());
    const best = exact ?? hits[0];
    if (!best?.title)
        throw new Error(`The OSRS Wiki has no page matching "${want}".`);
    return best.title;
}
/** The section headings of a wiki article, so a long page can be navigated. */
export async function wikiOutline(args) {
    const topic = (args.topic ?? '').trim();
    if (!topic)
        return 'Provide a topic to look up on the OSRS Wiki.';
    const limit = Math.max(1, Math.min(Number(args.limit ?? 30) || 30, 100));
    const title = await rsWikiResolve(topic);
    const data = await rsWikiGet({
        action: 'parse',
        page: title,
        prop: 'sections',
    });
    const sections = data.parse?.sections ?? [];
    const pageUrl = rsWikiUrl(data.parse?.title ?? title);
    if (!sections.length)
        return `"${title}" has no section headings on the OSRS Wiki.`;
    const shown = sections.slice(0, limit);
    const rows = shown.map((s) => {
        const depth = s.level === '3' ? '   ' : s.level === '4' ? '      ' : '  ';
        return `${depth}${s.line ?? 'untitled'}  (#${s.index ?? '?'})`;
    });
    const tail = sections.length > shown.length
        ? `\n…and ${sections.length - shown.length} more section(s).`
        : '';
    return `Sections of "${title}" (${sections.length}, showing ${shown.length}) — ${pageUrl}\n${rows.join('\n')}${tail}`;
}
