/**
 * Yu-Gi-Oh! Cards — Yu-Gi-Oh! card text, stats and prices from YGOPRODeck. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against db.ygoprodeck.com.
 */
const API = "https://db.ygoprodeck.com/api/v7"

export class YgoProDeckError extends Error {}

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
      headers: { "user-agent": "ygoprodeck-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new YgoProDeckError(`Yu-Gi-Oh! Cards returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof YgoProDeckError) throw e
    if ((e as Error).name === "AbortError") throw new YgoProDeckError("Yu-Gi-Oh! Cards request timed out")
    throw new YgoProDeckError(`Yu-Gi-Oh! Cards request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function getCard(name: string): Promise<string> {
  const q = name.trim()
  if (q === "") throw new YgoProDeckError("card name must not be empty")
  const body = await get<unknown>(`${API}/cardinfo.php?name=${encodeURIComponent(q)}`)
  const items = rows(at(body, "data"))
  if (items.length === 0) return `YGOPRODeck has no card called "${q}".`
  const card = items[0]
  return [
    `${val(at(card, "name"))} — ${val(at(card, "type"))}`,
    "",
    `Attribute: ${val(at(card, "attribute"))}`,
    `Level: ${val(at(card, "level"))}`,
    `ATK / DEF: ${val(at(card, "atk"))} / ${val(at(card, "def"))}`,
    `Archetype: ${val(at(card, "archetype"))}`,
    "",
    val(at(card, "desc")).slice(0, 400),
  ].join("\n")
}
