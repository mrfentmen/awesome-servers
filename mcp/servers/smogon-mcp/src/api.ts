/**
 * Competitive Pokemon client. Two keyless sources:
 *  1. The full national dex served by Pokemon Showdown
 *     (play.pokemonshowdown.com/data/pokedex.json, ~520KB).
 *  2. Monthly usage statistics published by Smogon
 *     (smogon.com/stats/YYYY-MM/...). Usage files are plain text:
 *     "Rank | Pokemon | Usage % | Raw | %".
 */
const DEX_URL = "https://play.pokemonshowdown.com/data/pokedex.json"
const STATS_URL = "https://www.smogon.com/stats"

export class SmogonError extends Error {}

export interface PokeEntry {
  num: number
  name: string
  types: string[]
  baseStats: Record<string, number>
  abilities?: Record<string, string>
  tier?: string
  isNonstandard?: string
  spriteNum?: number
}

export interface UsageRow {
  rank: number
  name: string
  usagePct: number
  raw: number
  rawPct: number
}

let dexCache: Record<string, any> | null = null

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": "smogon-mcp/1.0" } })
  if (!res.ok) throw new SmogonError(`Request failed ${res.status} for ${url.slice(0, 80)}`)
  return (await res.json()) as T
}

async function getText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "smogon-mcp/1.0" } })
  if (!res.ok) throw new SmogonError(`Request failed ${res.status} for ${url.slice(0, 80)}`)
  return res.text()
}

async function getDex(): Promise<Record<string, any>> {
  if (!dexCache) dexCache = await getJson<Record<string, any>>(DEX_URL)
  return dexCache
}

export async function searchDex(query: string, limit = 10): Promise<PokeEntry[]> {
  const dex = await getDex()
  const q = query.toLowerCase()
  const all = Object.values(dex)
    .filter((p) => p.name && (p.name.toLowerCase().includes(q) || (p.num && String(p.num) === q)))
    .map((p) => mapEntry(p))
  return all.slice(0, limit)
}

export async function getPokemon(name: string): Promise<PokeEntry | null> {
  const dex = await getDex()
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/[_.-]/g, "")
  const found = Object.entries(dex).find(
    ([k, p]) =>
      k.replace(/[_.-]/g, "") === key || (p.name ?? "").toLowerCase() === name.toLowerCase()
  )
  return found ? mapEntry(found[1]) : null
}

function mapEntry(p: any): PokeEntry {
  return {
    num: p.num ?? 0,
    name: p.name ?? "?",
    types: p.types ?? [],
    baseStats: p.baseStats ?? {},
    abilities: p.abilities ? { ...p.abilities } : undefined,
    tier: p.tier,
    isNonstandard: p.isNonstandard,
    spriteNum: p.spriteNum,
  }
}

/** Parse a Smogon usage .txt file into ranked rows. */
export function parseUsage(text: string): UsageRow[] {
  const rows: UsageRow[] = []
  for (const line of text.split("\n")) {
    // Smogon tables look like: | 1    | Great Tusk | 28.27374% | 433977 | ...
    const m = line.match(/^\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([\d.]+)%\s*\|\s*(\d+)\s*\|\s*([\d.]+)%/)
    if (!m) continue
    rows.push({
      rank: parseInt(m[1], 10),
      name: m[2].trim(),
      usagePct: parseFloat(m[3]),
      raw: parseInt(m[4], 10),
      rawPct: parseFloat(m[5]),
    })
  }
  return rows
}

export async function getUsageStats(
  month: string,
  format: string,
  top = 15
): Promise<UsageRow[]> {
  const url = `${STATS_URL}/${month}/${format}-0.txt`
  const text = await getText(url)
  return parseUsage(text).slice(0, top)
}

export async function listAvailableMonths(): Promise<string[]> {
  const text = await getText(`${STATS_URL}/`)
  const months: string[] = []
  const re = /href="(\d{4}-\d{2})\/"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) months.push(m[1])
  return months
}

export function formatPoke(p: PokeEntry): string {
  const labels = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"]
  const keys = ["hp", "atk", "def", "spa", "spd", "spe"]
  const stats = labels.map((s, i) => `${s} ${p.baseStats[keys[i]] ?? "?"}`).join(" / ")
  const abilities = p.abilities ? Object.values(p.abilities).join(", ") : ""
  const lines = [
    `${p.name} (#${p.num})`,
    `Type: ${p.types.join(" / ")}`,
    `Base stats: ${stats}`,
    abilities ? `Abilities: ${abilities}` : "",
    p.tier ? `Tier: ${p.tier}` : "",
    p.isNonstandard ? `Nonstandard: ${p.isNonstandard}` : "",
    `https://www.smogon.com/dex/sv/pokemon/${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}/`,
  ].filter(Boolean)
  return lines.join("\n")
}
