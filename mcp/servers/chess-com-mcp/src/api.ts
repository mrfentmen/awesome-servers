/**
 * Chess.com — Chess.com player profiles, ratings and records. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.chess.com.
 */
const API = "https://api.chess.com/pub"

export class ChessComError extends Error {}

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
      headers: { "user-agent": "chess-com-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new ChessComError(`Chess.com returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof ChessComError) throw e
    if ((e as Error).name === "AbortError") throw new ChessComError("Chess.com request timed out")
    throw new ChessComError(`Chess.com request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function getPlayer(username: string): Promise<string> {
  const user = username.trim().toLowerCase()
  if (user === "") throw new ChessComError("username must not be empty")
  const body = await get<unknown>(`${API}/player/${encodeURIComponent(user)}`)
  const joined = at(body, "joined")
  const online = at(body, "last_online")
  const stamp = (v: unknown): string => (typeof v === "number" ? new Date(v * 1000).toISOString().slice(0, 10) : "n/a")
  return [
    `${val(at(body, "username"))}${val(at(body, "name")) === "" ? "" : ` (${val(at(body, "name"))})`}`,
    "",
    `Title: ${val(at(body, "title")) || "none"}`,
    `Followers: ${val(at(body, "followers"))}`,
    `Country: ${val(at(body, "country"))}`,
    `Joined: ${stamp(joined)}`,
    `Last online: ${stamp(online)}`,
    `Status: ${val(at(body, "status"))}`,
  ].join("\n")
}
