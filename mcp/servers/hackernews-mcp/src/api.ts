/**
 * Hacker News client. Keyless. Firebase for live lists and items, Algolia for
 * full-text search with points and comment counts.
 */
const FB = "https://hacker-news.firebaseio.com/v0"
const ALGOLIA = "https://hn.algolia.com/api/v1"

export class HnError extends Error {}

export interface Item {
  id?: number
  type?: string
  by?: string
  time?: number
  title?: string
  url?: string
  text?: string
  score?: number
  descendants?: number
  kids?: number[]
  deleted?: boolean
  dead?: boolean
}

export interface User {
  id?: string
  created?: number
  karma?: number
  about?: string
  submitted?: number[]
}

export interface Hit {
  objectID?: string
  title?: string
  url?: string
  author?: string
  points?: number
  num_comments?: number
  created_at?: string
  story_text?: string
  comment_text?: string
  _tags?: string[]
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": "hackernews-mcp/1.0 (awesome-servers)" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new HnError(`HN error ${res.status}`)
  return (await res.json()) as T
}

export async function ids(kind: "topstories" | "newstories" | "beststories", limit: number): Promise<number[]> {
  const all = await get<number[]>(`${FB}/${kind}.json`)
  return (all ?? []).slice(0, limit)
}

export async function item(id: number): Promise<Item | undefined> {
  const it = await get<Item | null>(`${FB}/item/${id}.json`)
  return it ?? undefined
}

export async function user(id: string): Promise<User | undefined> {
  const u = await get<User | null>(`${FB}/user/${encodeURIComponent(id)}.json`)
  return u ?? undefined
}

export async function search(query: string, tags: string, limit: number): Promise<Hit[]> {
  const url = `${ALGOLIA}/search?query=${encodeURIComponent(query)}&tags=${encodeURIComponent(tags)}&hitsPerPage=${limit}`
  const body = await get<{ hits?: Hit[] }>(url)
  return body.hits ?? []
}

export function itemText(it: Item): string {
  const when = it.time ? new Date(it.time * 1000).toISOString() : "?"
  const body = (it.text ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  return [
    `#${it.id} ${it.title ?? "(comment)"} [${it.type ?? "?"}]`,
    `by ${it.by ?? "?"} at ${when} | score ${it.score ?? 0} | comments ${it.descendants ?? 0}`,
    it.url ? `link: ${it.url}` : "",
    body ? `\n${body.slice(0, 800)}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function hitText(h: Hit): string {
  const n = h.num_comments ?? 0
  const p = h.points ?? 0
  const url = h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`
  const title = h.title ?? (h.story_text ?? h.comment_text ?? "").replace(/<[^>]+>/g, "").slice(0, 80)
  return `${title} — ${p} points, ${n} comments, ${h.created_at ?? ""}\n  ${url}`
}
