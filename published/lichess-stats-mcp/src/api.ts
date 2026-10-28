/**
 * Lichess — keyless public API client.
 */
const BASE = "https://lichess.org"
const SOURCE = "Lichess"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "lichess-stats-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

function day(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function username(value: string): string {
  const name = clean(value)
  if (!/^[A-Za-z0-9_-]{2,30}$/.test(name)) throw new SourceError("username must be letters, digits, _ or -")
  return name
}

export async function userProfile(a: { username: string }): Promise<string> {
  const name = username(a.username)
  const d = await getJson(`/api/user/${encodeURIComponent(name)}`)
  if (!d || !d.username) return `Lichess has no user ${name}.`
  const perfs = Object.entries(d.perfs ?? {})
    .filter(([, v]: any) => v && v.games > 0)
    .map(([k, v]: any) => `- ${k}: ${v.rating ?? "?"}${v.prov ? " (provisional)" : ""} · ${v.games} game(s)`)
  const count = d.count ?? {}
  const playTime = Number(d.playTime?.total ?? 0)
  return [
    `${clean(d.username)}${d.title ? ` (${clean(d.title)})` : ""}`,
    d.profile?.bio ? `Bio: ${clean(d.profile.bio).replace(/\n+/g, " ").slice(0, 400)}` : "",
    `Joined ${d.createdAt ? day(d.createdAt) : "?"} · last seen ${d.seenAt ? day(d.seenAt) : "?"} · play time ${Math.round(playTime / 3600)} h`,
    count.all !== undefined ? `Games: ${count.all} · wins ${count.win ?? 0} · losses ${count.loss ?? 0} · draws ${count.draw ?? 0}` : "",
    d.tosViolation ? "Flagged for terms of service violations" : "",
    d.disabled ? "Account closed" : "",
    "",
    perfs.length ? `Ratings:\n${perfs.join("\n")}` : "No rated games on record.",
  ].filter(Boolean).join("\n")
}

export async function userActivity(a: { username: string; count?: number }): Promise<string> {
  const name = username(a.username)
  const count = a.count ?? 3
  if (!Number.isInteger(count) || count < 1 || count > 10) throw new SourceError("count must be between 1 and 10")
  const d = await getJson(`/api/user/${encodeURIComponent(name)}/activity?max=${count}`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `${name} has no recent activity on Lichess.`
  return [
    `Recent activity for ${name} (${rows.length} day(s)):`,
    "",
    ...rows.map((r) => {
      const interval = r.interval ?? {}
      const games = Object.entries(r.games ?? {}).map(([k, v]: any) => `${k} ${v.rating ?? "?"} in ${v.games ?? 0}`).join(", ")
      const puzzles = r.puzzles?.score ? `puzzles score ${r.puzzles.score} over ${r.puzzles.games ?? "?"}` : ""
      return [
        `- ${interval.start ? day(Number(interval.start)) : "?"}:`,
        games ? `    play: ${games}` : "",
        puzzles ? `    ${puzzles}` : "",
        r.practice?.length ? `    practice: ${r.practice.map((p: any) => clean(p)).join(", ")}` : "",
        r.tournaments?.length ? `    tournaments: ${r.tournaments.length}` : "",
      ].filter(Boolean).join("\n")
    }),
  ].join("\n")
}

export async function userStatus(a: { usernames: string[] }): Promise<string> {
  const names = (a.usernames ?? []).map((u) => username(u))
  if (!names.length || names.length > 50) throw new SourceError("usernames must list between 1 and 50 accounts")
  const d = await getJson(`/api/users/status?ids=${names.join(",")}`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return "Lichess returned no status for those accounts."
  const challenge = names.filter((n) => !rows.some((r) => clean(r.name).toLowerCase() === n.toLowerCase()))
  return [
    `Status of ${rows.length} of ${names.length} account(s):`,
    "",
    ...rows.map((r) => `- ${clean(r.name)}${r.title ? ` (${clean(r.title)})` : ""}: ${r.online ? "online" : "offline"}${r.playing ? " · in a game" : ""}${r.streaming ? " · streaming" : ""}${r.patron ? " · patron" : ""}`),
    challenge.length ? `\nNo profile matched: ${challenge.join(", ")}` : "",
  ].filter(Boolean).join("\n")
}

export async function dailyPuzzle(): Promise<string> {
  const d = await getJson(`/api/puzzle/daily`)
  if (!d?.puzzle) throw new SourceError("Lichess returned no daily puzzle")
  const solution: string[] = Array.isArray(d.puzzle.solution)
    ? d.puzzle.solution.map((m: string, i: number) => `${i + 1}. ${m}`)
    : []
  const players: any[] = d.game?.players ?? []
  const themes: any[] = d.puzzle.themes ?? []
  return [
    `Lichess puzzle of the day ${clean(d.puzzle.id)} (rating ${d.puzzle.rating ?? "?"})`,
    players.length === 2 ? `From a game between ${clean(players[0]?.name ?? players[0]?.user?.name)} and ${clean(players[1]?.name ?? players[1]?.user?.name)}` : "",
    themes.length ? `Themes: ${themes.join(", ")}` : "",
    "",
    `Solution: ${solution.join(" ")}`,
    "",
    d.game?.pgn ? `Game PGN (first 400 characters):\n${clean(d.game.pgn).slice(0, 400)}` : "",
    `Puzzle: https://lichess.org/training/${clean(d.puzzle.id)}`,
  ].filter(Boolean).join("\n")
}
