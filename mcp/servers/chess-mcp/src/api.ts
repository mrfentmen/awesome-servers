/**
 * chess.com client. The public API (api.chess.com/pub), keyless.
 * Player profiles, ratings, game archives, leaderboards, titled players.
 */
const PUB = "https://api.chess.com/pub"

export class ChessError extends Error {}

async function getJson(path: string): Promise<any> {
  const res = await fetch(`${PUB}${path}`, {
    headers: { "User-Agent": "chess-mcp/1.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new ChessError(`chess.com error ${res.status}`)
  return res.json()
}

export interface Player {
  username?: string
  name?: string
  title?: string
  followers?: number
  country?: string
  joined?: number
  last_online?: number
  url?: string
  status?: string
  avatar?: string
}

export async function getPlayer(username: string): Promise<Player | null> {
  try {
    return await getJson(`/player/${encodeURIComponent(username)}`)
  } catch (e) {
    if (e instanceof ChessError && String(e).includes("404")) return null
    throw e
  }
}

export async function getPlayerStats(username: string): Promise<Record<string, any>> {
  return getJson(`/player/${encodeURIComponent(username)}/stats`)
}

export async function getPlayerGames(username: string, year: number, month: number): Promise<any[]> {
  const d = await getJson(`/player/${encodeURIComponent(username)}/games/${year}/${String(month).padStart(2, "0")}`)
  return d?.games ?? []
}

export async function getLeaderboards(): Promise<Record<string, any[]>> {
  const d = await getJson("/leaderboards")
  const out: Record<string, any[]> = {}
  for (const key of ["daily", "rapid", "blitz", "bullet"]) out[key] = d?.[key] ?? []
  return out
}

export async function getTitledPlayers(title: string): Promise<string[]> {
  return getJson(`/titled/${encodeURIComponent(title)}`)
}

const PERFS = ["chess_bullet", "chess_blitz", "chess_rapid", "chess_daily"] as const

export function formatPlayer(p: Player): string {
  const joined = p.joined ? new Date(p.joined * 1000).toISOString().slice(0, 10) : undefined
  const last = p.last_online ? new Date(p.last_online * 1000).toISOString().slice(0, 10) : undefined
  const lines = [
    `${p.username ?? "?"}${p.title ? ` (${p.title})` : ""}${p.name ? `, ${p.name}` : ""}`,
    `Status: ${p.status ?? "?"} | Followers: ${p.followers ?? "?"}`,
    joined ? `Joined: ${joined}` : "",
    last ? `Last online: ${last}` : "",
    p.url ?? "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatStats(stats: Record<string, any>): string {
  const lines: string[] = []
  for (const perf of PERFS) {
    const p = stats[perf]
    if (!p?.last) continue
    const best = p.best?.rating != null ? `, best ${p.best.rating}` : ""
    const recStr = p.record
      ? `, record ${rec(p.record)}`
      : ""
    lines.push(`${perf.replace("chess_", "").toUpperCase()}: ${p.last.rating}${best}${recStr}`)
  }
  if (stats.tactics?.highest) lines.push(`TACTICS: highest ${stats.tactics.highest.rating}`)
  if (stats.puzzle_rush?.best) lines.push(`PUZZLE RUSH: best ${stats.puzzle_rush.best.score}`)
  return lines.join("\n")
}

function rec(r: { win?: number; loss?: number; draw?: number }): string {
  return `${r.win ?? 0} wins, ${r.loss ?? 0} losses, ${r.draw ?? 0} draws`
}

export function formatGame(g: any, index?: number): string {
  const white = g.white ?? {}
  const black = g.black ?? {}
  const time = g.end_time ? new Date(g.end_time * 1000).toISOString().slice(0, 10) : ""
  const result =
    white.result === "win" ? `1-0 (${white.username ?? "White"})` :
    black.result === "win" ? `0-1 (${black.username ?? "Black"})` :
    "1/2-1/2"
  return `${index !== undefined ? `${index + 1}. ` : ""}${white.username ?? "?"} (${white.rating ?? "?"}) vs ${black.username ?? "?"} (${black.rating ?? "?"}) | ${result}${time ? ` | ${time}` : ""} | ${g.time_control ?? "?"}${g.url ? ` | ${g.url}` : ""}`
}

export function formatBoardRow(r: any): string {
  return `${r.rank ?? "?"}. ${r.username ?? "?"}${r.title ? ` (${r.title})` : ""} score ${r.score ?? "?"}`
}

// ---- muxA tools:

// The live feed answers with these group keys. Note that there is no bare
// "rapid", "blitz" or "bullet" key, only live_ prefixed and puzzle variants.

interface BoardRow {
  rank?: number
  username?: string
  name?: string
  title?: string
  score?: number
  status?: string
  flair_code?: string
  country_id?: number
  country?: string
  win_count?: number
  loss_count?: number
  draw_count?: number
  trend_rank?: { direction?: number; delta?: number }
  trend_score?: { direction?: number; delta?: number }
  url?: string
}

export async function titledPlayerLookup(args: { title: string; player: string }): Promise<string> {
  const title = (args.title ?? '').trim().toUpperCase()
  const player = (args.player ?? '').trim().toLowerCase()
  if (!title) return 'Provide a title, e.g. GM.'
  if (!player) return 'Provide the player name to look for.'
  // getTitledPlayers hands back chess.com's { players: [...] } wrapper rather
  // than a bare array, so accept both shapes
  const raw = (await getTitledPlayers(title)) as unknown
  const users = Array.isArray(raw)
    ? raw.map(String)
    : Array.isArray((raw as { players?: unknown[] })?.players)
      ? ((raw as { players: unknown[] }).players).map(String)
      : []
  if (!users.length) {
    return `chess.com returned no list for the ${title} title, so no lookup is possible.`
  }
  const lowered = users.map((u) => String(u).toLowerCase())
  const exact = lowered.indexOf(player)
  const partial = lowered
    .map((u, i) => ({ u, i }))
    .filter((r) => r.u.includes(player))
    .slice(0, 25)
  if (exact < 0 && !partial.length) {
    return `"${args.player}" holds no ${title} title. chess.com lists ${users.length} ${title} players, indexed 0 to ${users.length - 1}.`
  }
  const lines = [
    `chess.com lists ${users.length} ${title} player(s), alphabetically by username.`,
  ]
  if (exact >= 0) {
    lines.push(`${users[exact]} is a ${title}, at position ${exact} of ${users.length}.`)
  }
  if (partial.length) {
    lines.push(`${partial.length} username(s) contain "${args.player}":`)
    for (const r of partial) lines.push(`  ${users[r.i]} — position ${r.i} of ${users.length}`)
  }
  return lines.join('\n')
}
