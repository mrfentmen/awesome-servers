/**
 * Hubitat Maker API client. Needs HUBITAT_URL (e.g. http://hubitat.local),
 * HUBITAT_APP_ID and HUBITAT_TOKEN (from the Maker API app instance).
 * Docs: https://docs2.hubitat.com/en/apps/maker-api
 */
function base(): string {
  const url = (process.env.HUBITAT_URL ?? "http://hubitat.local").replace(/\/+$/, "")
  const app = process.env.HUBITAT_APP_ID
  const token = process.env.HUBITAT_TOKEN
  if (!app || !token) throw new HubitatError("Set HUBITAT_URL, HUBITAT_APP_ID and HUBITAT_TOKEN (Maker API app).")
  return `${url}/apps/api/${app}`
}

export class HubitatError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const token = process.env.HUBITAT_TOKEN
  const res = await fetch(`${base()}${path}?access_token=${encodeURIComponent(token ?? "")}`, {
    headers: { "User-Agent": "hubitat-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new HubitatError("Hubitat refused (401/403). Check app id and token.")
  if (res.status === 404) throw new HubitatError("Not found. Check HUBITAT_URL and app id.")
  if (!res.ok) throw new HubitatError(`Hubitat error ${res.status}`)
  return (await res.json()) as T
}

export interface Device {
  id: string
  name?: string
  label?: string
  type?: string
}

export async function listDevices(): Promise<Device[]> {
  const rows = await getJson<Raw[]>("/devices")
  return rows.map((d) => ({ id: String(d.id), name: d.name, label: d.label, type: d.type }))
}

export async function deviceStatus(id: string): Promise<string> {
  if (!id.trim()) throw new HubitatError("Device id is empty.")
  const d = await getJson<Raw>(`/devices/${encodeURIComponent(id.trim())}`)
  const attrs: Raw[] = Array.isArray(d.attributes) ? d.attributes : []
  const lines = [
    `[${d.id}] ${d.label ?? d.name ?? "(unnamed)"}${d.type ? ` (${d.type})` : ""}`,
    ...attrs.slice(0, 10).map((a) => `${String(a.name)}: ${String(a.currentValue ?? "?")} ${String(a.unit ?? "")}`.trim()),
  ]
  return lines.join("\n")
}

export async function sendCommand(id: string, command: string, value = ""): Promise<string> {
  if (!id.trim() || !command.trim()) throw new HubitatError("Device id and command are required.")
  let path = `/devices/${encodeURIComponent(id.trim())}/${encodeURIComponent(command.trim())}`
  if (value.trim()) path += `/${encodeURIComponent(value.trim())}`
  await getJson<Raw>(path)
  return `Sent ${command}${value.trim() ? `(${value.trim()})` : ""} to device ${id.trim()}.`
}

export function formatDevice(d: Device, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${d.id}] ${d.label ?? d.name ?? "(unnamed)"}${d.type ? ` (${d.type})` : ""}`
}

// ---- muxF tools:
const HUBITAT_COMMUNITY = "https://community.hubitat.com"

interface CommunityCategory {
  id: number
  slug: string
  name: string
  description?: string
  topic_count?: number
  post_count?: number
  subcategory_ids?: number[]
  read_restricted?: boolean
  parent_category_id?: number
}

interface CommunityTopic {
  id: number
  slug: string
  title: string
  category_id?: number
  tags?: string[]
  posts_count?: number
  reply_count?: number
  highest_post_number?: number
  views?: number
  like_count?: number
  created_at?: string
  last_posted_at?: string
  pinned?: boolean
  closed?: boolean
  archived?: boolean
  has_accepted_answer?: boolean
  last_poster_username?: string
}

interface CommunityPost {
  id: number
  username: string
  name?: string
  post_number: number
  topic_id: number
  like_count?: number
  blurb?: string
  cooked?: string
  created_at?: string
}

let categoryMap: Map<number, CommunityCategory> | null = null

async function communityJson<T>(path: string): Promise<T> {
  const res = await fetch(`${HUBITAT_COMMUNITY}${path}`, {
    headers: { "User-Agent": "hubitat-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new HubitatError(`Hubitat Community has no ${path.replace(/\.json.*$/, "").replace(/^\//, "")}`)
  if (res.status === 429) throw new HubitatError("Hubitat Community is rate limiting this IP. Wait a minute and try again.")
  if (!res.ok) throw new HubitatError(`Hubitat Community returned ${res.status}`)
  return (await res.json()) as T
}

async function communityCategories(): Promise<CommunityCategory[]> {
  if (!categoryMap) {
    const d = await communityJson<{ category_list?: { categories?: CommunityCategory[] } }>("/categories.json")
    const all = d.category_list?.categories ?? []
    categoryMap = new Map(all.map((c) => [c.id, c]))
    return all
  }
  return [...categoryMap.values()]
}

function categoryName(byId: Map<number, CommunityCategory>, id?: number): string {
  if (id === undefined) return "not reported"
  return byId.get(id)?.name ?? `category ${id} (not in the public category list)`
}

function permalink(t: Pick<CommunityTopic, "id" | "slug">): string {
  return `${HUBITAT_COMMUNITY}/t/${t.slug}/${t.id}`
}

function asNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

function topicLine(t: CommunityTopic, byId: Map<number, CommunityCategory>): string {
  const flags = [
    t.pinned ? "pinned" : "",
    t.closed ? "closed" : "",
    t.archived ? "archived" : "",
    t.has_accepted_answer ? "has accepted answer" : "",
  ].filter(Boolean)
  return [
    `[${t.id}] ${t.title}`,
    `  ${categoryName(byId, t.category_id)} | ${t.posts_count ?? "?"} posts, ${t.reply_count ?? "?"} replies`,
    `  started ${(t.created_at ?? "?").slice(0, 10)}, last activity ${(t.last_posted_at ?? "?").slice(0, 10)}`,
    `  ${t.views !== undefined && t.views !== null ? `${t.views} views, ` : ""}${t.like_count ?? "?"} likes`,
    t.tags && t.tags.length ? `  tags: ${t.tags.join(", ")}` : "",
    flags.length ? `  ${flags.join(", ")}` : "",
    `  ${permalink(t)}`,
  ].filter(Boolean).join("\n")
}

/** The Hubitat Community, searched through its public Discourse search API. */
export async function communitySearch(args: { query?: string; category?: number; results?: number }): Promise<string> {
  const query = String(args?.query ?? "").trim()
  if (!query) throw new HubitatError("query is required, for example 'driver code' or a device model.")
  const limit = asNumber(args?.results, 1, 20, 8)
  const params = new URLSearchParams({ q: query })
  if (args?.category !== undefined) params.set("category", String(args.category))
  const d = await communityJson<{
    posts?: CommunityPost[]
    topics?: CommunityTopic[]
  }>(`/search.json?${params}`)

  const byId = new Map((await communityCategories()).map((c) => [c.id, c]))
  const topics = d.topics ?? []
  const posts = d.posts ?? []
  if (!topics.length) {
    return `No Hubitat Community results for "${query}"${args?.category !== undefined ? ` in ${categoryName(byId, args.category)}` : ""}. Try a device model, a driver name, or a capability such as "pushButton".`
  }

  const hits = posts.slice(0, limit).map((p) => {
    const topic = topics.find((t) => t.id === p.topic_id)
    return [
      `Match in post #${p.post_number} by ${p.username} in "${topic?.title ?? `topic ${p.topic_id}`}"${p.like_count ? `, ${p.like_count} likes` : ""}`,
      `  ${(p.blurb ?? "").trim()}`,
      topic ? `  ${permalink(topic)}` : "",
    ].filter(Boolean).join("\n")
  })

  return [
    `Hubitat Community search for "${query}" (${args?.category !== undefined ? `in ${categoryName(byId, args.category)}, ` : ""}${limit} of ${topics.length} matching topics)`,
    "",
    "Matches:",
    ...hits,
    "",
    "Matching topics:",
    ...topics.slice(0, limit).map((t) => topicLine(t, byId)),
    "",
    "Search hits the first posts that match, so a long thread shows its opening question rather than the latest reply.",
  ].join("\n")
}

/** One Community thread, read the way you would before installing somebody's driver. */
export async function threadDigest(args: { topicId?: number; postNumber?: number }): Promise<string> {
  const id = asNumber(args?.topicId, 1, 1e9, 0)
  if (!id) throw new HubitatError("topicId is required. Use community_search or category_roadmap to find a topic id.")
  const start = asNumber(args?.postNumber, 1, 1e6, 1)
  const suffix = start > 1 ? `?post_number=${start}` : ""
  const d = await communityJson<{
    id: number
    title: string
    slug: string
    category_id?: number
    tags?: string[]
    posts_count?: number
    reply_count?: number
    highest_post_number?: number
    views?: number
    like_count?: number
    word_count?: number
    created_at?: string
    last_posted_at?: string
    pinned?: boolean
    closed?: boolean
    archived?: boolean
    has_accepted_answer?: boolean
    post_stream?: { posts?: CommunityPost[] }
  }>(`/t/${id}.json${suffix}`)

  const byId = new Map((await communityCategories()).map((c) => [c.id, c]))
  const posts = d.post_stream?.posts ?? []
  const first = posts[0]

  const header = [
    `#${d.id} ${d.title}`,
    `Category: ${categoryName(byId, d.category_id)}${d.tags && d.tags.length ? ` | tags: ${d.tags.join(", ")}` : ""}`,
    `${d.posts_count ?? "?"} posts, ${d.reply_count ?? "?"} replies, ${d.views ?? "?"} views, ${d.like_count ?? "?"} likes, ${d.word_count ?? "?"} words`,
    `Started ${(d.created_at ?? "?").slice(0, 10)}${first ? ` by ${first.username}` : ""}, last activity ${(d.last_posted_at ?? "?").slice(0, 10)}${d.has_accepted_answer ? ", accepted answer marked" : ""}`,
    [
      d.pinned ? "pinned" : "",
      d.closed ? "closed" : "",
      d.archived ? "archived" : "",
    ].filter(Boolean).join(", ") || "no flags",
    `${HUBITAT_COMMUNITY}/t/${d.slug}/${d.id}`,
  ]

  const body = posts.map((p) => {
    const text = stripHtml(p.cooked ?? "")
    return [
      "",
      `--- post #${p.post_number} by ${p.username} (${(p.name ?? "").trim() || p.username})${p.like_count ? `, ${p.like_count} likes` : ""} at ${(p.created_at ?? "").slice(0, 16).replace("T", " ")}`,
      text || "(post body is empty or is code that did not survive the text conversion)",
    ].join("\n")
  })

  const highest = d.highest_post_number ?? d.posts_count ?? 0
  const shown = posts.length
  return [
    ...header,
    "",
    `Showing ${shown} post(s) starting at #${start}${highest > start + shown - 1 ? ` of ${highest}; call again with postNumber=${start + shown} for the next page` : ", so that is the whole thread"}.`,
    ...body,
  ].join("\n")
}

/** Where the community keeps device and driver talk, and the latest threads in one chosen category. */
export async function categoryRoadmap(args: { category?: string | number; topics?: number }): Promise<string> {
  const all = await communityCategories()
  const byId = new Map(all.map((c) => [c.id, c]))

  if (args?.category === undefined || args.category === "") {
    const sorted = [...all].sort((a, b) => (b.topic_count ?? 0) - (a.topic_count ?? 0))
    const totalTopics = all.reduce((s, c) => s + (c.topic_count ?? 0), 0)
    const totalPosts = all.reduce((s, c) => s + (c.post_count ?? 0), 0)
    return [
      `Hubitat Community roadmap: ${all.length} top-level categories, ${totalTopics.toLocaleString("en-US")} topics, ${totalPosts.toLocaleString("en-US")} posts`,
      "",
      ...sorted.map((c) => {
        const subs = (c.subcategory_ids ?? []).map((id) => categoryName(byId, id))
        return [
          `[${c.id}] ${c.name} (${c.slug})`,
          `  ${c.topic_count ?? "?"} topics, ${c.post_count ?? "?"} posts${c.read_restricted ? ", login required to post" : ""}`,
          subs.length ? `  subcategories: ${subs.join("; ")}` : "",
          c.description ? `  ${c.description.trim().split(/\s+/).slice(0, 22).join(" ")}` : "",
        ].filter(Boolean).join("\n")
      }),
      "",
      "Ask for a single category to see its latest threads, by name (for example \"Custom Apps and Drivers\") or by id.",
    ].join("\n")
  }

  const want = String(args.category).trim().toLowerCase()
  if (!want) throw new HubitatError("category is an empty string. Omit it entirely for the whole community map.")
  const hit = all.find((c) => c.id === Number(want) || c.slug.toLowerCase() === want || c.name.toLowerCase() === want)
  if (!hit) {
    return `No Hubitat Community category matches "${args.category}". Known categories: ${all.map((c) => `${c.name} (${c.slug})`).join("; ")}`
  }
  const limit = asNumber(args?.topics, 1, 30, 10)
  const latest = await communityJson<{ topic_list?: { topics?: CommunityTopic[]; more_topics_url?: string } }>(`/c/${hit.id}/l/latest.json`)
  const topics = (latest.topic_list?.topics ?? []).slice(0, limit)
  const subs = (hit.subcategory_ids ?? []).map((id) => byId.get(id)).filter(Boolean) as CommunityCategory[]

  return [
    `Hubitat Community category: ${hit.name} (id ${hit.id}, slug ${hit.slug})`,
    `${hit.topic_count ?? "?"} topics, ${hit.post_count ?? "?"} posts${hit.read_restricted ? ", login required" : ""}`,
    hit.description ? hit.description.trim() : "",
    subs.length ? `Subcategories: ${subs.map((c) => `${c.name} (${c.id})` ).join("; ")}` : "",
    "",
    `Latest ${topics.length} topic(s)${latest.topic_list?.more_topics_url ? ", with more available on the site" : ""}:`,
    ...topics.map((t) => topicLine(t, byId)),
  ].filter(Boolean).join("\n")
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|pre|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/(td|th)>/gi, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
