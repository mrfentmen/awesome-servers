export class SpreakerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SpreakerError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.spreaker.com/v2"

function optAuth(): Record<string, string> {
  const tok = process.env.SPREAKER_ACCESS_TOKEN
  return tok ? { Authorization: "Bearer " + tok } : {}
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string, init: RequestInit = {}): Promise<string> {
  const res = await fetch(BASE + path, { headers: { ...UA, ...optAuth(), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new SpreakerError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function getShow(showId: string): Promise<string> {
  return req(`/shows/${encodeURIComponent(showId)}`)
}

export function listShowEpisodes(showId: string, limit?: string): Promise<string> {
  const q = limit ? `?limit=${encodeURIComponent(limit)}` : ""
  return req(`/shows/${encodeURIComponent(showId)}/episodes${q}`)
}

export function getEpisode(episodeId: string): Promise<string> {
  return req(`/episodes/${encodeURIComponent(episodeId)}`)
}

export function searchShows(query: string, limit?: string): Promise<string> {
  const p = new URLSearchParams({ type: "shows", q: query })
  if (limit) p.set("limit", limit)
  return req(`/search?${p.toString()}`)
}

export function createShow(title: string, language: string): Promise<string> {
  const tok = process.env.SPREAKER_ACCESS_TOKEN
  if (!tok) throw new SpreakerError("Set the SPREAKER_ACCESS_TOKEN environment variable.")
  return req("/shows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, language }),
  })
}
