/**
 * DiceBear — Generate avatar images from any seed with DiceBear styles. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.dicebear.com.
 */
const API = "https://api.dicebear.com/9.x"

export class DiceBearError extends Error {}

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
      headers: { "user-agent": "dicebear-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new DiceBearError(`DiceBear returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof DiceBearError) throw e
    if ((e as Error).name === "AbortError") throw new DiceBearError("DiceBear request timed out")
    throw new DiceBearError(`DiceBear request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function generateAvatar(style = "avataaars", seed = "codebuff"): Promise<string> {
  const look = style.trim().toLowerCase()
  const s = seed.trim()
  if (look === "" || s === "") throw new DiceBearError("style and seed must not be empty")
  const url = `${API}/${encodeURIComponent(look)}/svg?seed=${encodeURIComponent(s)}`
  const body = await get<unknown>(`${API}/${encodeURIComponent(look)}/json?seed=${encodeURIComponent(s)}`)
  const svg = val(at(body, "svg"))
  if (svg === "") return `DiceBear has no style called "${look}". Try avataaars, bottts or pixel-art.`
  return [
    `DiceBear avatar (${look})`,
    "",
    `Seed: ${s}`,
    `Image: ${url}`,
    `SVG size: ${svg.length} bytes`,
    "",
    svg.slice(0, 120),
  ].join("\n")
}
