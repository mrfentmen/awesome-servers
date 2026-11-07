/**
 * Dog API — Dog breeds with temperament, lifespan and size from dogapi.dog. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against dogapi.dog.
 */
const API = "https://dogapi.dog/api/v2"

export class DogApiError extends Error {}

type Row = Record<string, unknown>

const val = (v: unknown): string => {
  if (typeof v === "string") return v
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : ""
  if (Array.isArray(v)) return v.length > 0 ? val(v[0]) : ""
  if (v && typeof v === "object") {
    const o = v as Row
    if ("en" in o) return val(o.en)
    const first = Object.values(o)[0]
    return first === undefined ? "" : val(first)
  }
  return ""
}

const at = (o: unknown, path: string): unknown =>
  path === "" ? o : path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Row)[k] : undefined), o)

const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : [])

async function get<T>(url: string, init?: RequestInit, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "user-agent": "dogapi-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new DogApiError(`Dog API returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof DogApiError) throw e
    if ((e as Error).name === "AbortError") throw new DogApiError("Dog API request timed out")
    throw new DogApiError(`Dog API request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function listBreeds(limit = 10): Promise<string> {
  const size = Math.min(50, Math.max(1, limit))
  const body = await get<unknown>(`${API}/breeds?page[size]=${size}`)
  const items = rows(at(body, "data"))
  if (items.length === 0) throw new DogApiError("Dog API returned no breeds")
  const lines = items.map((r, i) => `${i + 1}. ${val(at(r, "attributes.name"))} — ${val(at(r, "attributes.life.min"))}-${val(at(r, "attributes.life.max"))} years`)
  return [`Dog breeds — ${items.length} shown`, "", ...lines].join("\n")
}
