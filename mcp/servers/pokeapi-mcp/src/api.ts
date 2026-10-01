const BASE = "https://pokeapi.co/api/v2"
const UA = "mrfentmen-pokeapi-mcp/1.0 (https://github.com/mrfentmen)"
export class PokeError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new PokeError("PokéAPI rate limit hit, wait and retry")
  if (!res.ok) throw new PokeError(`PokéAPI error ${res.status}`)
  return (await res.json()) as T
}

export async function pokemonInfo(args: { name?: string }): Promise<string> {
  const name = (args.name ?? "").trim().toLowerCase()
  if (!name) throw new PokeError("Provide a Pokemon name or ID")
  const d = await get<any>(`${BASE}/pokemon/${encodeURIComponent(name)}`)
  const types = (d?.types ?? []).map((t: any) => t.type?.name).join(", ")
  const stats = (d?.stats ?? []).map((s: any) => `${s.stat?.name}: ${s.base_stat}`).join(" | ")
  const species = await get<any>(`${BASE}/pokemon-species/${d.id}`).catch(() => null)
  const flavor = species?.flavor_text_entries?.find((f: any) => f.language?.name === "en")?.flavor_text?.replace(/[\n\f]/g, " ") ?? ""
  return `${d.name} (#${d.id})\nTypes: ${types}\nHeight: ${(d.height ?? 0) / 10} m | Weight: ${(d.weight ?? 0) / 10} kg\nBase stats: ${stats}${flavor ? `\n\n${flavor}` : ""}`
}

export async function searchPokemon(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim().toLowerCase()
  if (!q) throw new PokeError("Provide a partial name")
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any>(`${BASE}/pokemon?limit=2000`)
  const hits = (d?.results ?? []).filter((p: any) => p.name.includes(q)).slice(0, limit)
  if (!hits.length) return "No Pokemon match"
  return hits.map((p: any) => p.name).join("\n")
}

// ---- muxC tools:

interface PokeList<T> {
  results?: Array<{ name: string; url: string }>
  count?: number
}

interface PokeSpecies {
  id?: number
  name?: string
  generation?: { name?: string }
  evolution_chain?: { url?: string }
  habitat?: { name?: string } | null
  capture_rate?: number
  base_happiness?: number | null
  growth_rate?: { name?: string }
  color?: { name?: string }
  shape?: { name?: string } | null
  is_legendary?: boolean
  is_mythical?: boolean
  flavor_text_entries?: Array<{ language?: { name?: string }; flavor_text?: string }>
  varieties?: Array<{ is_default?: boolean; pokemon?: { name?: string } }>
}

interface PokeChainNode {
  is_baby?: boolean
  species?: { name?: string }
  evolves_to?: PokeChainNode[]
  evolution_details?: Array<{ min_level?: number | null; item?: { name?: string } | string | null; trigger?: { name?: string } | null; known_move?: { name?: string } | string | null; time_of_day?: string; min_happiness?: number | null; min_beauty?: number | null }>
}

interface PokeChain {
  chain?: PokeChainNode
}

interface PokeType {
  name?: string
  damage_relations?: {
    no_damage_to?: Array<{ name: string }>
    half_damage_to?: Array<{ name: string }>
    double_damage_to?: Array<{ name: string }>
    no_damage_from?: Array<{ name: string }>
    half_damage_from?: Array<{ name: string }>
    double_damage_from?: Array<{ name: string }>
  }
  moves?: PokeList<unknown>
  pokemon?: PokeList<unknown>
}

/** Every ability a Pokemon has, with its effect text. */
export async function pokemonAbilities(args: { name?: string }): Promise<string> {
  const name = (args.name ?? "").trim().toLowerCase()
  if (!name) throw new PokeError("Provide a Pokemon name or ID")
  const d = await get<any>(`${BASE}/pokemon/${encodeURIComponent(name)}`)
  const slots: Array<{ slot: number; ability: { name: string; url: string } }> = d?.abilities ?? []
  if (!slots.length) return `${d.name} has no ability listed.`
  const rows: string[] = []
  for (const entry of slots.slice(0, 3)) {
    const detail = await get<{ name?: string; effect_entries?: Array<{ short_effect?: string; language?: { name?: string } }>; is_main_series?: boolean }>(entry.ability.url)
    // effect_entries is not English-only, so match the language explicitly
    const text =
      detail?.effect_entries?.find((e) => e.language?.name === "en" && e.short_effect)?.short_effect ??
      detail?.effect_entries?.find((e) => e.short_effect)?.short_effect ??
      "no effect text published"
    rows.push(`[slot ${entry.slot}] ${entry.ability.name}: ${text}${detail?.is_main_series === false ? " (not in the main series)" : ""}`)
  }
  return `Abilities of ${d.name} (#${d.id}):\n${rows.join("\n")}`
}
