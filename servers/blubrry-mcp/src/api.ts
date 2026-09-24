export class BlubrryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BlubrryError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.blubrry.com/2"

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new BlubrryError(`Set the ${name} environment variable.`)
  return v
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(BASE + path, {
    headers: { ...UA, Authorization: "Bearer " + envStrict("BLUBRRY_ACCESS_TOKEN") },
  })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new BlubrryError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function listShows(): Promise<string> {
  return req("/media/index.json")
}

export function listShowMedia(keyword: string): Promise<string> {
  return req(`/media/${encodeURIComponent(keyword)}/index.json`)
}

export function getShowStatsSummary(keyword: string): Promise<string> {
  return req(`/stats/${encodeURIComponent(keyword)}/summary.json`)
}

export function getShowEpisodeStats(keyword: string): Promise<string> {
  return req(`/stats/${encodeURIComponent(keyword)}/show-episodes/`)
}

export function getShowStatsTotals(keyword: string): Promise<string> {
  return req(`/stats/${encodeURIComponent(keyword)}/totals.json`)
}
