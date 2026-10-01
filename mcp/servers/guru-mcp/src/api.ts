export class GuruError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GuruError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.getguru.com/api/v1"

function authHeaders(): Record<string, string> {
  const u = process.env.GURU_USER
  const t = process.env.GURU_TOKEN
  if (!u || !t) throw new GuruError("Set GURU_USER and GURU_TOKEN environment variables (Basic auth).")
  const b64 = typeof Buffer !== "undefined" ? Buffer.from(`${u}:${t}`).toString("base64") : btoa(`${u}:${t}`)
  return { Authorization: "Basic " + b64 }
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(BASE + path, { headers: { ...UA, ...authHeaders() } })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new GuruError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function listTeams(): Promise<string> {
  return req("/teams")
}

export function searchCards(query: string, maxResults?: string): Promise<string> {
  const p = new URLSearchParams({ q: query })
  if (maxResults) p.set("maxResults", maxResults)
  return req(`/search/query?${p.toString()}`)
}

export function getCollection(collectionId: string): Promise<string> {
  return req(`/collections/${encodeURIComponent(collectionId)}`)
}
