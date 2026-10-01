/**
 * PocketBase REST API client. Points at any instance via POCKETBASE_URL
 * (default http://127.0.0.1:8090). Superuser auth via
 * POCKETBASE_EMAIL + POCKETBASE_PASSWORD (token cached in memory).
 * Docs: https://pocketbase.io/docs/api-records/
 */
const BASE = (process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090").replace(/\/+$/, "")

export class PocketBaseError extends Error {}

let cachedToken: string | null = null

async function authToken(): Promise<string> {
  if (cachedToken) return cachedToken
  const email = process.env.POCKETBASE_EMAIL
  const password = process.env.POCKETBASE_PASSWORD
  if (!email || !password) {
    throw new PocketBaseError("Set POCKETBASE_EMAIL and POCKETBASE_PASSWORD (a superuser on your instance).")
  }
  const res = await fetch(`${BASE}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "User-Agent": "pocketbase-mcp/1.0", "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new PocketBaseError(`PocketBase login failed (${res.status}). Check URL and credentials.`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any
  if (!data.token) throw new PocketBaseError("PocketBase login returned no token.")
  cachedToken = data.token
  return cachedToken as string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function authed<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "User-Agent": "pocketbase-mcp/1.0", Accept: "application/json", "Content-Type": "application/json", ...(init?.headers ?? {}), Authorization: await authToken() },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) {
    cachedToken = null
    throw new PocketBaseError("PocketBase refused the request (401/403). Check credentials and collection API rules.")
  }
  if (res.status === 404) throw new PocketBaseError("Not found.")
  if (!res.ok) throw new PocketBaseError(`PocketBase error ${res.status}`)
  return (await res.json()) as T
}

export async function health(): Promise<string> {
  const res = await fetch(`${BASE}/api/health`, {
    headers: { "User-Agent": "pocketbase-mcp/1.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new PocketBaseError(`PocketBase at ${BASE} is unreachable (${res.status}). Set POCKETBASE_URL.`)
  return `PocketBase at ${BASE} is healthy.`
}

export interface CollectionInfo {
  id: string
  name: string
  type?: string
}

export async function listCollections(): Promise<CollectionInfo[]> {
  const data = await authed<Raw>("/api/collections?perPage=200")
  const rows: Raw[] = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : []
  return rows.map((c) => ({ id: String(c.id), name: String(c.name), type: c.type }))
}

export async function listRecords(collection: string, filter = "", limit = 10): Promise<Raw[]> {
  const qs = new URLSearchParams({ perPage: String(Math.min(Math.max(limit, 1), 200)) })
  if (filter.trim()) qs.set("filter", filter.trim())
  const data = await authed<Raw>(`/api/collections/${encodeURIComponent(collection.trim())}/records?${qs}`)
  return Array.isArray(data.items) ? data.items.slice(0, limit) : []
}

export async function createRecord(collection: string, data: Raw): Promise<Raw> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new PocketBaseError("Record data must be a JSON object.")
  }
  return await authed<Raw>(`/api/collections/${encodeURIComponent(collection.trim())}/records`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function formatRecord(r: Raw, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const { id, collectionId, collectionName, created, updated, expand, ...fields } = r
  const shown = Object.entries(fields).slice(0, 8).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")
  return `${prefix}[${String(id ?? "?")}] ${shown}`
}
