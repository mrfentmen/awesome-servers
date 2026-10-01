/**
 * National Park Service API client. Needs NPS_API_KEY
 * (free at https://www.nps.gov/subjects/developing-personal-use-api-key.htm).
 * Docs: https://www.nps.gov/subjects/api/index.htm
 */
const BASE = "https://developer.nps.gov/api/v1"

export class NpsError extends Error {}

// api.data.gov publishes DEMO_KEY as an official shared key, so this server
// works with no setup at all.
const DEMO_KEY = "DEMO_KEY"

function apiKey(): string {
  const k = process.env.NPS_API_KEY
  if (k) return k
  // The live x-ratelimit-limit header on developer.nps.gov reports 10 requests
  // per hour for this shared key, so a personal key is still worth having.
  return DEMO_KEY
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?"
  const res = await fetch(`${BASE}${path}${sep}api_key=${encodeURIComponent(apiKey())}`, {
    headers: { "User-Agent": "nps-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new NpsError("NPS refused (401/403). Check NPS_API_KEY.")
  if (res.status === 429) {
    throw new NpsError(
      "NPS rate limit reached. The shared DEMO_KEY allows 10 requests per hour, set NPS_API_KEY for a personal key."
    )
  }
  if (!res.ok) throw new NpsError(`NPS error ${res.status}`)
  return (await res.json()) as T
}

export interface Park {
  code: string
  name?: string
  states?: string
  designation?: string
  url?: string
}

export async function searchParks(query: string, limit = 5): Promise<Park[]> {
  if (!query.trim()) throw new NpsError("Query is empty.")
  const data = await getJson<Raw>(`/parks?q=${encodeURIComponent(query.trim())}&limit=${Math.min(Math.max(limit, 1), 50)}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.slice(0, limit).map((p) => ({
    code: String(p.parkCode),
    name: p.fullName,
    states: p.states,
    designation: p.designation,
    url: p.url,
  }))
}

export async function parkAlerts(code: string): Promise<string[]> {
  if (!code.trim()) throw new NpsError("Park code is empty.")
  const data = await getJson<Raw>(`/alerts?parkCode=${encodeURIComponent(code.trim())}&limit=10`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.slice(0, 10).map((a) => `${String(a.title ?? "?")}${a.category ? ` [${a.category}]` : ""} — ${String(a.description ?? "").slice(0, 140)}`)
}

export async function parkCampgrounds(code: string, limit = 5): Promise<string[]> {
  if (!code.trim()) throw new NpsError("Park code is empty.")
  const data = await getJson<Raw>(`/campgrounds?parkCode=${encodeURIComponent(code.trim())}&limit=${Math.min(Math.max(limit, 1), 50)}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.slice(0, limit).map((c) => {
    const fees: Raw[] = Array.isArray(c.fees) ? c.fees : []
    const fee = fees[0] ? ` ($${fees[0].cost ?? "?"})` : ""
    return `${String(c.name ?? "?")}${fee}${c.description ? ` — ${String(c.description).slice(0, 120)}` : ""}`
  })
}

export function formatPark(p: Park, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${p.code}] ${p.name ?? "(unnamed)"}${p.designation ? ` (${p.designation})` : ""}${p.states ? ` — ${p.states}` : ""}${p.url ? `\n   ${p.url}` : ""}`
}

// ---- The state and things-to-do premium tools moved to the licence gateway
// (src/gateway.ts); what remains here is the free NPS client.
