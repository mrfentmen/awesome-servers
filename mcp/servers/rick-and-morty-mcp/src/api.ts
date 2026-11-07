/**
 * Rick and Morty — Characters, locations and episodes from the Rick and Morty API. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against rickandmortyapi.com.
 */
const API = "https://rickandmortyapi.com/api"

export class RickAndMortyError extends Error {}

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
      headers: { "user-agent": "rick-and-morty-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new RickAndMortyError(`Rick and Morty returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof RickAndMortyError) throw e
    if ((e as Error).name === "AbortError") throw new RickAndMortyError("Rick and Morty request timed out")
    throw new RickAndMortyError(`Rick and Morty request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function searchCharacters(name: string, limit = 5): Promise<string> {
  const q = name.trim()
  if (q === "") throw new RickAndMortyError("name must not be empty")
  const size = Math.min(20, Math.max(1, limit))
  const body = await get<unknown>(`${API}/character?name=${encodeURIComponent(q)}`)
  const items = rows(at(body, "results")).slice(0, size)
  if (items.length === 0) return `No characters match "${q}".`
  const lines = items.map((r, i) => `${i + 1}. ${val(at(r, "name"))} — ${val(at(r, "status"))} ${val(at(r, "species"))} (${val(at(r, "origin.name"))})`)
  return [`Rick and Morty characters for "${q}" — ${val(at(body, "info.count"))} found`, "", ...lines].join("\n")
}
