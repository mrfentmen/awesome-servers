/**
 * Chuck Norris — Random Chuck Norris jokes from the public joke API. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.chucknorris.io.
 */
const API = "https://api.chucknorris.io"

export class ChuckNorrisError extends Error {}

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
      headers: { "user-agent": "chucknorris-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new ChuckNorrisError(`Chuck Norris returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof ChuckNorrisError) throw e
    if ((e as Error).name === "AbortError") throw new ChuckNorrisError("Chuck Norris request timed out")
    throw new ChuckNorrisError(`Chuck Norris request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function randomJoke(category = ""): Promise<string> {
  const cat = category.trim().toLowerCase()
  const url = cat === "" ? `${API}/jokes/random` : `${API}/jokes/random?category=${encodeURIComponent(cat)}`
  const body = await get<unknown>(url)
  const joke = val(at(body, "value"))
  if (joke === "") throw new ChuckNorrisError(`no joke found${cat === "" ? "" : ` for category "${cat}"`}`)
  return [`"${joke}"`, "", `id: ${val(at(body, "id"))}`].join("\n")
}

export async function categories(): Promise<string> {
  const body = await get<unknown>(`${API}/jokes/categories`)
  const names = rows(body).map((c) => val(c)).filter((c) => c !== "")
  if (names.length === 0) throw new ChuckNorrisError("no categories returned")
  return [`${names.length} joke categories`, "", names.join(", ")].join("\n")
}
