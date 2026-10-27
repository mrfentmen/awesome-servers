/**
 * beehiiv API v2 client. Needs BEEHIIV_API_KEY
 * (Publication Settings > API).
 * Docs: https://developers.beehiiv.com/
 */
const BASE = "https://api.beehiiv.com/v2"

export class BeehiivError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.BEEHIIV_API_KEY
  if (!key) throw new BeehiivError("Set BEEHIIV_API_KEY first (Publication Settings > API).")
  return { "User-Agent": "beehiiv-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${key}` }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new BeehiivError("beehiiv rejected the key (401/403).")
  if (res.status === 404) throw new BeehiivError("Not found.")
  if (!res.ok) throw new BeehiivError(`beehiiv error ${res.status}`)
  return (await res.json()) as T
}

export interface Post {
  id: string
  title?: string
  status?: string
  published?: string
  url?: string
}

export async function listPosts(publicationId: string, limit = 10): Promise<Post[]> {
  if (!publicationId.trim()) throw new BeehiivError("Publication id is empty.")
  const data = await getJson<Raw>(`/publications/${encodeURIComponent(publicationId.trim())}/posts?limit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.slice(0, limit).map((p) => ({
    id: String(p.id),
    title: p.title,
    status: p.status,
    published: p.publish_date ? String(p.publish_date).slice(0, 10) : undefined,
    url: p.web_url,
  }))
}

export interface Subscriber {
  email?: string
  status?: string
  tier?: string
  created?: string
}

export async function findSubscriber(publicationId: string, email: string): Promise<Subscriber | null> {
  if (!publicationId.trim()) throw new BeehiivError("Publication id is empty.")
  if (!email.includes("@")) throw new BeehiivError(`Not an email: "${email}".`)
  const data = await getJson<Raw>(`/publications/${encodeURIComponent(publicationId.trim())}/subscriptions?email=${encodeURIComponent(email.trim())}&limit=1`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  const s = rows[0]
  if (!s) return null
  return {
    email: s.email,
    status: s.status,
    tier: s.subscription_tier,
    created: s.created_at ? String(s.created_at).slice(0, 10) : undefined,
  }
}

export function formatPost(p: Post, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${p.id}] ${p.title ?? "(untitled)"}${p.status ? ` [${p.status}]` : ""}${p.published ? ` (${p.published})` : ""}${p.url ? `\n   ${p.url}` : ""}`
}
