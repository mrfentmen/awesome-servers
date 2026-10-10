const UA = "mrfentmen-sports-scores-mcp/1.0 (https://github.com/mrfentmen)"
export class SportsError extends Error {}

async function scoreboard(sport: string, league: string): Promise<string> {
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`,
    { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) }
  )
  if (!res.ok) throw new SportsError(`ESPN error ${res.status}`)
  const d = await res.json()
  const games = (d.events ?? []).slice(0, 15)
  if (games.length === 0) return "No games today"
  return games.map((g: any) => {
    const comp = g.competitions?.[0] ?? {}
    const teams = (comp.competitors ?? []).map((c: any) => {
      const t = c.team ?? {}
      return `${t.abbreviation ?? t.displayName ?? "?"} ${c.score ?? 0}${c.homeAway === "home" ? " (home)" : ""}`
    }).join(" vs ")
    const status = comp.status?.type?.detail ?? comp.status?.type?.name ?? ""
    const winner = (comp.competitors ?? []).find((c: any) => c.winner === true)?.team?.abbreviation
    return `${g.name ?? teams}\n  ${teams} | ${status}${winner ? ` | winner ${winner}` : ""}`
  }).join("\n\n")
}

export async function nbaScores(args: { limit?: number }): Promise<string> {
  void args
  return `NBA\n${await scoreboard("basketball", "nba")}`
}

export async function nflScores(args: { limit?: number }): Promise<string> {
  void args
  return `NFL\n${await scoreboard("football", "nfl")}`
}

export async function mlbScores(args: { limit?: number }): Promise<string> {
  void args
  return `MLB\n${await scoreboard("baseball", "mlb")}`
}

// ---- muxC tools:

