/**
 * Storyblok Content Delivery API client. Needs STORYBLOK_TOKEN
 * (space Settings > Access Tokens: public or preview token).
 * Docs: https://www.storyblok.com/docs/api/content-delivery/v2
 */
const BASE = "https://api.storyblok.com/v2"

export class StoryblokError extends Error {}

function token(): string {
  const t = process.env.STORYBLOK_TOKEN
  if (!t) throw new StoryblokError("Set STORYBLOK_TOKEN first (space Settings > Access Tokens).")
  return t
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string, extra: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ token: token(), ...extra }).toString()
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { "User-Agent": "storyblok-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new StoryblokError("Storyblok refused (401/403). Check STORYBLOK_TOKEN.")
  if (res.status === 404) throw new StoryblokError("Not found.")
  if (!res.ok) throw new StoryblokError(`Storyblok error ${res.status}`)
  return (await res.json()) as T
}

export async function getSpace(): Promise<string> {
  const data = await getJson<Raw>("/cdn/spaces/me")
  const s: Raw = data.space ?? {}
  return [
    `${s.name ?? "(unnamed space)"}${s.domain ? ` (${s.domain})` : ""}`,
    `Plan: ${s.plan_level !== undefined ? s.plan_level : "?"}`,
    `Version: ${s.version ?? "?"}`,
  ].join("\n")
}

export interface Story {
  id: number
  slug?: string
  name?: string
  published?: string
  url?: string
}

export async function listStories(startsWith = "", limit = 10): Promise<Story[]> {
  const extra: Record<string, string> = { per_page: String(Math.min(Math.max(limit, 1), 100)) }
  if (startsWith.trim()) extra.starts_with = startsWith.trim()
  const data = await getJson<Raw>("/cdn/stories", extra)
  const rows: Raw[] = Array.isArray(data.stories) ? data.stories : []
  return rows.slice(0, limit).map((s) => ({
    id: Number(s.id),
    slug: s.slug,
    name: s.name,
    published: s.published_at ? String(s.published_at).slice(0, 10) : undefined,
    url: s.full_slug ? `/${s.full_slug}` : undefined,
  }))
}

export async function getStory(slug: string): Promise<Raw> {
  if (!slug.trim()) throw new StoryblokError("Slug is empty.")
  const data = await getJson<Raw>(`/cdn/stories/${encodeURIComponent(slug.trim())}`)
  return (data.story ?? {}) as Raw
}

export function formatStory(s: Story, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${s.id}] ${s.name ?? s.slug ?? "(unnamed)"}${s.published ? ` (${s.published})` : ""}${s.url ? `\n   ${s.url}` : ""}`
}

export function formatStoryDetail(s: Raw): string {
  const lines = [
    `[${String(s.id ?? "?")}] ${String(s.name ?? s.slug ?? "(unnamed)")}`,
    s.published_at ? `Published: ${String(s.published_at).slice(0, 10)}` : "",
    s.content ? `Content keys: ${Object.keys(s.content as Raw).slice(0, 10).join(", ")}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}
