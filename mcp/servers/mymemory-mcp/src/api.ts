/**
 * MyMemory — Free machine translation between more than 100 languages. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.mymemory.translated.net.
 */
const API = "https://api.mymemory.translated.net"

export class MyMemoryError extends Error {}

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
      headers: { "user-agent": "mymemory-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new MyMemoryError(`MyMemory returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof MyMemoryError) throw e
    if ((e as Error).name === "AbortError") throw new MyMemoryError("MyMemory request timed out")
    throw new MyMemoryError(`MyMemory request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function translate(source: string, fromLang = "en", toLang = "es"): Promise<string> {
  const input = source.trim()
  if (input === "") throw new MyMemoryError("text must not be empty")
  const pair = `${fromLang.toLowerCase()}|${toLang.toLowerCase()}`
  const body = await get<unknown>(`${API}/get?q=${encodeURIComponent(input)}&langpair=${encodeURIComponent(pair)}`)
  const out = val(at(body, "responseData.translatedText"))
  if (out === "") throw new MyMemoryError("MyMemory returned no translation")
  return [`${fromLang.toLowerCase()} -> ${toLang.toLowerCase()}`, "", `Input: ${input}`, `Output: ${out}`].join("\n")
}
