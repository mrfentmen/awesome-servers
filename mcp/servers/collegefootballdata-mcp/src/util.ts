/**
 * Pure helpers for collegefootballdata-mcp: argument validation, URL building
 * and response shaping. No network calls and no process.env reads here -
 * unit-tested directly from tests/util.test.js against the built dist/.
 */

export type QueryParams = Record<string, string | number | boolean | undefined>;

/** Validate a season year; CFBD covers 1869 (Princeton vs Rutgers) onward. */
export function validateYear(year: unknown, required = true): number | undefined {
  if (year == null || year === '') {
    if (required) throw new Error('year is required (CFBD seasons run from 1869 on)');
    return undefined;
  }
  const n = Number(year);
  if (!Number.isInteger(n) || n < 1869 || n > 2100) {
    throw new Error(`not a plausible season year: ${String(year)}`);
  }
  return n;
}

export function validateWeek(week: unknown): number | undefined {
  if (week == null || week === '') return undefined;
  const n = Number(week);
  if (!Number.isInteger(n) || n < 1 || n > 25) {
    throw new Error('week must be an integer between 1 and 25');
  }
  return n;
}

export function validateSeasonType(st: unknown): string | undefined {
  if (st == null || st === '') return undefined;
  const s = String(st);
  if (s !== 'regular' && s !== 'postseason' && s !== 'both') {
    throw new Error('seasonType must be "regular", "postseason" or "both"');
  }
  return s;
}

/** Trim a free-text query string argument (team names, coach names, ...). */
export function requireText(value: unknown, label: string): string {
  const s = String(value ?? '').trim();
  if (s === '') throw new Error(`${label} is required`);
  return s;
}

export function optionalText(value: unknown, label: string, max = 120): string | undefined {
  if (value == null || String(value).trim() === '') return undefined;
  const s = String(value).trim();
  if (s.length > max) throw new Error(`${label} must be at most ${max} characters`);
  return s;
}

/**
 * Build one CFBD GET URL. CFBD accepts the key either as a Bearer header or
 * as an `authorization` query parameter; this server uses the query param so
 * a URL built here is complete and testable without reading the environment.
 */
export function buildUrl(
  base: string,
  path: string,
  params: QueryParams,
  apiKey: string,
): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === false) continue;
    qs.set(k, String(v));
  }
  qs.set('authorization', apiKey);
  return `${base}${path}?${qs.toString()}`;
}

/** Compact one /games row to the fields that answer "what happened". */
export function summarizeGame(g: Record<string, unknown>): Record<string, unknown> {
  return {
    gameId: g.id,
    season: g.season,
    week: g.week,
    seasonType: g.seasonType,
    startDate: g.startDate,
    completed: g.completed,
    neutralSite: g.neutralSite,
    homeTeam: g.homeTeam,
    homePoints: g.homePoints,
    awayTeam: g.awayTeam,
    awayPoints: g.awayPoints,
    venue: g.venue,
    excitement: g.excitementIndex,
  };
}

export function summarizeGames(data: unknown): unknown {
  if (!Array.isArray(data)) return data;
  return (data as Array<Record<string, unknown>>).map(summarizeGame);
}

/**
 * Flatten a /rankings week into one poll's ordered list. `pollName` matches
 * case-insensitively against the poll name (e.g. "AP Top 25", "Coaches Poll").
 */
export function pollTop(
  data: unknown,
  pollName: string | undefined,
  topN: number | undefined,
): unknown {
  if (!Array.isArray(data)) return data;
  const weeks = data as Array<Record<string, unknown>>;
  if (weeks.length === 0) return [];
  const wanted = pollName?.toLowerCase().trim();
  const out = weeks.map((week) => {
    const polls = (week.polls ?? []) as Array<Record<string, unknown>>;
    const chosen = wanted
      ? polls.find((p) => String(p.poll ?? '').toLowerCase().includes(wanted)) ?? polls[0]
      : polls[0];
    let ranks = (chosen?.ranks ?? []) as Array<Record<string, unknown>>;
    if (topN != null) {
      const n = Number(topN);
      if (!Number.isInteger(n) || n < 1 || n > 25) throw new Error('top_n must be an integer between 1 and 25');
      ranks = ranks.slice(0, n);
    }
    return {
      season: week.season,
      seasonType: week.seasonType,
      week: week.week,
      poll: chosen?.poll ?? null,
      ranks: ranks.map((r) => ({ rank: r.rank, school: r.school, conference: r.conference, points: r.points })),
    };
  });
  return out;
}
