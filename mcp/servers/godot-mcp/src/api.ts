export class GodotError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GodotError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://godotengine.org/asset-library/api"

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(BASE + path, { headers: { ...UA } })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new GodotError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function searchAssets(filter?: string, godotVersion?: string, assetType?: string, category?: string, maxResults?: string, sort?: string): Promise<string> {
  const p = new URLSearchParams()
  if (filter) p.set("filter", filter)
  if (godotVersion) p.set("godot_version", godotVersion)
  if (assetType) p.set("type", assetType)
  if (category) p.set("category", category)
  if (maxResults) p.set("max_results", maxResults)
  if (sort) p.set("sort", sort)
  const q = p.toString()
  return req(`/asset${q ? "?" + q : ""}`)
}

export function getAsset(assetId: string): Promise<string> {
  return req(`/asset/${encodeURIComponent(assetId)}`)
}

export function getConfigure(): Promise<string> {
  return req("/configure")
}

// ---- muxC tools:

