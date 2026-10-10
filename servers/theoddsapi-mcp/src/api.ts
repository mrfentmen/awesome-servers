/**
 * The Odds API v4 client. Needs THEODDS_API_KEY
 * (free at https://the-odds-api.com/, 500 calls/month).
 * Docs: https://the-odds-api.com/liveapi/guides/v4/
 */
const BASE = "https://api.the-odds-api.com/v4"

export class OddsError extends Error {}

function apiKey(): string {
  const k = process.env.THEODDS_API_KEY
  if (!k) throw new OddsError("Set THEODDS_API_KEY first (free at the-odds-api.com).")
  return k
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string, extra: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ ...extra, apiKey: apiKey() }).toString()
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { "User-Agent": "theoddsapi-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new OddsError("Odds API refused (401/403). Check API key.")
  if (res.status === 422) throw new OddsError("Odds API: bad request (check sport key). Quota info in x-requests headers.")
  if (!res.ok) throw new OddsError(`Odds API error ${res.status}`)
  return (await res.json()) as T
}

export interface Sport {
  key: string
  title?: string
  group?: string
}

export async function listSports(): Promise<Sport[]> {
  const rows = await getJson<Raw[]>("/sports")
  return rows.slice(0, 40).map((s) => ({ key: String(s.key), title: s.title, group: s.group }))
}

export interface GameOdds {
  home?: string
  away?: string
  start?: string
  books: string[]
}

export async function gameOdds(sport: string, limit = 5): Promise<GameOdds[]> {
  if (!sport.trim()) throw new OddsError("Sport key is empty (use list_sports).")
  const rows = await getJson<Raw[]>(`/sports/${encodeURIComponent(sport.trim())}/odds?regions=us&markets=h2h&oddsFormat=decimal`)
  return rows.slice(0, limit).map((g) => {
    const books: Raw[] = Array.isArray(g.bookmakers) ? g.bookmakers : []
    return {
      home: g.home_team,
      away: g.away_team,
      start: g.commence_time ? String(g.commence_time).slice(0, 16).replace("T", " ") : undefined,
      books: books.slice(0, 5).map((b) => {
        const mkts: Raw[] = Array.isArray(b.markets) ? b.markets : []
        const outs: Raw[] = Array.isArray(mkts[0]?.outcomes) ? mkts[0].outcomes : []
        const prices = outs.map((o) => `${o.name ?? "?"} ${o.price ?? "?"}`).join(", ")
        return `${b.title ?? b.key ?? "?"}: ${prices || "no lines"}`;
      }),
    }
  })
}

export function formatGame(g: GameOdds, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}${g.away ?? "?"} at ${g.home ?? "?"}${g.start ? ` — ${g.start}` : ""}`,
    ...g.books.map((b) => `   ${b}`),
  ]
  return lines.join("\n")
}

// ---- muxG tools:
const ODDS_OPENLIGADB = "https://api.openligadb.de"
const ODDS_LIST_CAP = 10

function oddsBound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

/** Accept decimal, fractional and American, because a price arrives in whichever one the book quotes. */
function oddsToDecimal(value: number, format: string): { decimal: number; label: string } {
  const f = format.toLowerCase()
  if (f === "fractional" || f === "uk") {
    // e.g. 5/2 -> 3.5
    const text = String(value)
    const m = /^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/.exec(text)
    if (m) {
      const num = Number(m[1])
      const den = Number(m[2])
      if (den === 0) throw new OddsError(`Fractional odds "${text}" has a zero denominator.`)
      return { decimal: 1 + num / den, label: text }
    }
    throw new OddsError(`"${text}" is not fractional odds. They look like 5/2 or 1/1, not 2.5.`)
  }
  if (f === "american" || f === "us") {
    const n = Number(value)
    if (!Number.isFinite(n) || n === 0) throw new OddsError(`American odds "${value}" must be a non-zero number, e.g. -150 or +200.`)
    const decimal = n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n)
    return { decimal, label: n > 0 ? `+${Math.round(n)}` : String(Math.round(n)) }
  }
  const decimal = Number(value)
  if (!Number.isFinite(decimal)) throw new OddsError(`"${value}" is not a decimal price.`)
  if (decimal <= 1) throw new OddsError(`A decimal price of ${decimal} means no possible profit. Decimal prices must be greater than 1.000, which is an even-money price.`)
  return { decimal, label: decimal.toFixed(3).replace(/0+$/, "") }
}

function oddsImplied(decimal: number): number {
  return 1 / decimal
}

/** Turn a set of prices into fair probabilities, and tell you what the book is charging. */
export async function impliedProbability(args: { odds?: string; format?: string }): Promise<string> {
  const raw = String(args?.odds ?? "").trim()
  if (!raw) throw new OddsError("odds is empty. Pass a comma separated list, e.g. '2.10,3.40,3.90'.")
  const format = String(args?.format ?? "decimal")
  const parts = raw.split(/[\s,;|]+/).filter(Boolean)
  if (parts.length < 2) throw new OddsError(`Give at least two prices to work out a margin from. "${raw}" is one price, which has an implied probability but no bookmaker overround.`)
  if (parts.length > ODDS_LIST_CAP) throw new OddsError(`${parts.length} prices is over the ${ODDS_LIST_CAP} limit; a bookmaker outcome list is never that long.`)

  const rows = parts.map((p) => {
    const { decimal, label } = oddsToDecimal(/[a-z]/i.test(p) ? Number(p) : Number(p), format)
    return { label, decimal, implied: oddsImplied(decimal) }
  })
  const sum = rows.reduce((s, r) => s + r.implied, 0)
  const margin = sum - 1
  const normalised = rows.map((r) => r.implied / sum)

  const lines: string[] = [
    `Implied probability from ${rows.length} ${format} price(s)`,
    "",
    ...rows.map((r, i) => `  ${i + 1}. ${r.label.padStart(7)}  implied ${(r.implied * 100).toFixed(2)}%  after removing the margin ${(normalised[i] * 100).toFixed(2)}%`),
    "",
    `Sum of implied probabilities: ${(sum * 100).toFixed(2)}%`,
    `Bookmaker margin (overround): ${(margin * 100).toFixed(2)}%`,
    `A ${rows.length}-way market at a fair price of 1.00 would sum to ${((1 / rows.length) * 100).toFixed(2)}%; anything above that is the take.`,
  ]

  if (sum < 1) {
    lines.push(
      "",
      `The sum is BELOW 100%, which is an arbitrage: staking ${normalised.map((p) => `${(p * 100).toFixed(1)}%`).join(" / ")} across the ${rows.length} outcomes returns ${(1 / sum).toFixed(4)} for every 1.00 staked, a guaranteed gross profit of ${(((1 / sum) - 1) * 100).toFixed(2)}% before fees.`,
      "In practice the book is the arbiter: a price that moves, a stake limit, or a void market turns a theoretical arb into a real loss, and bookmakers limit accounts that find these."
    )
  } else {
    const favourite = rows[rows.indexOf(rows.reduce((a, b) => (a.implied > b.implied ? a : b)))]
    lines.push("", `The shortest price is ${favourite.label} at ${(favourite.implied * 100).toFixed(2)}% implied, the favourite at ${((favourite.implied / sum) * 100).toFixed(1)}% of the true probability.`)
  }

  lines.push(
    "",
    "Removing the margin proportionally assumes the book makes the same relative error on every outcome, which is rarely exactly true. The favourite-longshot bias means longshots are usually marked up more than favourites, so the proportional figure slightly overstates the true probability of a longshot.",
  )
  return lines.join("\n")
}

/** What a set of bets is worth given your own probabilities, and how big to make them. */
export async function expectedValue(args: { bets?: string; bankroll?: number; kelly_fraction?: number }): Promise<string> {
  const raw = String(args?.bets ?? "").trim()
  if (!raw) throw new OddsError("bets is empty. Pass one bet per line as 'probability,decimal-odds', e.g. '0.55,2.10'.")
  const bankroll = Number(args?.bankroll ?? 1000)
  if (!Number.isFinite(bankroll) || bankroll <= 0) throw new OddsError("bankroll must be a positive number, the amount you can lose.")
  const fraction = Number(args?.kelly_fraction ?? 0.25)
  if (!Number.isFinite(fraction) || fraction <= 0 || fraction >= 1) throw new OddsError("kelly_fraction must be between 0 and 1; a quarter Kelly is the usual compromise.")

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) throw new OddsError("bets contains only blank lines.")
  if (lines.length > ODDS_LIST_CAP) throw new OddsError(`${lines.length} bets is over the ${ODDS_LIST_CAP} limit.`)

  const parsed = lines.map((line, i) => {
    const parts = line.split(/[\s,;|]+/).filter(Boolean)
    if (parts.length < 2) throw new OddsError(`Bet ${i + 1} ("${line}") needs a probability and a decimal price.`)
    const p = Number(parts[0])
    const d = Number(parts[1])
    if (!Number.isFinite(p) || p <= 0 || p >= 1) throw new OddsError(`Bet ${i + 1}: "${parts[0]}" is not a probability between 0 and 1.`)
    if (!Number.isFinite(d) || d <= 1) throw new OddsError(`Bet ${i + 1}: "${parts[1]}" is not a decimal price above 1.000.`)
    const edge = p * d - 1
    const kelly = (p * (d - 1) - (1 - p)) / (d - 1)
    return { i: i + 1, p, d, edge, kelly }
  })

  const positives = parsed.filter((b) => b.edge > 0)
  const negatives = parsed.filter((b) => b.edge <= 0)
  const totalStake = positives.reduce((s, b) => s + Math.max(0, b.kelly) * fraction * bankroll, 0)
  const ev = positives.reduce((s, b) => s + b.edge * Math.max(0, b.kelly) * fraction * bankroll, 0)
  const variance = positives.reduce((s, b) => {
    const f = Math.max(0, b.kelly) * fraction
    return s + f * f * b.p * Math.pow(b.d - 1, 2) + f * f * (1 - b.p)
  }, 0)
  const sd = Math.sqrt(variance)

  return [
    `Expected value and staking over ${parsed.length} bet(s) on a bankroll of ${bankroll}`,
    `Staking at ${(fraction * 100).toFixed(0)}% Kelly`,
    "",
    ...parsed.map((b) => {
      const stake = Math.max(0, b.kelly) * fraction * bankroll
      return `  bet ${b.i}: p=${(b.p * 100).toFixed(1)}% at ${b.d.toFixed(2)}  edge ${b.edge >= 0 ? "+" : ""}${(b.edge * 100).toFixed(2)}% per unit  full Kelly ${(b.kelly * 100).toFixed(1)}%  stake ${Math.round(stake)}`
    }),
    "",
    `Bets with a positive edge: ${positives.length} of ${parsed.length}${negatives.length ? `; the other ${negatives.length} would be left unstaked` : ""}`,
    `Total stake at this fraction: ${totalStake.toFixed(0)} of ${bankroll} (${((totalStake / bankroll) * 100).toFixed(1)}% of the bankroll)`,
    `Expected profit: ${ev.toFixed(0)} over the ${parsed.length} bet(s)`,
    sd > 0 ? `Standard deviation of the outcome: ${sd.toFixed(0)}, so a typical swing is larger than the expected profit` : "",
    "",
    "Two things this arithmetic cannot know: whether your probabilities are right, and whether the bets are independent. Full Kelly assumes independence, and correlated bets (the same team, the same day, one league) can turn a set of individually positive bets into a single correlated loss far more likely than the maths implies.",
    ev > 0 && sd > ev
      ? "Expected profit is smaller than one standard deviation, so a single run can easily go the other way. That is normal for a positive-expectation strategy and is not evidence the numbers are wrong."
      : "",
  ]
    .filter(Boolean)
    .join("\n")
}

interface OlMatch {
  matchID?: number
  matchDateTime?: string
  matchDateTimeUTC?: string
  leagueName?: string
  group?: { groupName?: string }
  team1?: { teamName?: string; teamIconUrl?: string; isWinner?: boolean; goals?: number | null }
  team2?: { teamName?: string; teamIconUrl?: string; isWinner?: boolean; goals?: number | null }
  matchIsFinished?: boolean
  matchResults?: { resultsTeam1?: { goals?: number }; resultsTeam2?: { goals?: number } }[]
}

function olGoals(m: OlMatch, side: 1 | 2): number | null {
  const key = side === 1 ? "team1" : "team2"
  const r = m.matchResults?.[0]?.[side === 1 ? "resultsTeam1" : "resultsTeam2"]
  if (r?.goals !== undefined) return r.goals
  return m[key]?.goals ?? null
}

/** Real fixtures with real recent form, which is the input a price has to be judged against. */
export async function fixtureForm(args: { league?: string; limit?: number; form?: number }): Promise<string> {
  const league = String(args?.league ?? "bl1").trim().toLowerCase()
  if (!/^[a-z0-9]{2,10}$/.test(league)) throw new OddsError(`"${league}" is not an OpenLigaDB league shortcut such as bl1, bl2 or fl2.`)
  const limit = oddsBound(args?.limit, 1, ODDS_LIST_CAP, 6)
  const formCount = oddsBound(args?.form, 1, 10, 5)

  const res = await fetch(`${ODDS_OPENLIGADB}/getmatchdata/${league}`, {
    headers: { "User-Agent": "awesome-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (res.status === 404) throw new OddsError(`OpenLigaDB has no league with the shortcut "${league}". Known shortcuts include bl1, bl2, bl3 and fl1.`)
  if (!res.ok) throw new OddsError(`OpenLigaDB returned ${res.status} for ${league}.`)
  const matches = (await res.json()) as OlMatch[]
  if (!Array.isArray(matches) || !matches.length) throw new OddsError(`OpenLigaDB returned no matches for ${league}.`)

  const now = Date.now()
  const finished = matches.filter((m) => m.matchIsFinished)
  const upcoming = matches
    .filter((m) => !m.matchIsFinished && Date.parse(m.matchDateTimeUTC ?? m.matchDateTime ?? "") >= now)
    .sort((a, b) => Date.parse(a.matchDateTimeUTC ?? a.matchDateTime ?? "") - Date.parse(b.matchDateTimeUTC ?? b.matchDateTime ?? ""))

  const formFor = (name: string): { played: number; w: number; d: number; l: number; gf: number; ga: number } => {
    const out = { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }
    for (const m of finished) {
      const home = m.team1?.teamName
      const away = m.team2?.teamName
      const isHome = home === name
      const isAway = away === name
      if (!isHome && !isAway) continue
      const mine = isHome ? olGoals(m, 1) : olGoals(m, 2)
      const theirs = isHome ? olGoals(m, 2) : olGoals(m, 1)
      if (mine === null || theirs === null) continue
      out.played += 1
      out.gf += mine
      out.ga += theirs
      if (mine > theirs) out.w += 1
      else if (mine < theirs) out.l += 1
      else out.d += 1
    }
    return out
  }
  const fmt = (f: { played: number; w: number; d: number; l: number; gf: number; ga: number }): string => {
    if (!f.played) return "no finished matches with a score in this league's data"
    const gd = f.gf - f.ga
    return `${f.w}W ${f.d}D ${f.l}L, ${f.gf} scored, ${f.ga} conceded, goal difference ${gd >= 0 ? "+" : ""}${gd}`
  }

  return [
    `Fixtures and form for ${matches[0]?.leagueName ?? league} (OpenLigaDB, keyless)`,
    `${matches.length} match(es) in the data: ${finished.length} finished, ${upcoming.length} still to play, ${matches.length - finished.length - upcoming.length} in the past and not yet flagged finished`,
    "",
    `Next ${Math.min(limit, upcoming.length)} fixture(s), with each team's record in this league's finished matches:`,
    ...upcoming.slice(0, limit).map((m) => {
      const h = m.team1?.teamName ?? "home"
      const a = m.team2?.teamName ?? "away"
      const when = (m.matchDateTimeUTC ?? m.matchDateTime ?? "").replace("T", " ").replace(/\+.*$/, "").replace("Z", " UTC")
      return [
        `  ${when}  ${h} v ${a}${m.group?.groupName ? `  (${m.group.groupName})` : ""}`,
        `    ${h}: ${fmt(formFor(h))}`,
        `    ${a}: ${fmt(formFor(a))}`,
      ].join("\n")
    }),
    "",
    "This is one league and it carries no prices, so it cannot tell you what to back. It tells you what the teams have actually been doing, which is the input a price has to be checked against, and the two together are worth more than either alone.",
    "Record here covers only this league's own finished matches, so a promoted side and a Champions League side will look very different from their real strength.",
  ]
    .filter(Boolean)
    .join("\n")
}
