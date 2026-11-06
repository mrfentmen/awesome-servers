/**
 * ESPN — public scoreboards for every league ESPN covers. Keyless.
 *
 * Verified live: GET /apis/site/v2/sports/{sport}/{league}/scoreboard returns
 * `events[].competitions[].competitors[]` with `homeAway`, `score` and
 * `team.displayName`, plus `status.type.detail` ("Final", "7:30 PM", ...).
 */
const API = "https://site.api.espn.com/apis/site/v2/sports"

export class EspnError extends Error {}

interface Competitor {
  homeAway?: string
  winner?: boolean
  score?: string
  team?: { displayName?: string; abbreviation?: string; shortDisplayName?: string }
}

interface Event {
  name?: string
  date?: string
  competitions?: Array<{
    competitors?: Competitor[]
    status?: { type?: { detail?: string; state?: string } }
  }>
}

interface Board {
  events?: Event[]
  leagues?: Array<{ name?: string; abbreviation?: string }>
}

const SPORT = /^[a-z0-9]+(\.[0-9]+)?$/
const LEAGUE = /^[a-z0-9]+(\.[0-9]+)?$/

async function get<T>(url: string, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "espn-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new EspnError("ESPN has no scoreboard for that sport and league")
    if (!res.ok) throw new EspnError(`ESPN responded ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof EspnError) throw e
    if ((e as Error).name === "AbortError") throw new EspnError("ESPN request timed out")
    throw new EspnError(`ESPN request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const day = (iso: string | undefined): string => (iso ?? "").slice(0, 10)

function line(event: Event): string {
  const comp = event.competitions?.[0]
  const teams = comp?.competitors ?? []
  if (teams.length === 0) return `- ${event.name ?? "(no teams listed)"}`

  const home = teams.find((t) => t.homeAway === "home") ?? teams[0]
  const away = teams.find((t) => t.homeAway === "away") ?? teams[1]
  const name = (t: Competitor | undefined): string => t?.team?.displayName ?? t?.team?.abbreviation ?? "TBD"
  const score = (t: Competitor | undefined): string => (t?.score !== undefined && t.score !== "" ? t.score : "-")
  const status = comp?.status?.type?.detail ?? "scheduled"

  if (!away) return `- ${name(home)} ${score(home)} — ${status}`
  return `- ${name(away)} ${score(away)} at ${name(home)} ${score(home)} — ${status}`
}

export async function scoreboard(sport: string, league: string, dates?: string): Promise<string> {
  const s = sport.trim().toLowerCase()
  const l = league.trim().toLowerCase()
  if (!SPORT.test(s)) throw new EspnError(`"${sport}" is not an ESPN sport, e.g. "football" or "basketball"`)
  if (!LEAGUE.test(l)) throw new EspnError(`"${league}" is not an ESPN league, e.g. "nfl" or "eng.1"`)
  if (dates !== undefined && dates !== "" && !/^\d{8}$/.test(dates.trim())) {
    throw new EspnError("dates must be eight digits, YYYYMMDD")
  }

  const query = dates !== undefined && dates !== "" ? `?dates=${dates.trim()}` : ""
  const board = await get<Board>(`${API}/${s}/${l}/scoreboard${query}`)
  const events = board.events ?? []
  if (events.length === 0) {
    return `No ${s}/${l} games${dates ? ` on ${dates}` : " right now"}. Try another date or league.`
  }

  const label = board.leagues?.[0]?.name ?? `${s}/${l}`
  const date = day(events[0]?.date)
  const body = events.map(line)

  return [`${label}${date ? ` — ${date}` : ""}`, `${events.length} game${events.length === 1 ? "" : "s"}`, "", ...body].join("\n")
}
