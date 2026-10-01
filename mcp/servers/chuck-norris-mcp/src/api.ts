const BASE = "https://api.chucknorris.io"
const UA = "mrfentmen-chuck-norris-mcp/1.0 (https://github.com/mrfentmen)"
export class ChuckError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new ChuckError(`Chuck Norris API returned HTTP ${res.status}`)
  return (await res.json()) as T
}

export async function random(_args?: unknown): Promise<string> {
  const d = await get<any>(`${BASE}/jokes/random`)
  return d?.value ?? "No joke found"
}

export async function categories(_args?: unknown): Promise<string> {
  const d = await get<string[]>(`${BASE}/jokes/categories`)
  const list = d ?? []
  if (!list.length) return "No categories found"
  return `Chuck Norris joke categories (${list.length}):\n` + list.map((c, i) => `${i + 1}. ${c}`).join("\n")
}

// ---- muxA tools:
// The existing tools give one random joke and the category list. These add
// keyword search over the whole joke set, a random joke restricted to one
// category, and one joke fetched by its id.
const SEARCH_MIN = 3
const SEARCH_MAX = 120

export interface SearchJokesArgs {
  query: string
  limit?: number
}

export interface RandomByCategoryArgs {
  category: string
}

export interface JokeByIdArgs {
  id: string
}

export async function jokeById(args: JokeByIdArgs): Promise<string> {
  const id = (args.id ?? "").trim()
  if (!id) throw new ChuckError("Provide a joke id.")
  const d = await get<{ id?: string; value?: string; categories?: string[]; url?: string }>(`${BASE}/jokes/${encodeURIComponent(id)}`)
  const value = (d?.value ?? "").replace(/\s+/g, " ")
  if (!value) return `The API returned no joke for id "${id}".`
  const cats = d?.categories ?? []
  return `${value}\nid: ${d?.id ?? id}\ncategories: ${cats.length ? cats.join(", ") : "none"}\npermalink: ${d?.url ?? `${BASE}/jokes/${id}`}`
}
