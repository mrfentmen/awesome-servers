/**
 * OpenLigaDB — keyless public API client.
 */
const BASE = "https://api.openligadb.de"
const SOURCE = "OpenLigaDB"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "openligadb-mcp", accept },
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

function teamName(team: any): string {
  return clean(team?.teamName) || clean(team?.shortName) || "unknown team"
}

function score(match: any): string {
  const results: any[] = Array.isArray(match?.matchResults) ? match.matchResults : []
  const final = results.find((r) => Number(r.resultTypeID) === 2) ?? results[results.length - 1]
  if (!final) return "no result yet"
  return `${final.pointsTeam1 ?? "?"}:${final.pointsTeam2 ?? "?"}`
}

function goals(match: any): string {
  const list: any[] = Array.isArray(match?.goals) ? match.goals : []
  if (!list.length) return ""
  return list.map((g) => `${clean(g.goalGetterName) || "goal"} ${g.matchMinute}'`).join(", ")
}

export async function leagues(a: { limit?: number; search?: string }): Promise<string> {
  const limit = a.limit ?? 30
  if (!Number.isInteger(limit) || limit < 1 || limit > 80) throw new SourceError("limit must be between 1 and 80")
  const search = clean(a.search ?? "").toLowerCase()
  const d = await getJson(`/getavailableleagues`)
  const all: any[] = Array.isArray(d) ? d : []
  if (!all.length) throw new SourceError("OpenLigaDB returned no leagues")
  const rows = search ? all.filter((l) => `${clean(l.leagueName)} ${clean(l.leagueShortcut)}`.toLowerCase().includes(search)) : all
  if (!rows.length) return `No league matches "${search}".`
  return [
    `${rows.length} league entry(ies)${search ? ` matching "${search}"` : ""} (showing ${Math.min(limit, rows.length)}):`,
    "",
    ...rows.slice(0, limit).map((l) => `- ${clean(l.leagueShortcut)} ${clean(l.leagueSeason)} · ${clean(l.leagueName)}${l.sport?.sportName ? ` · ${clean(l.sport.sportName)}` : ""}`),
    "",
    `Use the shortcut and season with the matches tool, e.g. league bl1 season 2025.`,
  ].join("\n")
}

export async function matches(a: { league: string; season?: string; matchday?: number; limit?: number }): Promise<string> {
  const league = clean(a.league).toLowerCase()
  if (!/^[a-z0-9]{2,12}$/.test(league)) throw new SourceError("league must be a shortcut like bl1 or bl2")
  const season = a.season ? clean(a.season) : ""
  if (season && !/^\d{4}$/.test(season)) throw new SourceError("season must be a four-digit start year")
  if (a.matchday !== undefined && (!Number.isInteger(a.matchday) || a.matchday < 1 || a.matchday > 40)) throw new SourceError("matchday must be between 1 and 40")
  const limit = a.limit ?? 9
  if (!Number.isInteger(limit) || limit < 1 || limit > 30) throw new SourceError("limit must be between 1 and 30")
  const path = a.matchday !== undefined && season
    ? `/getmatchdata/${league}/${season}/${a.matchday}`
    : season
      ? `/getmatchdata/${league}/${season}`
      : `/getmatchdata/${league}`
  const d = await getJson(path)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `OpenLigaDB has no matches for ${league}${season ? ` season ${season}` : ""}${a.matchday ? ` matchday ${a.matchday}` : ""}.`
  const first = rows[0]
  return [
    `${clean(first.leagueName) || league} - ${rows.length} match(es)${a.matchday ? ` on matchday ${a.matchday}` : ""} (showing ${Math.min(limit, rows.length)}):`,
    "",
    ...rows.slice(0, limit).map((m) => {
      const when = clean(m.matchDateTime).replace("T", " ").slice(0, 16)
      const line = `- ${teamName(m.team1)} ${score(m)} ${teamName(m.team2)} · ${when}${clean(m.group?.groupName) ? ` · ${clean(m.group.groupName)}` : ""}${m.matchIsFinished ? "" : " · not finished"}`
      const g = goals(m)
      return g ? `${line}\n  goals: ${g}` : line
    }),
    "",
    season ? `Season ${season}` : "Current season",
  ].join("\n")
}
