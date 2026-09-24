/**
 * Kit (ConvertKit) API v4 client. Needs KIT_API_KEY
 * (Kit Settings > Developer, free accounts included).
 * Docs: https://developers.kit.com/
 */
const BASE = "https://api.convertkit.com/v4"

export class KitError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.KIT_API_KEY
  if (!key) throw new KitError("Set KIT_API_KEY first (Kit Settings > Developer).")
  return { "User-Agent": "convertkit-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${key}` }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new KitError("Kit rejected the key (401/403).")
  if (res.status === 404) throw new KitError("Not found.")
  if (!res.ok) throw new KitError(`Kit error ${res.status}`)
  return (await res.json()) as T
}

export interface Subscriber {
  email?: string
  firstName?: string
  state?: string
  created?: string
}

export async function findSubscriber(email: string): Promise<Subscriber | null> {
  if (!email.includes("@")) throw new KitError(`Not an email: "${email}".`)
  const data = await getJson<Raw>(`/subscribers?email_address=${encodeURIComponent(email.trim())}`)
  const rows: Raw[] = Array.isArray(data.subscribers) ? data.subscribers : []
  const s = rows[0]
  if (!s) return null
  return {
    email: s.email_address ?? s.email,
    firstName: s.first_name,
    state: s.state,
    created: s.created_at ? String(s.created_at).slice(0, 10) : undefined,
  }
}

export interface Named {
  id: string
  name: string
}

export async function listForms(limit = 10): Promise<Named[]> {
  const data = await getJson<Raw>(`/forms?per_page=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.forms) ? data.forms : []
  return rows.slice(0, limit).map((f) => ({ id: String(f.id), name: String(f.name ?? "?") }))
}

export async function listBroadcasts(limit = 10): Promise<Named[]> {
  const data = await getJson<Raw>(`/broadcasts?per_page=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.broadcasts) ? data.broadcasts : []
  return rows.slice(0, limit).map((b) => ({ id: String(b.id), name: String(b.subject ?? b.name ?? "?") }))
}

export function formatNamed(rows: Named[], label: string): string {
  if (rows.length === 0) return `No ${label}.`
  return rows.map((r, i) => `${i + 1}. [${r.id}] ${r.name}`).join("\n")
}
