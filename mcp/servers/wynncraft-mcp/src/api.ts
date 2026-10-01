/**
 * Wynncraft API v3 client, keyless.
 * Docs: https://docs.wynncraft.com/
 */
const BASE = "https://api.wynncraft.com/v3"

export class WynncraftError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "wynncraft-mcp/1.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (res.status === 404) {
    const body = (await res.json().catch(() => null)) as Raw | null
    throw new WynncraftError(String(body?.detail ?? "Not found"))
  }
  if (!res.ok) throw new WynncraftError(`Wynncraft error ${res.status}`)
  return (await res.json()) as T
}

export interface PlayerSummary {
  username: string
  online: boolean
  server?: string | null
  rank: string
  guild?: string | null
  playtime?: number
  characters: string[]
  firstJoin?: string
  lastJoin?: string
}

export async function getPlayer(name: string): Promise<PlayerSummary> {
  const p = await getJson<Raw>(`/player/${encodeURIComponent(name.trim())}?fullResult`)
  const chars: Raw = p.characters ?? {}
  const ids = Object.keys(chars)
  return {
    username: String(p.username ?? name),
    online: Boolean(p.online),
    server: p.server ?? null,
    rank: String(p.rank ?? "Player"),
    guild: p.guild ? String((p.guild as Raw).name ?? null) : null,
    playtime: typeof p.playtime === "number" ? p.playtime : undefined,
    characters: ids.slice(0, 8).map((id) => {
      const c = chars[id] as Raw
      const cls = String(c.reskin ?? c.type ?? "?").charAt(0).toUpperCase() +
        String(c.reskin ?? c.type ?? "?").slice(1).toLowerCase()
      const lvl = c.level !== undefined ? ` lvl ${c.level}` : ""
      const mode = Array.isArray(c.gamemode) && c.gamemode.length ? ` (${c.gamemode.join(", ")})` : ""
      return `${cls}${lvl}${mode}`
    }),
    firstJoin: p.firstJoin,
    lastJoin: p.lastJoin,
  }
}

export interface GuildSummary {
  name: string
  prefix?: string
  level?: number
  territories?: number
  wars?: number
  created?: string
  memberTotal?: number
  ranks: string[]
}

export async function getGuild(name: string): Promise<GuildSummary> {
  const g = await getJson<Raw>(`/guild/${encodeURIComponent(name.trim())}`)
  const members: Raw = g.members ?? {}
  const ranks: string[] = []
  for (const [rank, list] of Object.entries(members)) {
    if (rank === "total" || typeof list !== "object" || list === null) continue
    ranks.push(`${rank}: ${Object.keys(list as Raw).length}`)
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
  }
}

export interface ItemSummary {
  displayName: string
  type?: string
  tier?: string
  level?: number
  lore?: string
}

const stripHtml = (s: string): string => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()

export async function searchItems(query: string, limit = 5): Promise<ItemSummary[]> {
  const items = await getJson<Raw[]>(`/item/search/${encodeURIComponent(query.trim())}`)
  return items.slice(0, limit).map((it) => ({
    displayName: String(it.displayName ?? it.internalName ?? "?"),
    type: it.type ? `${String(it.type)}${it.subType ? `/${String(it.subType)}` : ""}` : undefined,
    tier: it.tier ? String(it.tier) : undefined,
    level: (it.requirements as Raw)?.level,
    lore: it.lore ? stripHtml(String(it.lore)).slice(0, 160) : undefined,
  }))
}

export function formatPlayer(p: PlayerSummary): string {
  const lines = [
    `${p.username} (${p.rank})${p.online ? ` — ONLINE on ${p.server ?? "?"}` : " — offline"}`,
    p.guild ? `Guild: ${p.guild}` : "",
    p.playtime !== undefined ? `Playtime: ${Math.round(p.playtime)}h` : "",
    p.characters.length ? `Characters (${p.characters.length} shown): ${p.characters.join(" · ")}` : "No characters",
    p.firstJoin ? `First join: ${String(p.firstJoin).slice(0, 10)}` : "",
    p.lastJoin ? `Last join: ${String(p.lastJoin).slice(0, 10)}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatGuild(g: GuildSummary): string {
  const lines = [
    `${g.name}${g.prefix ? ` [${g.prefix}]` : ""}`,
    g.level !== undefined ? `Level: ${g.level}` : "",
    g.territories !== undefined ? `Territories: ${g.territories}` : "",
    g.wars !== undefined ? `Wars: ${g.wars}` : "",
    g.memberTotal !== undefined ? `Members: ${g.memberTotal}` : "",
    g.ranks.length ? `By rank: ${g.ranks.join(", ")}` : "",
    g.created ? `Created: ${g.created}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatItem(it: ItemSummary, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const meta = [it.tier, it.type, it.level !== undefined ? `lvl ${it.level}` : ""].filter(Boolean).join(" · ")
  return `${prefix}${it.displayName}${meta ? ` (${meta})` : ""}${it.lore ? `\n   ${it.lore}` : ""}`
}

// ---- muxB tools:

interface BuildItem {
  displayName: string
  tier?: string
  type?: string
  subType?: string
  level?: number
  classRequirement?: string
  stats: string[]
  elements: string[]
  powderSlots?: number
  emblem?: string
  averageDps?: number
  dropRestriction?: string
}

function identSummary(raw: unknown): string[] {
  if (!raw || typeof raw !== "object") return []
  const out: string[] = []
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value && typeof value === "object" && "raw" in (value as Record<string, unknown>)) {
      const r = Number((value as Record<string, unknown>).raw)
      out.push(`${key} ${Number.isFinite(r) ? r : "?"}`)
      continue
    }
    const n = Number(value)
    if (Number.isFinite(n) && n !== 0) out.push(`${key} ${n}`)
  }
  return out.sort()
}

export async function itemBuild(query: string, limit = 5): Promise<string> {
  const q = query.trim()
  if (!q) throw new WynncraftError("Provide an item name to look up.")
  const cap = Math.max(1, Math.min(limit, 10))
  const rows = await getJson<Raw[]>(`/item/search/${encodeURIComponent(q)}`)
  const items: BuildItem[] = rows.slice(0, cap).map((it) => {
    const reqs = (it.requirements ?? {}) as Record<string, unknown>
    const stats: string[] = []
    for (const key of ["strength", "dexterity", "intelligence", "agility"]) {
      const n = Number(reqs[key])
      if (Number.isFinite(n) && n !== 0) stats.push(`${key} +${n}`)
    }
    stats.push(...identSummary(it.identifications).slice(0, 8))
    const elements = Array.isArray(it.elements) ? it.elements.map((e) => String(e)) : []
    return {
      displayName: String(it.displayName ?? it.internalName ?? "?"),
      tier: it.tier ? String(it.tier) : undefined,
      type: it.type ? String(it.type) : undefined,
      subType: it.subType ? String(it.subType) : undefined,
      level: reqs.level !== undefined ? Number(reqs.level) : undefined,
      classRequirement: reqs.classRequirement ? String(reqs.classRequirement) : undefined,
      stats,
      elements,
      powderSlots: typeof it.powderSlots === "number" ? it.powderSlots : undefined,
      emblem: it.emblem ? String(it.emblem) : undefined,
      averageDps: typeof it.averageDps === "number" ? it.averageDps : undefined,
      dropRestriction: it.dropRestriction ? String(it.dropRestriction) : undefined,
    }
  })
  if (!items.length) return `No Wynncraft item matches "${q}".`
  return `Build stats for Wynncraft items matching "${q}" (${items.length} shown):\n` +
    items
      .map((it, i) =>
        [
          `${i + 1}. ${it.displayName}${it.tier ? ` | ${it.tier} ${it.type ?? ""} ${it.subType ?? ""}`.trim() : ""}`,
          `   requires: level ${it.level ?? "not reported"}${it.classRequirement ? `, class ${it.classRequirement}` : ""}`,
          `   stats: ${it.stats.length ? it.stats.join(", ") : "none reported"}`,
          it.elements.length ? `   elements: ${it.elements.join(", ")}` : "",
          `   powder slots: ${it.powderSlots ?? "not reported"} | emblem: ${it.emblem ?? "not reported"}`,
          `   average dps: ${it.averageDps ?? "not reported"} | drop: ${it.dropRestriction ?? "not reported"}`,
        ]
          .filter((l) => l !== "")
          .join("\n"),
      )
      .join("\n")
}
