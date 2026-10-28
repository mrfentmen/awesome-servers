/**
 * Lichess client — keyless public API.
 * Docs: https://lichess.org/api — be polite: ~1 request / 2s.
 */
const BASE = "https://lichess.org/api"

export class LichessError extends Error {}

let lastRequest = 0
async function getJson<T>(path: string): Promise<T> {
  const now = Date.now()
  const gap = 1100 - (now - lastRequest)
  if (gap > 0) await new Promise((r) => setTimeout(r, gap))
  lastRequest = Date.now()
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "lichess-mcp/1.0" },
  })
  if (!res.ok) throw new LichessError(`Lichess error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Puzzle {
  id: string
  fen: string
  moves: string[]
  rating: number
  ratingDeviation?: number
  popularity?: number
  themes?: string[]
  gameUrl?: string
}

export interface Player {
  username: string
  title?: string
  rating?: number
  perfs?: Record<string, { rating?: number; games?: number; prog?: number }>
  createdAt?: number
  seenAt?: number
  count?: { all?: number }
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function getDailyPuzzle(): Promise<Puzzle | null> {
  const d = await getJson<any>("/puzzle/daily")
  if (!d?.puzzle) return null
  return mapPuzzle(d.puzzle, d.game?.url)
}

export async function getPuzzleById(id: string): Promise<Puzzle | null> {
  const d = await getJson<any>(`/puzzle/${encodeURIComponent(id)}`)
  return d?.puzzle ? mapPuzzle(d.puzzle, d.game?.url) : null
}

export async function getPlayer(username: string): Promise<Player | null> {
  try {
    const u = await getJson<any>(`/user/${encodeURIComponent(username)}`)
    if (!u?.username) return null
    return {
      username: u.username,
      title: u.title,
      perfs: u.perfs,
      createdAt: u.createdAt,
      seenAt: u.seenAt,
      count: u.count,
    }
  } catch (e) {
    if (e instanceof LichessError && String(e).includes("404")) return null
    throw e
  }
}

export async function getTopPlayers(perf: string, limit = 10): Promise<Player[]> {
  // Docs: GET /api/player/top/{nb}/{perfType}
  const d = await getJson<any>(`/player/top/${limit}/${encodeURIComponent(perf)}`)
  return (d.users ?? []).map((u: any) => ({
    username: u.username ?? "?",
    title: u.title,
    rating: u.perfs?.[perf]?.rating,
  }))
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function mapPuzzle(p: any, gameUrl?: string): Puzzle {
  // /api/puzzle/daily returns moves as `solution` (array); /api/puzzle/{id}
  // returns them as `moves` (space-separated string). Handle both.
  const raw = p.solution ?? p.moves ?? ""
  const moves = Array.isArray(raw) ? raw : String(raw).split(" ").filter(Boolean)
  return {
    id: p.id ?? "?",
    fen: p.fen ?? "",
    moves,
    rating: p.rating ?? 0,
    ratingDeviation: p.ratingDeviation,
    popularity: p.popularity,
    themes: p.themes,
    gameUrl,
  }
}

/** UCI move list → readable SAN-ish hint list (pairs are white/black). */
export function formatPuzzle(p: Puzzle): string {
  const lines = [
    `Puzzle ${p.id} — rated ${p.rating}${p.themes?.length ? ` · themes: ${p.themes.join(", ")}` : ""}`,
    `FEN: ${p.fen}`,
    `Solution: ${p.moves.join(" ")}`,
    p.gameUrl ?? "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatPlayer(u: Player): string {
  const perfs = u.perfs ?? {}
  const best = Object.entries(perfs)
    .filter(([, v]) => v?.rating)
    .sort((a, b) => (b[1]?.rating ?? 0) - (a[1]?.rating ?? 0))[0]
  const bestLine = best
    ? `Best rating: ${best[0]} ${best[1]?.rating}${best[1]?.prog ? ` (${best[1].prog >= 0 ? "+" : ""}${best[1].prog}/month)` : ""}`
    : ""
  const lines = [
    `${u.username}${u.title ? ` (${u.title})` : ""}`,
    bestLine,
    u.createdAt ? `On Lichess since ${new Date(u.createdAt).toISOString().slice(0, 10)}` : "",
    u.count?.all ? `${u.count.all.toLocaleString()} games played` : "",
    `https://lichess.org/@/${u.username}`,
  ].filter(Boolean)
  return lines.join("\n")
}
