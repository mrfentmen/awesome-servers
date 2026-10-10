export class PrxError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PrxError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://feeder.prx.org"

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(BASE + path, { headers: { ...UA, Accept: "application/hal+json, application/json" } })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new PrxError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function listPodcasts(page?: string, per?: string): Promise<string> {
  const p = new URLSearchParams()
  if (page) p.set("page", page)
  if (per) p.set("per", per)
  const q = p.toString()
  return req(`/api/v1/podcasts${q ? "?" + q : ""}`)
}

export function getPodcast(podcastId: string): Promise<string> {
  return req(`/api/v1/podcasts/${encodeURIComponent(podcastId)}`)
}

export function listEpisodes(page?: string, per?: string): Promise<string> {
  const p = new URLSearchParams()
  if (page) p.set("page", page)
  if (per) p.set("per", per)
  const q = p.toString()
  return req(`/api/v1/episodes${q ? "?" + q : ""}`)
}

export function getEpisode(episodeId: string): Promise<string> {
  return req(`/api/v1/episodes/${encodeURIComponent(episodeId)}`)
}

// ---- muxC tools:

interface PrxItem {
  id?: string | number
  title?: string
  description?: string
  link?: string
  imageUrl?: string
  category?: { value?: string; label?: string }
  tags?: string[]
  publishedAt?: string
  duration?: number
  explicitContent?: boolean
  podcastName?: string
  podcastId?: string | number
}

interface PrxListing {
  count?: number
  total?: number
  _embedded?: { "prx:items"?: PrxItem[] }
}

