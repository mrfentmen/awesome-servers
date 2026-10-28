/**
 * Formula 1 Results — keyless public API client.
 */
const BASE = "https://api.jolpi.ca/ergast/f1"
const SOURCE = "Formula 1 Results"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "f1-mcp", accept },
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

export async function getJson(path: string, accept = "application/json", timeoutMs = 25000): Promise<any> {
  const res = await request(path, accept, timeoutMs)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

function mr(data: any): any {
  const out = data?.MRData
  if (!out) throw new SourceError("the F1 API returned an unexpected payload")
  return out
}

export async function seasons(a: { limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 30)
  const data = mr(await getJson("/seasons/?format=json", "application/json", 30000))
  const list: any[] = data?.SeasonTable?.Seasons ?? []
  if (!list.length) throw new SourceError("the F1 API returned no seasons")
  const total = Number(data?.total ?? list.length)
  const latest = [...list].sort((x: any, y: any) => Number(y.season) - Number(x.season))
  return [
    `${total} season(s) on record (showing the newest ${Math.min(limit, latest.length)}):`,
    "",
    ...latest.slice(0, limit).map((s: any, i: number) => `${i + 1}. ${clean(s?.season)}`),
  ].join("\n")
}

export async function schedule(a: { year: number; limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 12, 30)
  const year = Math.floor(a.year)
  if (!Number.isInteger(year) || year < 1950 || year > 2100) throw new SourceError("year must be between 1950 and 2100")
  const data = mr(await getJson(`/${year}/?format=json`, "application/json", 30000))
  const races: any[] = data?.RaceTable?.Races ?? []
  if (!races.length) return `The F1 API has no calendar for ${year}.`
  return [
    `${year} calendar: ${Number(data?.total ?? races.length)} round(s) (showing ${Math.min(limit, races.length)}):`,
    "",
    ...races.slice(0, limit).map((r: any, i: number) => {
      const circuit = r?.Circuit ?? {}
      const place = [clean(circuit?.location?.locality), clean(circuit?.location?.country)].filter(Boolean).join(", ")
      return `${String(r?.round).padStart(2)}. ${clean(r?.raceName)} · ${clean(r?.date)}${place ? ` · ${place}` : ""}`
    }),
  ].join("\n")
}

export async function raceResults(a: { year: number; round: number; limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 30)
  const year = Math.floor(a.year)
  const round = Math.floor(a.round)
  if (!Number.isInteger(year) || year < 1950 || year > 2100) throw new SourceError("year must be between 1950 and 2100")
  if (!Number.isInteger(round) || round < 1 || round > 30) throw new SourceError("round must be between 1 and 30")
  const data = mr(await getJson(`/${year}/${round}/results/?format=json`, "application/json", 30000))
  const race = (data?.RaceTable?.Races ?? [])[0]
  const results: any[] = race?.Results ?? []
  if (!results.length) return `No results found for ${year} round ${round} (check the round number with schedule).`
  return [
    `${clean(race?.raceName)} ${year} - ${clean(race?.date)}`,
    "",
    ...results.slice(0, limit).map((r: any) => {
      const driver = r?.Driver ?? {}
      const team = clean(r?.Constructor?.name)
      const time = clean(r?.Time?.time ?? r?.status)
      const pos = clean(r?.positionText ?? r?.position)
      const grid = Number(r?.grid)
      return [
        `${pos.padStart(2)}. ${clean(driver?.givenName)} ${clean(driver?.familyName)}`.padEnd(34),
        team.padEnd(22),
        `grid ${grid > 0 ? grid : "-"} · ${time}`,
      ].join(" ")
    }),
  ].join("\n")
}

export async function driverStandings(a: { year: number; round?: number; limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 30)
  const year = Math.floor(a.year)
  const round = Math.floor(a.round ?? 0)
  if (!Number.isInteger(year) || year < 1950 || year > 2100) throw new SourceError("year must be between 1950 and 2100")
  if (!Number.isInteger(round) || round < 0 || round > 30) throw new SourceError("round must be 0 (final) or 1-30")
  const path = round > 0 ? `/${year}/${round}/driverstandings/?format=json` : `/${year}/driverstandings/?format=json`
  const data = mr(await getJson(path, "application/json", 30000))
  const lists: any[] = data?.StandingsTable?.StandingsLists ?? []
  const standings: any[] = Array.isArray(lists[0]?.DriverStandings) ? lists[0].DriverStandings : []
  if (!standings.length) return `No standings found for ${year}${round ? ` round ${round}` : ""}.`
  const atRound = clean(lists[0]?.round)
  return [
    `${year} driver standings${round ? ` after round ${atRound}` : ` (final, round ${atRound})`}:`,
    "",
    ...standings.slice(0, limit).map((s: any) => {
      const driver = s?.Driver ?? {}
      const teams = Array.isArray(s?.Constructors) ? s.Constructors.map((c: any) => clean(c?.name)).join(", ") : ""
      return `${String(s?.position).padStart(2)}. ${clean(driver?.givenName)} ${clean(driver?.familyName)}`.padEnd(36) +
        ` ${String(s?.points).padStart(4)} pts  ${teams}`
    }),
  ].join("\n")
}
