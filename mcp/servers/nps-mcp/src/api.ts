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

// ---- muxA tools:
// The existing tools cover a keyword search and one park's alerts and
// campgrounds. These add the state view of the park list and a park's
// things-to-do, which the same API publishes and nothing here reached.
//
// NPS answers every counter as a string, "total": "34", so nothing is added or
// compared without going through npsCount first.
type NpsRow = Record<string, unknown>

function npsRows(data: unknown): NpsRow[] {
  const rows = (data as { data?: unknown })?.data
  return Array.isArray(rows) ? (rows as NpsRow[]) : []
}

function npsCount(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function npsText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim().replace(/\s+/g, " ") : fallback
}

export async function parksByState(args: { state: string; limit?: number }): Promise<string> {
  const state = (args.state ?? "").trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(state)) {
    throw new NpsError(`State must be a two letter code like CA or WY, got "${args.state}".`)
  }
  // The limit is capped at 50 by the API, verified against the published docs
  // and the live endpoint, so the ceiling is applied here.
  const limit = Math.min(Math.max(Math.trunc(args.limit ?? 30), 1), 50)
  const fields = "parkCode,fullName,designation,states,url,latitude,longitude"
  const data = await getJson<Raw>(`/parks?stateCode=${state}&limit=${limit}&fields=${fields}`)
  const rows = npsRows(data)
  const total = npsCount((data as Raw).total)
  if (rows.length === 0) {
    return `No National Park Service sites in "${state}". A state code is the two letter postal code, and only the 50 states plus DC, PR, VI, GU, AS and MP appear.`
  }

  // Designations are counted rather than listed as one bucket, because a state
  // mixes National Parks, Memorials, Historic Sites and others.
  const byDesignation = new Map<string, NpsRow[]>()
  for (const row of rows) {
    const key = npsText(row.designation, "designation not reported")
    byDesignation.set(key, [...(byDesignation.get(key) ?? []), row])
  }

  const lines = [
    `NPS sites in ${state}: ${total.toLocaleString()} total, ${rows.length} listed here`,
    "",
    // The breakdown covers the rows that came back, not the state total, and
    // says so, because the two numbers differ whenever the total is larger.
    `Designations across the ${rows.length} listed:`,
    ...[...byDesignation.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([designation, group]) => `  ${designation} (${group.length})`),
    "",
    ...rows.map((row, i) => {
      const where = npsText(row.states, "")
      const coords =
        typeof row.latitude === "string" && typeof row.longitude === "string" && row.latitude && row.longitude
          ? ` - ${Number(row.latitude).toFixed(4)}, ${Number(row.longitude).toFixed(4)}`
          : ""
      return `${i + 1}. [${npsText(row.parkCode, "?")}] ${npsText(row.fullName, "(unnamed)")}${where ? ` (${where})` : ""}${coords}\n   ${npsText(row.url, "")}`.trimEnd()
    }),
  ]
  if (total > rows.length) {
    lines.push("", `The park list continues past these ${rows.length}. Raise limit, up to 50, to see more.`)
  }
  return lines.join("\n")
}

export async function parkThingsToDo(args: { code: string; limit?: number }): Promise<string> {
  const code = (args.code ?? "").trim().toLowerCase()
  if (!code) throw new NpsError("Park code is empty. Use search_parks or parks_by_state to find one.")
  const limit = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 50)
  const data = await getJson<Raw>(`/thingstodo?parkCode=${encodeURIComponent(code)}&limit=${limit}`)
  const rows = npsRows(data)
  const total = npsCount((data as Raw).total)
  if (rows.length === 0) {
    return `No things to do for park code "${code}". The code is the four letter one from search_parks, and a park without a listed activity answers an empty list rather than an error.`
  }
  // The activity and topic lists are separate arrays and are frequently empty,
  // so they are reported as not listed rather than omitted.
  const names = (value: unknown): string => {
    if (!Array.isArray(value)) return "not listed"
    const list = value
      .map((entry) =>
        typeof entry === "string"
          ? entry
          : entry && typeof entry === "object"
            ? npsText((entry as NpsRow).name ?? (entry as NpsRow).title, "")
            : ""
      )
      .filter((name) => name.length > 0)
    return list.length ? list.join(", ") : "not listed"
  }
  const lines = [
    `Things to do at ${code.toUpperCase()}: ${total.toLocaleString()} total, ${rows.length} shown`,
    "",
    ...rows.map((row, i) => {
      const parts = [`${i + 1}. ${npsText(row.title, "(untitled)")}`]
      const summary = npsText(row.shortDescription ?? row.listingDescription, "")
      if (summary) parts.push(`   ${summary.slice(0, 300)}`)
      const duration = npsText(row.duration ?? (row as NpsRow)["durationDescription"], "")
      if (duration) parts.push(`   Duration: ${duration}`)
      parts.push(`   Activities: ${names(row.activities)}`)
      const location = npsText(row.location, "")
      if (location) parts.push(`   Where: ${location}`)
      if (row.url) parts.push(`   ${npsText(row.url, "")}`)
      return parts.join("\n")
    }),
  ]
  if (total > rows.length) lines.push("", `The list continues past these ${rows.length}. Raise limit, up to 50, to see more.`)
  return lines.join("\n")
}
