/**
 * PokéAPI — Pokémon species data: types, stats, abilities and sprites. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against pokeapi.co.
 */
const API = "https://pokeapi.co/api/v2"

export class PokeApiError extends Error {}

type Row = Record<string, unknown>

const val = (v: unknown): string => {
  if (typeof v === "string") return v
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : ""
  if (Array.isArray(v)) return v.length > 0 ? val(v[0]) : ""
  if (v && typeof v === "object") {
    const o = v as Row
    if ("en" in o) return val(o.en)
    const first = Object.values(o)[0]
    return first === undefined ? "" : val(first)
  }
  return ""
}

const at = (o: unknown, path: string): unknown =>
  path === "" ? o : path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Row)[k] : undefined), o)

const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : [])

async function get<T>(url: string, init?: RequestInit, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "user-agent": "pokeapi-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new PokeApiError(`PokéAPI returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof PokeApiError) throw e
    if ((e as Error).name === "AbortError") throw new PokeApiError("PokéAPI request timed out")
    throw new PokeApiError(`PokéAPI request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function getPokemon(name: string): Promise<string> {
  const key = name.trim().toLowerCase()
  if (key === "") throw new PokeApiError("name must not be empty")
  const body = await get<unknown>(`${API}/pokemon/${encodeURIComponent(key)}`)
  const types = rows(at(body, "types")).map((t) => val(at(t, "type.name"))).filter((t) => t !== "")
  const abilities = rows(at(body, "abilities")).map((a) => val(at(a, "ability.name"))).filter((a) => a !== "")
  return [
    `${val(at(body, "name"))} (#${val(at(body, "id"))})`,
    "",
    `Types: ${types.join(", ")}`,
    `Height: ${val(at(body, "height"))} dm`,
    `Weight: ${val(at(body, "weight"))} hg`,
    `Abilities: ${abilities.join(", ")}`,
  ].join("\n")
}
