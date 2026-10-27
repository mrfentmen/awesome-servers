/**
 * MLB Stats API (statsapi.mlb.com). Keyless and documented by observation;
 * every endpoint below was checked against live data.
 */
const BASE = "https://statsapi.mlb.com/api/v1"

export class MlbError extends Error {}

async function getJson(path: string, timeoutMs = 25000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "mlb-stats-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new MlbError("MLB Stats API has no data for that request")
    if (!res.ok) throw new MlbError(`MLB Stats API responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof MlbError) throw e
    if ((e as Error).name === "AbortError") throw new MlbError("MLB Stats API request timed out")
    if (e instanceof SyntaxError) throw new MlbError("MLB Stats API returned malformed JSON")
    throw new MlbError(`MLB Stats API request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const season = (s?: number): number => s ?? new Date().getUTCFullYear()

// The standings payload only carries league/division ids, so names are looked
// up once and cached for the life of the process.
const divisionNames = new Map<number, string>()
const leagueNames: Record<number, string> = { 103: "American League", 104: "National League" }

async function divisionName(id: number): Promise<string> {
  if (divisionNames.size === 0) {
    const d = await getJson("/divisions?sportId=1")
    for (const div of d?.divisions ?? []) divisionNames.set(Number(div.id), String(div.name))
  }
  return divisionNames.get(id) ?? `division ${id}`
}

export async function teams(sportId: number): Promise<string> {
  const d = await getJson(`/teams?sportId=${sportId}`)
  const rows: any[] = d?.teams ?? []
  if (rows.length === 0) return "No teams returned."
  const byDivision = new Map<string, any[]>()
  for (const t of rows) {
    const key = `${t.league?.name ?? "League"} · ${t.division?.name ?? "Division"}`
    byDivision.set(key, [...(byDivision.get(key) ?? []), t])
  }
  const lines = [...byDivision.entries()].map(
    ([group, list]) => `${group}\n${list.map((t) => `   ${t.id} ${t.name} (${t.abbreviation ?? t.teamCode})`).join("\n")}`
  )
  return [`${rows.length} teams:`, "", ...lines].join("\n")
}

export async function standings(leagueId: string, seasonYear?: number): Promise<string> {
  const d = await getJson(`/standings?leagueId=${leagueId}&season=${season(seasonYear)}&hydrate=team`)
  const records: any[] = d?.records ?? []
  if (records.length === 0) return "No standings returned."
  const groups = await Promise.all(
    records.map(async (r) => {
      const label = r.division?.id
        ? await divisionName(Number(r.division.id))
        : leagueNames[Number(r.league?.id)] ?? "League"
      const rows = (r.teamRecords ?? []).map(
        (t: any) =>
          `   ${String(t.team?.name ?? t.team?.id).padEnd(24)} ${t.wins}-${t.losses} (${t.winningPercentage}) ${t.streak?.streakCode ?? ""}${t.gamesBack && t.gamesBack !== "-" ? ` GB ${t.gamesBack}` : ""}`
      )
      return `${label}\n${rows.join("\n")}`
    })
  )
  const lines = groups
  return [`MLB standings, ${season(seasonYear)} season:`, "", ...lines].join("\n")
}

export async function schedule(date: string, sportId: number): Promise<string> {
  const day = date.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new MlbError("Pass a date as YYYY-MM-DD")
  const d = await getJson(`/schedule?date=${day}&sportId=${sportId}&hydrate=team,linescore`)
  const dates: any[] = d?.dates ?? []
  const games: any[] = dates.flatMap((x) => x.games ?? [])
  if (games.length === 0) return `No MLB games on ${day}.`
  const lines = games.map((g) => {
    const away = g.teams?.away?.team?.name ?? "away"
    const home = g.teams?.home?.team?.name ?? "home"
    const score = g.status?.abstractGameState === "Final" || g.linescore
      ? ` ${g.teams?.away?.score ?? "-"}-${g.teams?.home?.score ?? "-"}`
      : ""
    return `• ${away} @ ${home}${score}\n   ${g.status?.detailedState ?? "scheduled"} · ${g.venue?.name ?? ""}`
  })
  return [`MLB games on ${day} (${games.length}):`, "", ...lines].join("\n")
}

export async function teamRoster(teamId: number, seasonYear?: number): Promise<string> {
  const d = await getJson(`/teams/${teamId}/roster?season=${season(seasonYear)}`)
  const rows: any[] = d?.roster ?? []
  if (rows.length === 0) return "No roster returned."
  const lines = rows.map(
    (p) => `   ${String(p.jerseyNumber ?? "").padStart(2, " ")}  ${p.person?.fullName ?? "?"} — ${p.position?.abbreviation ?? "?"} (${p.status?.description ?? "active"})`
  )
  const teamName = rows[0]?.parentTeamId ? `team ${teamId}` : `team ${teamId}`
  return [`Roster for ${teamName}, ${season(seasonYear)} (${rows.length} players):`, "", ...lines].join("\n")
}

export async function teamRecord(teamId: number, seasonYear?: number): Promise<string> {
  const yr = season(seasonYear)
  const d = await getJson(`/teams/${teamId}?season=${yr}`)
  const t = (d?.teams ?? [])[0]
  if (!t) throw new MlbError(`No team with id ${teamId}`)
  // Records live in the standings payload, not on the team itself.
  const st = await getJson(`/standings?leagueId=103,104&season=${yr}&hydrate=team`)
  let record: any = null
  let group = ""
  for (const r of st?.records ?? []) {
    const hit = (r.teamRecords ?? []).find((x: any) => Number(x.team?.id) === teamId)
    if (hit) {
      record = hit
      group = r.division?.id ? await divisionName(Number(r.division.id)) : ""
      break
    }
  }
  const streak = record?.streak?.streakCode ? ` · streak ${record.streak.streakCode}` : ""
  return [
    `${t.name} (${t.abbreviation ?? t.teamCode})`,
    `League: ${t.league?.name ?? "?"} · Division: ${t.division?.name ?? group ?? "?"}`,
    `Venue: ${t.venue?.name ?? "?"}${t.venue?.location?.city ? `, ${t.venue.location.city}` : ""}`,
    record
      ? `Record: ${record.wins}-${record.losses} (${record.winningPercentage})${streak}${record.gamesBack && record.gamesBack !== "-" ? ` · ${record.gamesBack} games back` : " · in first place"}`
      : `Record: not published for ${yr} yet`,
    `Season: ${yr}`,
  ].join("\n")
}

export async function playerInfo(personId: number): Promise<string> {
  const d = await getJson(`/people/${personId}?hydrate=currentTeam,stats(type=season)`)
  const p = (d?.people ?? [])[0]
  if (!p) throw new MlbError(`No player with id ${personId}`)
  const stats: any[] = (p.stats ?? []).map((s: any) => {
    const line = s.splits?.[0]?.stat ?? {}
    const parts = Object.entries(line)
      .filter(([k]) => ["avg", "hr", "rbi", "ops", "era", "wins", "losses", "strikeOuts", "gamesPlayed"].includes(k))
      .map(([k, v]) => `${k} ${v}`)
    return `   ${s.type?.displayName ?? "stat"} ${s.group?.displayName ?? ""}: ${parts.join(", ") || "no season line yet"}`
  })
  return [
    `${p.fullName} (${p.primaryPosition?.abbreviation ?? "?"})`,
    `Born: ${p.birthDate ?? "?"} in ${p.birthCity ?? "?"}, ${p.birthCountry ?? "?"}`,
    `Bats: ${p.batSide?.code ?? "?"} · Throws: ${p.pitchHand?.code ?? "?"} · Height: ${p.height ?? "?"} · Weight: ${p.weight ?? "?"}`,
    `Team: ${p.currentTeam?.name ?? "free agent / not listed"}`,
    `Debut: ${p.mlbDebutDate ?? "not listed"}`,
    "",
    "Season stats:",
    ...(stats.length ? stats : ["   no season stats returned"]),
  ].join("\n")
}

export async function teamSchedule(teamId: number, seasonYear?: number): Promise<string> {
  const d = await getJson(`/schedule?sportId=1&teamId=${teamId}&season=${season(seasonYear)}`)
  const games: any[] = (d?.dates ?? []).flatMap((x: any) => x.games ?? [])
  if (games.length === 0) return "No games returned for that team and season."
  const upcoming = games.filter((g) => g.status?.abstractGameState === "Preview").slice(0, 5)
  const recent = games.filter((g) => g.status?.abstractGameState === "Final").slice(-5)
  const fmt = (g: any) =>
    `• ${g.officialDate} · ${g.teams?.away?.team?.name} @ ${g.teams?.home?.team?.name}${g.status?.abstractGameState === "Final" ? ` — ${g.teams?.away?.score}-${g.teams?.home?.score}` : ""}`
  return [
    `Team ${teamId}, ${season(seasonYear)} — ${games.length} games on record`,
    "",
    "Next up:",
    ...(upcoming.length ? upcoming.map(fmt) : ["   none scheduled"]),
    "",
    "Last played:",
    ...(recent.length ? recent.map(fmt) : ["   none played"]),
  ].join("\n")
}
