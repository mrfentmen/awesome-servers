const UA = "mrfentmen-harry-potter-mcp/1.0 (https://github.com/mrfentmen)"
const BASE = "https://hp-api.onrender.com/api"

export class HpError extends Error {}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new HpError(`Harry Potter API returned HTTP ${res.status}`)
  return (await res.json()) as T
}

interface Character {
  name: string
  house: string
  patronus: string
  species: string
  actor: string
  alive: boolean
}

export async function character(args: { name?: string; limit?: number }): Promise<string> {
  const name = (args.name ?? "").trim().toLowerCase()
  if (!name) throw new HpError("Provide a character name")
  const limit = Math.min(args.limit ?? 10, 20)
  const all = await get<Character[]>("characters")
  const hits = all.filter((c) => c.name.toLowerCase().includes(name)).slice(0, limit)
  if (!hits.length) return `No characters match "${args.name}"`
  return hits.map((c, i) => `${i + 1}. ${c.name} | House: ${c.house || "n/a"} | Species: ${c.species || "n/a"} | Alive: ${c.alive}`).join("\n")
}

export async function house(args: { house?: string; limit?: number }): Promise<string> {
  const house = (args.house ?? "").trim().toLowerCase()
  if (!house) throw new HpError("Provide a house name")
  const limit = Math.min(args.limit ?? 10, 30)
  const all = await get<Character[]>("characters")
  const hits = all.filter((c) => c.house.toLowerCase() === house).slice(0, limit)
  if (!hits.length) return `No members found for house "${args.house}"`
  return hits.map((c, i) => `${i + 1}. ${c.name} | Played by ${c.actor || "n/a"}`).join("\n")
}

export async function spells(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 20, 100)
  const all = await get<any[]>("spells")
  return all.slice(0, limit).map((s, i) => `${i + 1}. ${s.name} | ${s.description ?? "no description"}`).join("\n")
}

// ---- muxB tools:

interface HpPerson {
  id?: string
  name?: string
  alternate_names?: string[]
  species?: string
  gender?: string
  house?: string
  dateOfBirth?: string
  yearOfBirth?: number
  wizard?: boolean
  ancestry?: string
  eyeColour?: string
  hairColour?: string
  wand?: { wood?: string; core?: string; length?: number }
  patronus?: string
  hogwartsStudent?: boolean
  hogwartsStaff?: boolean
  actor?: string
  alternate_actors?: string[]
  alive?: boolean
  image?: string
}

const hpText = (v: unknown): string => (v != null && String(v).trim() ? String(v) : 'not reported')

const hpList = (v: unknown, max = 6): string => {
  if (!Array.isArray(v) || !v.length) return 'not reported'
  const items = v.slice(0, max).map((x) => String(x))
  return items.join(', ') + (v.length > max ? `, and ${v.length - max} more` : '')
}

export interface CharacterProfileArgs {
  name?: string
}

export interface SearchSpellsArgs {
  query?: string
  limit?: number
}

