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

// ---- muxD tools:

export interface PublicationsArgs {
  limit?: number
  order_by?: string
  order_direction?: string
}

/**
 * GET /publications?expand[]=stats
 * Fields: data[].id/name/organization_name/referral_program_enabled/created,
 * data[].stats.{active_subscriptions, active_premium_subscriptions,
 * active_free_subscriptions, average_open_rate, average_click_rate, total_sent,
 * total_unique_opened, total_clicked}
 */
export async function listPublications(args: PublicationsArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 100))
  const params = new URLSearchParams()
  params.set("limit", String(limit))
  params.append("expand[]", "stats")
  if (args.order_by) params.set("order_by", args.order_by)
  if (args.order_direction) params.set("order_direction", args.order_direction)
  const data = await getJson<Raw>(`/publications?${params.toString()}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  if (!rows.length) return "No publications on this API key."
  const total = typeof data.total_results === "number" ? ` of ${data.total_results}` : ""
  const lines = rows.map((p, i) => {
    const s: Raw = p.stats ?? {}
    const bits = [`${i + 1}. ${p.name ?? "(unnamed)"} [${p.id}]`]
    if (p.organization_name) bits.push(` | org ${p.organization_name}`)
    if (s.active_subscriptions != null) bits.push(` | active subs ${s.active_subscriptions}`)
    if (p.referral_program_enabled != null) bits.push(` | referral ${p.referral_program_enabled ? "on" : "off"}`)
    return bits.join("")
  })
  return `beehiiv publications (${rows.length}${total} shown):\n${lines.join("\n")}`
}

export interface PublicationStatsArgs {
  publication_id: string
}

/**
 * GET /publications/{publicationId}?expand[]=stats
 */
export async function publicationStats(args: PublicationStatsArgs): Promise<string> {
  const id = (args.publication_id ?? "").trim()
  if (!id) throw new BeehiivError("Publication id is empty.")
  const data = await getJson<Raw>(`/publications/${encodeURIComponent(id)}?expand[]=stats`)
  const p: Raw = data.data ?? {}
  if (!p.id) throw new BeehiivError(`beehiiv returned no publication for ${id}.`)
  const s: Raw = p.stats ?? {}
  const lines = [`Publication ${p.name ?? "(unnamed)"} [${p.id}]`]
  if (p.organization_name) lines.push(`Organization: ${p.organization_name}`)
  if (typeof p.created === "number") lines.push(`Created: ${new Date(p.created * 1000).toISOString().slice(0, 10)}`)
  if (p.referral_program_enabled != null) lines.push(`Referral program: ${p.referral_program_enabled ? "enabled" : "disabled"}`)
  const stat = (label: string, v: unknown) => {
    // beehiiv sends false when a stat is not available to this key
    if (v == null || v === false) return
    lines.push(`${label}: ${v}`)
  }
  const before = lines.length
  stat("Active subscriptions", s.active_subscriptions)
  stat("Active premium subscriptions", s.active_premium_subscriptions)
  stat("Active free subscriptions", s.active_free_subscriptions)
  stat("Average open rate", s.average_open_rate)
  stat("Average click rate", s.average_click_rate)
  stat("Total emails sent", s.total_sent)
  stat("Total unique opens", s.total_unique_opened)
  stat("Total clicks", s.total_clicked)
  if (lines.length === before) lines.push("Stats: not reported by beehiiv for this publication.")
  return lines.join("\n")
}

export interface TiersArgs {
  publication_id: string
  limit?: number
}

/**
 * GET /publications/{publicationId}/tiers?expand[]=stats&expand[]=prices
 * Fields: data[].id/name/status/description/stats.active_subscriptions,
 * data[].prices[].{amount_cents, currency, interval, enabled}
 */
export async function listTiers(args: TiersArgs): Promise<string> {
  const id = (args.publication_id ?? "").trim()
  if (!id) throw new BeehiivError("Publication id is empty.")
  const limit = Math.max(1, Math.min(args.limit ?? 25, 100))
  const params = new URLSearchParams()
  params.set("limit", String(limit))
  params.append("expand[]", "stats")
  params.append("expand[]", "prices")
  const data = await getJson<Raw>(`/publications/${encodeURIComponent(id)}/tiers?${params.toString()}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  if (!rows.length) return `No subscription tiers on publication ${id}.`
  const lines = rows.map((t, i) => {
    const st: Raw = t.stats ?? {}
    const head = `${i + 1}. ${t.name ?? "(unnamed)"} [${t.id}] - status ${t.status ?? "not reported"}`
    const subs = st.active_subscriptions != null ? ` - active subs ${st.active_subscriptions}` : ""
    const desc = t.description ? ` | ${String(t.description).slice(0, 80)}` : ""
    const prices: Raw[] = Array.isArray(t.prices) ? t.prices : []
    const priceText = prices.length
      ? " | " +
        prices
          .slice(0, 5)
          .map((p) => `${(typeof p.amount_cents === "number" ? p.amount_cents / 100 : 0)} ${p.currency ?? "USD"}/${p.interval ?? "one_time"}${p.enabled === false ? " (disabled)" : ""}`)
          .join(", ")
      : " | no prices reported"
    return head + subs + desc + priceText
  })
  return `beehiiv tiers for ${id} (${rows.length} shown):\n${lines.join("\n")}`
}
