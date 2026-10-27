
export interface m0_SeasonArgs {
  year?: number;
}

const m0 = (() => {
const BASE = 'https://api.jolpi.ca/ergast/f1';

async function current(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/current.json`, {
    headers: { 'User-Agent': 'mrfentmen-jolpica-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Jolpica returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const mr = (d.MRData ?? {}) as Record<string, unknown>;
  const raceTable = (mr.RaceTable ?? {}) as Record<string, unknown>;
  const races = (raceTable.Races ?? []) as Array<Record<string, unknown>>;
  return `F1 ${String(raceTable.season ?? 'current')} season (${races.length} races):\n` +
    races.slice(0, 10).map((r, i) => {
      const s = (k: string) => (r[k] != null ? String(r[k]) : '');
      const c = (r.Circuit ?? {}) as Record<string, unknown>;
      return `${i + 1}. ${s('round')}. ${s('raceName')} | ${String(c.circuitName ?? '')} | ${s('date')}`;
    }).join('\n');
}

async function races(args: m0_SeasonArgs): Promise<string> {
  const year = args.year ?? 'current';
  const res = await fetch(`${BASE}/${year}.json`, {
    headers: { 'User-Agent': 'mrfentmen-jolpica-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Jolpica returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const mr = (d.MRData ?? {}) as Record<string, unknown>;
  const rt = (mr.RaceTable ?? {}) as Record<string, unknown>;
  const races = (rt.Races ?? []) as Array<Record<string, unknown>>;
  return `F1 ${String(rt.season ?? year)} race calendar:\n` +
    races.map((r, i) => {
      const s = (k: string) => (r[k] != null ? String(r[k]) : '');
      const c = (r.Circuit ?? {}) as Record<string, unknown>;
      return `${i + 1}. ${s('round')}. ${s('raceName')} | ${String(c.circuitName ?? '')} | ${s('date')}`;
    }).join('\n');
}

async function drivers(args: m0_SeasonArgs): Promise<string> {
  const year = args.year ?? 'current';
  const res = await fetch(`${BASE}/${year}/drivers.json`, {
    headers: { 'User-Agent': 'mrfentmen-jolpica-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Jolpica returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const mr = (d.MRData ?? {}) as Record<string, unknown>;
  const dt = (mr.DriverTable ?? {}) as Record<string, unknown>;
  const drivers = (dt.Drivers ?? []) as Array<Record<string, unknown>>;
  return `F1 ${String(dt.season ?? year)} drivers (${drivers.length}):\n` +
    drivers.map((dr, i) => {
      const s = (k: string) => (dr[k] != null ? String(dr[k]) : '');
      return `${i + 1}. ${s('code')} ${s('givenName')} ${s('familyName')} (${s('nationality')})`;
    }).join('\n');
}

return { current, drivers, races };
})();

interface ConstructorStandingsArgs {
  season?: string
  limit?: number
}

interface QualifyingReportArgs {
  season?: string
  round?: string
  limit?: number
}

interface F1ConstructorRow {
  position?: string | number
  points?: string | number
  wins?: string | number
  Constructor?: { name?: string; nationality?: string }
}

type QualifyingTime = string | { time?: string }

interface F1QualifyingRow {
  position?: string | number
  Driver?: { code?: string; givenName?: string; familyName?: string }
  Constructor?: { name?: string }
  Q1?: QualifyingTime
  Q2?: QualifyingTime
  Q3?: QualifyingTime
}

interface F1QualifyingRace {
  season?: string
  round?: string
  raceName?: string
  date?: string
  Circuit?: { circuitName?: string }
  QualifyingResults?: F1QualifyingRow[]
}

interface JolpicaResponse {
  MRData?: {
    StandingsTable?: {
      StandingsLists?: Array<{
        season?: string
        round?: string
        ConstructorStandings?: F1ConstructorRow[]
      }>
    }
    RaceTable?: { Races?: F1QualifyingRace[] }
  }
}

const m1 = (() => {
const BASE = "https://api.jolpi.ca/ergast/f1"
const UA = "mrfentmen-formula1-mcp/1.0 (https://github.com/mrfentmen)"
class F1Error extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new F1Error("F1 API rate limit hit, wait and retry")
  if (!res.ok) throw new F1Error(`F1 API error ${res.status}`)
  return (await res.json()) as T
}

async function lastRace(args: Record<string, never>): Promise<string> {
  const d = await get<any>(`${BASE}/current/last/results/?format=json`)
  const race = d?.MRData?.RaceTable?.Races?.[0]
  if (!race) return "No race data"
  const results = (race.Results ?? []).slice(0, 10).map((r: any, i: number) => {
    const d2 = r?.Driver ?? {}
    const t = r?.Time?.time ?? ""
    return `${i + 1}. ${d2.givenName} ${d2.familyName} (${d2.code ?? ""})${t ? ` ${t}` : ""}`
  })
  return `Race: ${race.raceName} | ${race.Circuit?.circuitName ?? ""}\nDate: ${race.date ?? ""}\n\n${results.join("\n")}`
}

async function driverStandings(args: Record<string, never>): Promise<string> {
  const d = await get<any>(`${BASE}/current/driverstandings/?format=json`)
  const standings = d?.MRData?.StandingsTable?.StandingsLists?.[0]
  if (!standings) return "No standings data"
  return (standings.DriverStandings ?? []).slice(0, 10).map((s: any, i: number) => {
    const dr = s?.Driver ?? {}
    return `${i + 1}. ${dr.givenName} ${dr.familyName} | ${s.points} pts | ${s.wins} wins | team ${s.Constructors?.[0]?.name ?? "n/a"}`
  }).join("\n")
}

async function seasonSchedule(args: { season?: number }): Promise<string> {
  const season = args.season ?? "current"
  const d = await get<any>(`${BASE}/${season}/races/?format=json&limit=30`)
  const races = d?.MRData?.RaceTable?.Races ?? []
  if (!races.length) return "No schedule data"
  return races.map((r: any) => `${r.round}. ${r.raceName} | ${r.date ?? ""} | ${r.Circuit?.circuitName ?? ""}`).join("\n")
}

// ---- muxF tools: the constructor championship and the qualifying session

async function constructorStandings(args: ConstructorStandingsArgs): Promise<string> {
  const season = String(args.season ?? "current").trim() || "current"
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 30)
  const d = await get<JolpicaResponse>(`${BASE}/${season}/constructorstandings/?format=json`)
  const table = d?.MRData?.StandingsTable?.StandingsLists?.[0]
  if (!table) throw new F1Error(`No constructor standings for the ${season} season.`)
  const rows = table.ConstructorStandings ?? []
  if (!rows.length) throw new F1Error(`The ${season} season has no constructor standings yet.`)
  const leader = Number(rows[0]?.points ?? 0)
  const lines = [
    `F1 ${table.season} constructor championship after round ${table.round} (${rows.length} team(s))`,
    "",
    ...rows.slice(0, limit).map((s, i) => {
      const c = s?.Constructor ?? {}
      const pts = Number(s.points ?? 0)
      const share = leader > 0 ? `${((pts / leader) * 100).toFixed(1)}% of the leader` : "the leader"
      return `${s.position ?? i + 1}. ${c.name ?? "unknown"} (${c.nationality ?? "n/a"}) — ${pts} pts, ${s.wins ?? 0} win(s), ${share}`
    }),
    "",
    "Constructor points are the sum of both cars, so they double the driver table and cannot be compared with it directly.",
  ]
  return lines.join("\n")
}

async function qualifyingReport(args: QualifyingReportArgs): Promise<string> {
  const season = String(args.season ?? "current").trim() || "current"
  const round = String(args.round ?? "").trim()
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 30)
  const path = round ? `${season}/${round}/qualifying/` : `${season}/last/qualifying/`
  const d = await get<JolpicaResponse>(`${BASE}/${path}?format=json`)
  const race = d?.MRData?.RaceTable?.Races?.[0]
  if (!race)
    throw new F1Error(round ? `No qualifying session recorded for round ${round} of ${season}.` : `No qualifying session recorded for the last round of ${season}.`)
  const rows = race.QualifyingResults ?? []
  if (!rows.length) throw new F1Error(`Qualifying for ${race.raceName ?? "that round"} has no recorded times.`)
  // Jolpica returns a session time as a plain string in some seasons and as
  // {time} in others, so both shapes have to be read.
  const time = (v: QualifyingTime | undefined): string => {
    if (!v) return "—"
    if (typeof v === "string") return v
    return v.time ? String(v.time) : "—"
  }
  const lines = [
    `F1 ${race.season} round ${race.round} — ${race.raceName ?? ""} qualifying, ${race.Circuit?.circuitName ?? ""} (${race.date ?? ""})`,
    "",
    ...rows.slice(0, limit).map((r) => {
      const dr = r?.Driver ?? {}
      const who = [dr.code, dr.givenName, dr.familyName].filter(Boolean).join(" ")
      return `${r.position ?? "?"}. ${who} (${r.Constructor?.name ?? "n/a"}) | Q1 ${time(r.Q1)} | Q2 ${time(r.Q2)} | Q3 ${time(r.Q3)}`
    }),
    "",
    "A dash means the driver did not take part in that session, having already been eliminated or not entered.",
  ]
  return lines.join("\n")
}

return { F1Error, constructorStandings, driverStandings, lastRace, qualifyingReport, seasonSchedule };
})();

export const F1Error = m1.F1Error;
export const current = m0.current;
export const driverStandings = m1.driverStandings;
export const drivers = m0.drivers;
export const lastRace = m1.lastRace;
export const races = m0.races;
export const seasonSchedule = m1.seasonSchedule;
export const m0_drivers = m0.drivers;
export const m0_races = m0.races;
export const m0_current = m0.current;
export const m1_seasonSchedule = m1.seasonSchedule;
export const m1_lastRace = m1.lastRace;
export const m1_driverStandings = m1.driverStandings;
export const m1_F1Error = m1.F1Error;
export const m1_constructorStandings = m1.constructorStandings;
export const m1_qualifyingReport = m1.qualifyingReport;

