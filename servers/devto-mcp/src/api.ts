const BASE = "https://dev.to/api"
const UA = "mrfentmen-devto-mcp/1.0 (https://github.com/mrfentmen)"
export class DevtoError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/vnd.forem.api-v1+json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new DevtoError("dev.to rate limit hit, wait and retry")
  if (!res.ok) throw new DevtoError(`dev.to error ${res.status}`)
  return (await res.json()) as T
}

function fmt(a: any, i: number): string {
  const tags = (a?.tag_list ?? []).join(", ")
  return `${i + 1}. ${a?.title ?? "Untitled"}\n   ${tags || "no tags"} | ${a?.positive_reactions_count ?? 0} reactions | ${a?.comments_count ?? 0} comments\n   by ${a?.user?.name ?? "n/a"} | ${a?.url ?? ""}`
}

export async function latestArticles(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any[]>(`${BASE}/articles?per_page=${limit}`)
  if (!d?.length) return "No articles"
  return d.map(fmt).join("\n\n")
}

export async function searchArticles(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new DevtoError("Provide search terms")
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any[]>(`${BASE}/articles?per_page=${limit}&tag=${encodeURIComponent(q)}`)
  if (!d?.length) return `No articles for ${q}`
  return d.map(fmt).join("\n\n")
}

export async function articleDetails(args: { id?: number }): Promise<string> {
  const id = Number(args.id)
  if (!Number.isInteger(id) || id <= 0) throw new DevtoError("Provide a numeric article id")
  const d = await get<any>(`${BASE}/articles/${id}`)
  return `${d?.title ?? "Untitled"}\nby ${d?.user?.name ?? "n/a"} | ${d?.positive_reactions_count ?? 0} reactions | ${d?.comments_count ?? 0} comments\nTags: ${((d?.tags ?? d?.tag_list ?? []) as string[]).join?.(", ") ?? ""}\n${d?.url ?? ""}\n\n${String(d?.body_markdown ?? d?.description ?? "").slice(0, 800)}`
}

export async function userArticles(args: { username?: string; limit?: number }): Promise<string> {
  const u = (args.username ?? "").trim()
  if (!u) throw new DevtoError("Provide a username")
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any[]>(`${BASE}/articles?username=${encodeURIComponent(u)}&per_page=${limit}`)
  if (!d?.length) return `No articles by ${u}`
  return d.map(fmt).join("\n\n")
}

export async function tagList(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any[]>(`${BASE}/tags?per_page=${limit}`)
  if (!d?.length) return "No tags"
  return d.map((t: any, i: number) => `${i + 1}. ${t.name ?? "?"} (following ${t.followers_count ?? "?"})`).join("\n")
}

export async function videos(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any[]>(`${BASE}/videos?per_page=${limit}`)
  if (!d?.length) return "No videos"
  return d.map((v: any, i: number) => `${i + 1}. ${v.title ?? "?"} | ${v.video_duration_in_minutes ?? "?"} min\n   by ${v.user?.name ?? "n/a"} | ${v.url ?? ""}`).join("\n\n")
}

export async function podcasts(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any[]>(`${BASE}/podcast_episodes?per_page=${limit}`)
  if (!d?.length) return "No podcast episodes"
  return d.map((p: any, i: number) => `${i + 1}. ${p.title ?? "?"} | ${p.podcast_title ?? "?"}\n   ${p.url ?? ""}`).join("\n\n")
}

export async function topArticles(args: { days?: number; limit?: number }): Promise<string> {
  const days = [1, 7, 30, 365, 100000].includes(Number(args.days)) ? Number(args.days) : 7
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any[]>(`${BASE}/articles?top=${days}&per_page=${limit}`)
  if (!d?.length) return "No articles"
  return d.map(fmt).join("\n\n")
}
