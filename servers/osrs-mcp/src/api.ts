/**
 * Old School RuneScape client.
 *  - Hiscores:  index_lite.ws returns plain text, one line per skill.
 *  - GE prices: the official runescape.wiki prices API (keyless, free).
 */

const HISCORES: Record<string, string> = {
  normal: "https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws",
  ironman: "https://secure.runescape.com/m=hiscore_oldschool_ironman/index_lite.ws",
  ultimate: "https://secure.runescape.com/m=hiscore_oldschool_ultimate/index_lite.ws",
  hardcore: "https://secure.runescape.com/m=hiscore_oldschool_hardcore_ironman/index_lite.ws",
  deadman: "https://secure.runescape.com/m=hiscore_oldschool_deadman/index_lite.ws",
}

const PRICES = "https://prices.runescape.wiki/api/v1/osrs"
const UA = "osrs-mcp/1.0 (https://github.com/mrfentmen/osrs-mcp)"

export class OsrsError extends Error {}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { Accept: "text/plain", "User-Agent": UA },
  })
  if (!res.ok) {
    if (res.status === 404) throw new OsrsError(`Player not found (404).`)
    throw new OsrsError(`OSRS API error ${res.status}: ${res.statusText}`)
  }
  return await res.text()
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
  })
  if (!res.ok) throw new OsrsError(`OSRS API error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Hiscores
// ---------------------------------------------------------------------------

const SKILLS = [
  "attack", "defence", "strength", "hitpoints", "ranged", "prayer", "magic",
  "cooking", "woodcutting", "fletching", "fishing", "firemaking", "crafting",
  "smithing", "mining", "herblore", "agility", "thieving", "slayer", "farming",
  "runecraft", "hunter", "construction",
]

export interface SkillEntry {
  skill: string
  rank: number
  level: number
  xp: number
}

export interface ActivityEntry {
  activity: string
  rank: number
  score: number
}

export interface PlayerStats {
  username: string
  mode: string
  overall: SkillEntry
  skills: SkillEntry[]
  activities: ActivityEntry[]
}

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
]

export async function getPlayerStats(
  username: string,
  mode: keyof typeof HISCORES = "normal"
): Promise<PlayerStats> {
  const text = await fetchText(`${HISCORES[mode]}?player=${encodeURIComponent(username)}`)
  const lines = text.trim().split("\n").filter((l) => l.trim().length > 0)

  // Line 0 is the overall entry (rank, total level, total xp).
  const [or, ol, ox] = lines[0].split(",").map((n) => parseInt(n, 10))
  const overall: SkillEntry = { skill: "overall", rank: or, level: ol, xp: ox }

  const skills: SkillEntry[] = []
  for (let i = 0; i < SKILLS.length; i++) {
    // Skills start at line 1 (line 0 is the overall entry).
    const [rank, level, xp] = lines[i + 1].split(",").map((n) => parseInt(n, 10))
    skills.push({ skill: SKILLS[i], rank, level, xp })
  }

  const activities: ActivityEntry[] = []
  for (let i = 0; i < ACTIVITIES.length; i++) {
    const raw = lines[SKILLS.length + i]
    if (!raw) break
    const [rank, score] = raw.split(",").map((n) => parseInt(n, 10))
    activities.push({ activity: ACTIVITIES[i], rank, score })
  }

  return { username, mode, overall, skills, activities }
}

// ---------------------------------------------------------------------------
// Grand Exchange
// ---------------------------------------------------------------------------

interface MappingEntry {
  id: number
  name: string
  members: boolean
  highalch?: number
}

let mappingCache: MappingEntry[] | null = null

async function mapping(): Promise<MappingEntry[]> {
  if (!mappingCache) {
    mappingCache = await fetchJson<MappingEntry[]>(`${PRICES}/mapping`)
  }
  return mappingCache
}

export interface PriceInfo {
  name: string
  id: number
  high: number
  low: number
  members: boolean
}

export async function getItemPrice(name: string): Promise<PriceInfo | null> {
  const map = await mapping()
  const q = name.toLowerCase().trim()
  const entry =
    map.find((m) => m.name.toLowerCase() === q) ??
    map.find((m) => m.name.toLowerCase().includes(q))
  if (!entry) return null

  const latest = await fetchJson<{ data: Record<string, { high?: number; low?: number }> }>(
    `${PRICES}/latest`
  )
  const price = latest.data[String(entry.id)] ?? {}
  return {
    name: entry.name,
    id: entry.id,
    high: price.high ?? -1,
    low: price.low ?? -1,
    members: entry.members,
  }
}

export interface HotItem {
  name: string
  id: number
  avgHigh: number
  avgLow: number
  volume: number
}

/**
 * Hottest items on the GE right now, ranked by trade volume in the last
 * hour (the wiki prices API exposes current prices + volume; there is no
 * historical change endpoint, so "movement" is measured as activity).
 */
export async function getHotItems(limit = 10): Promise<HotItem[]> {
  const [map, data] = await Promise.all([
    mapping(),
    fetchJson<{
      data: Record<string, { avgHighPrice?: number | null; avgLowPrice?: number | null; highPriceVolume?: number; lowPriceVolume?: number }>
    }>(`${PRICES}/1h`),
  ])
  const nameById = new Map(map.map((m) => [m.id, m.name]))

  const items: HotItem[] = []
  for (const [id, d] of Object.entries(data.data)) {
    const volume = (d.highPriceVolume ?? 0) + (d.lowPriceVolume ?? 0)
    if (volume <= 0) continue
    items.push({
      name: nameById.get(Number(id)) ?? `item ${id}`,
      id: Number(id),
      avgHigh: d.avgHighPrice ?? -1,
      avgLow: d.avgLowPrice ?? -1,
      volume,
    })
  }
  items.sort((a, b) => b.volume - a.volume)
  return items.slice(0, limit)
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
])

export function formatStats(p: PlayerStats): string {
  const total = p.overall
  const lines = [
    `${p.username} (${p.mode}) — Overall: level ${total.level}, ${total.xp.toLocaleString()} XP, rank ${total.rank.toLocaleString()}`,
  ]
  const notable = p.skills
    .filter((s) => s.level >= 90 || (s.level >= 70 && s.xp > 0))
    .sort((a, b) => b.level - a.level)
    .slice(0, 8)
  lines.push(`Top skills: ${notable.map((s) => `${s.skill} ${s.level} (${s.xp.toLocaleString()} xp)`).join(" | ")}`)

  const clue = p.activities.find((a) => a.activity === "Clue Scrolls (all)")
  if (clue && clue.score > 0) lines.push(`Clue scrolls: ${clue.score.toLocaleString()} completed`)
  const kc = p.activities.filter((a) => a.score > 0 && !NON_KC.has(a.activity))
  if (kc.length) {
    lines.push(
      `Boss KC: ${kc
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((a) => `${a.activity.split(" ")[0]} ${a.score.toLocaleString()}`)
        .join(" | ")}`
    )
  }
  return lines.join("\n")
}
