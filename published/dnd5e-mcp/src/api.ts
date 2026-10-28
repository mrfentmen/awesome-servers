/**
 * D&D 5e SRD client — dnd5eapi.co, keyless.
 * Docs: https://www.dnd5eapi.co/docs — free community-hosted SRD data.
 * (The official API moved; we pin the stable community endpoint.)
 */
const BASE = "https://www.dnd5eapi.co/api"

export class DndError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "dnd5e-mcp/1.0" },
    redirect: "follow",
  })
  if (!res.ok) throw new DndError(`dnd5eapi error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Monster {
  index: string
  name: string
  size?: string
  type?: string
  alignment?: string
  armor_class?: { value?: number; type?: string }[]
  hit_points?: number
  hit_dice?: string
  speed?: Record<string, string>
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  challenge_rating?: number
  languages?: string
  xp?: number
  actions?: { name?: string; desc?: string }[]
  special_abilities?: { name?: string; desc?: string }[]
  image?: string
}

export interface Spell {
  index: string
  name: string
  level?: number
  school?: { name?: string }
  casting_time?: string
  range?: string
  components?: string[]
  duration?: string
  ritual?: boolean
  concentration?: boolean
  material?: string
  desc?: string[]
  higher_level?: string[]
}

export interface ClassInfo {
  index: string
  name: string
  hit_die?: number
  proficiency_choices?: { from?: { options?: { item?: { name?: string } }[] } }[]
  starting_equipment?: { equipment?: { name?: string }; quantity?: number }[]
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function listMonsters(limit = 30): Promise<{ index: string; name: string }[]> {
  const d = await getJson<{ results?: any[] }>(`/monsters?limit=${limit}`)
  return (d.results ?? []).map((r) => ({ index: r.index ?? "", name: r.name ?? "?" }))
}

export async function getMonster(index: string): Promise<Monster | null> {
  try {
    return (await getJson<any>(`/monsters/${encodeURIComponent(index)}`)) as Monster
  } catch (e) {
    if (e instanceof DndError && String(e).includes("404")) return null
    throw e
  }
}

export async function getSpell(index: string): Promise<Spell | null> {
  try {
    return (await getJson<any>(`/spells/${encodeURIComponent(index)}`)) as Spell
  } catch (e) {
    if (e instanceof DndError && String(e).includes("404")) return null
    throw e
  }
}

export async function getClassInfo(index: string): Promise<ClassInfo | null> {
  try {
    return (await getJson<any>(`/classes/${encodeURIComponent(index)}`)) as ClassInfo
  } catch (e) {
    if (e instanceof DndError && String(e).includes("404")) return null
    throw e
  }
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function fmtSpeed(speed?: Record<string, string>): string {
  if (!speed) return ""
  return Object.entries(speed)
    .map(([k, v]) => `${k} ${v}`)
    .join(", ")
}

export function formatMonster(m: Monster): string {
  const ac = m.armor_class?.map((a) => `${a.value ?? "?"}${a.type ? ` (${a.type})` : ""}`).join(" / ")
  const stats = ["STR", "DEX", "CON", "INT", "WIS", "CHA"]
    .map((s, i) => `${s} ${[m.strength, m.dexterity, m.constitution, m.intelligence, m.wisdom, m.charisma][i] ?? "?"}`)
    .join(" ")
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
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatSpell(s: Spell): string {
  const lines = [
    `${s.name} — level ${s.level ?? 0} ${s.school?.name ?? ""}${s.ritual ? " (ritual)" : ""}`,
    `Casting: ${s.casting_time ?? "?"} · Range: ${s.range ?? "?"} · Components: ${(s.components ?? []).join(", ") || "?"}${s.material ? ` (${s.material})` : ""}`,
    `Duration: ${s.duration ?? "?"}${s.concentration ? " (concentration)" : ""}`,
    "",
    ...(s.desc ?? []).map((d) => d),
    s.higher_level?.length ? `\nAt higher levels: ${s.higher_level.join(" ")}` : "",
    `\nhttps://www.dnd5eapi.co/api/spells/${s.index}`,
  ]
  return lines.join("\n")
}
