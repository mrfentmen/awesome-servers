/**
 * speedrun.com API v1 client — keyless.
 * Docs: https://github.com/speedruncomorg/api
 *
 * Notable endpoint shapes:
 *   GET /games?name=...          → { data: [ { id, names, abbreviation, ... } ] }
 *   GET /games/{id}/categories   → { data: [ { id, name, type, ... } ] }
 *   GET /games/{id}/records      → { data: [ { category, runs: [ { place, run } ] } ] }
 *   GET /leaderboards/{g}/category/{c}?top=N
 *   GET /users/{id}              → { data: { id, names, weblink, ... } }
 *
 * Times come back as ISO-8601 durations ("PT1H02M03S"); we format them
 * as H:MM:SS(.mmm).
 */
const BASE = "https://www.speedrun.com/api/v1"

export class SpeedrunError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "speedrun-mcp/1.0" },
  })
  if (res.status === 429) {
    throw new SpeedrunError("speedrun.com rate limit (100 req / 10 min) — wait a bit and retry.")
  }
  if (!res.ok) throw new SpeedrunError(`speedrun.com API error ${res.status} for ${path}`)
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpeedrunGame {
  id: string
  name: string
  abbreviation: string
  weblink: string
  released?: number
  platformNames: string[]
}

export interface Category {
  id: string
  name: string
  type: string
  rules?: string
  players?: { value: number }
}

export interface RecordEntry {
  place: number
  player: string
  time: string
  date?: string
  video?: string
  link: string
}

export interface RecordCategory {
  category: string
  type: string
  records: RecordEntry[]
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function searchGames(query: string): Promise<SpeedrunGame[]> {
  const data = await getJson<{ data: any[] }>(
    `/games?name=${encodeURIComponent(query)}&max=6&embed=platforms`
  )
  return (data.data ?? []).map((g) => {
    const plats: any[] = Array.isArray(g.platforms) ? g.platforms : g.platforms?.data ?? []
    return {
      id: g.id,
      name: g.names?.international ?? "?",
      abbreviation: g.abbreviation ?? "",
      weblink: g.weblink ?? "",
      released: g.released,
      platformNames: plats.map((p: any) => p.name ?? "?"),
    }
  })
}

export async function getCategories(gameId: string): Promise<Category[]> {
  const data = await getJson<{ data: any[] }>(`/games/${gameId}/categories`)
  return (data.data ?? []).map((c) => ({
    id: c.id,
    name: c.name ?? "?",
    type: c.type ?? "per-game",
    rules: c.rules,
    players: c.players,
  }))
}

export async function getLeaderboard(
  gameId: string,
  categoryId: string,
  top: number
): Promise<{ game: string; category: string; entries: RecordEntry[] } | null> {
  const data = await getJson<{ data: any }>(
    `/leaderboards/${gameId}/category/${categoryId}?top=${top}&embed=players`
  )
  const d = data?.data
  if (!d) return null
  const players = d.players?.data ?? []
  const runs = (d.runs ?? []).slice(0, top)
  const entries = runs.map((r: any) => {
    const run = r.run ?? {}
    const playerRefs: string[] = (run.players ?? [])
      .map((p: any) => p.id ?? p.uri ?? p.name ?? "?")
      .map((idOrUri: string) => {
        const found = players.find((pl: any) => pl.id === idOrUri || pl.uri === idOrUri)
        return found?.names?.international ?? idOrUri.split("/").pop() ?? idOrUri
      })
    return {
      place: r.place,
      player: playerRefs.join(" & ") || "?",
      time: fmtDuration(run.times?.primary),
      date: run.submitted ? run.submitted.slice(0, 10) : undefined,
      video: run.videos?.links?.[0]?.uri,
      link: run.weblink ?? "",
    }
  })
  return { game: d.game ?? gameId, category: d.category ?? categoryId, entries }
}

export async function getWorldRecords(gameId: string): Promise<RecordCategory[]> {
  const data = await getJson<{ data: any[] }>(`/games/${gameId}/records?embed=category`)
  const out: RecordCategory[] = []
  for (const rc of data.data ?? []) {
    const catName =
      rc.category?.data?.name ?? (typeof rc.category === "string" ? rc.category : "?")
    const runs = (rc.runs ?? [])
      .map((r: any) => ({
        place: r.place,
        player: fmtPlayers(r.run?.players ?? []),
        time: fmtDuration(r.run?.times?.primary),
        date: r.run?.submitted ? r.run.submitted.slice(0, 10) : undefined,
        video: r.run?.videos?.links?.[0]?.uri,
        link: r.run?.weblink ?? "",
      }))
    out.push({ category: catName, type: rc.type ?? "per-game", records: runs })
  }
  return out
}

export async function getRunner(userId: string): Promise<any> {
  const data = await getJson<{ data: any }>(`/users/${encodeURIComponent(userId)}`)
  const u = data?.data
  if (!u) return null
  return {
    id: u.id,
    name: u.names?.international ?? userId,
    weblink: u.weblink,
    location: u.location?.country?.names?.international,
    signup: u.signup ? u.signup.slice(0, 10) : undefined,
    runCount: u.runCount,
  }
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** ISO-8601 duration ("PT1H02M03.456S") → "1:02:03.456" */
export function fmtDuration(iso?: string): string {
  if (!iso) return "?"
  const m = iso.match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/)
  if (!m) return iso
  const [, d, h, mi, s] = m
  const parts: string[] = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(String(h).padStart(2, "0"))
  if (mi) parts.push(String(mi).padStart(2, "0"))
  if (s) {
    const [int, frac] = s.split(".")
    parts.push(`${int.padStart(2, "0")}${frac ? `.${frac}` : ""}`)
  }
  while (parts.length < 3) parts.unshift("00")
  return parts.join(":")
}

function fmtPlayers(players: any[]): string {
  return players
    .map((p: any) => p.name ?? p.id ?? "?")
    .join(" & ")
}

export function formatGame(g: SpeedrunGame, index: number): string {
  return `${index + 1}. ${g.name} (${g.abbreviation}) [${g.id}]\n   released ${g.released ?? "?"}${
    g.platformNames.length ? ` · ${g.platformNames.join(", ")}` : ""
  }\n   ${g.weblink}`
}

export function formatRecordCategory(rc: RecordCategory): string {
  return (
    `${rc.category}${rc.type === "full-game" ? "" : ` (${rc.type})`}:\n` +
    rc.records
      .slice(0, 3)
      .map(
        (r) =>
          `  ${r.place}. ${r.player} — ${r.time}${r.date ? ` (${r.date})` : ""}${
            r.video ? `\n     ${r.video}` : ""
          }`
      )
      .join("\n")
  )
}
