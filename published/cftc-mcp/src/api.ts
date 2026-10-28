/**
 * CFTC Commitments of Traders — keyless public API client.
 */
const BASE = "https://publicreporting.cftc.gov/resource/6dca-aqww.json"
const SOURCE = "CFTC Commitments of Traders"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "cftc-mcp", accept },
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

type Cot = Record<string, any>

function fmt(n: unknown): string {
  const v = Number(n)
  return Number.isFinite(v) ? v.toLocaleString("en-US") : String(n ?? "")
}

const num = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

async function fetchRows(market: string, limit: number): Promise<Cot[]> {
  const m = market.trim()
  if (m.length < 2) throw new SourceError("market name must be at least 2 characters")
  const where = encodeURIComponent(`market_and_exchange_names like '%${m.replace(/'/g, "''").toUpperCase()}%'`)
  const d = await getJson(`?$where=${where}&$order=report_date_as_yyyy_mm_dd DESC&$limit=${limit}`)
  if (!Array.isArray(d)) throw new SourceError("CFTC returned an unexpected response")
  return d
}

function block(r: Cot): string {
  const date = String(r.report_date_as_yyyy_mm_dd ?? "").slice(0, 10)
  const oi = num(r.open_interest_all)
  return [
    `${date} · ${r.market_and_exchange_names}`,
    `  open interest: ${fmt(oi)}`,
    `  non-commercial: long ${fmt(r.noncomm_positions_long_all)} / short ${fmt(r.noncomm_positions_short_all)}`,
    `  commercial: long ${fmt(r.comm_positions_long_all)} / short ${fmt(r.comm_positions_short_all)}`,
    `  non-reportable: long ${fmt(r.nonrept_positions_long_all)} / short ${fmt(r.nonrept_positions_short_all)}`,
    `  net non-commercial: ${fmt(num(r.noncomm_positions_long_all) - num(r.noncomm_positions_short_all))}`,
  ].join("\n")
}

export async function latestCotReport(a: { market: string }): Promise<string> {
  const rows = await fetchRows(a.market, 1)
  if (!rows.length) return `CFTC has no market matching "${a.market}".`
  return [`Latest COT report for "${a.market}":`, block(rows[0])].join("\n")
}

export async function cotHistory(a: { market: string; limit: number }): Promise<string> {
  const rows = await fetchRows(a.market, a.limit)
  if (!rows.length) return `CFTC has no market matching "${a.market}".`
  return [`${rows.length} weekly COT reports for "${a.market}":`, ...rows.map(block)].join("\n\n")
}

export async function searchMarkets(a: { query: string; limit: number }): Promise<string> {
  const q = a.query.trim()
  if (q.length < 2) throw new SourceError("query must be at least 2 characters")
  const where = encodeURIComponent(`market_and_exchange_names like '%${q.replace(/'/g, "''").toUpperCase()}%'`)
  const d = await getJson(`?$select=market_and_exchange_names&$where=${where}&$group=market_and_exchange_names&$limit=${a.limit}`)
  const rows: Cot[] = Array.isArray(d) ? d : []
  if (!rows.length) return `No CFTC market matches "${q}".`
  return [`${rows.length} markets matching "${q}":`, ...rows.map((r, i) => `${i + 1}. ${r.market_and_exchange_names}`)].join("\n")
}

async function latestReportDate(): Promise<string> {
  const d = await getJson("?$select=max(report_date_as_yyyy_mm_dd)")
  const raw = Array.isArray(d) ? d[0]?.max_report_date_as_yyyy_mm_dd : ""
  if (!raw) throw new SourceError("CFTC returned no report date")
  return String(raw)
}

async function rowsForDate(date: string): Promise<Cot[]> {
  const where = encodeURIComponent(`report_date_as_yyyy_mm_dd='${date}'`)
  const d = await getJson(`?$where=${where}&$limit=5000`)
  const rows: Cot[] = Array.isArray(d) ? d : []
  if (!rows.length) throw new SourceError(`CFTC has no rows for ${date.slice(0, 10)}`)
  return rows
}

export async function positioningExtremes(a: { limit: number }): Promise<string> {
  const date = await latestReportDate()
  const rows = await rowsForDate(date)
  const ranked = rows
    .map((r) => ({ market: clean(r.market_and_exchange_names), net: num(r.noncomm_positions_long_all) - num(r.noncomm_positions_short_all), oi: num(r.open_interest_all) }))
    .filter((r) => r.oi > 0 && r.market)
    .sort((x, y) => y.net - x.net)
  if (!ranked.length) throw new SourceError("CFTC returned no usable rows")
  const top = ranked.slice(0, a.limit)
  const bottom = ranked.slice(-a.limit).reverse()
  return [
    `Most net-long non-commercial positioning · report ${date.slice(0, 10)}`,
    ...top.map((r, i) => `${i + 1}. ${r.market} · net ${fmt(r.net)} · open interest ${fmt(r.oi)}`),
    "",
    `Most net-short non-commercial positioning`,
    ...bottom.map((r, i) => `${i + 1}. ${r.market} · net ${fmt(r.net)} · open interest ${fmt(r.oi)}`),
  ].join("\n")
}

export async function openInterestLeaders(a: { limit: number }): Promise<string> {
  const date = await latestReportDate()
  const rows = await rowsForDate(date)
  const ranked = rows
    .map((r) => ({ market: clean(r.market_and_exchange_names), oi: num(r.open_interest_all) }))
    .filter((r) => r.oi > 0 && r.market)
    .sort((x, y) => y.oi - x.oi)
    .slice(0, a.limit)
  if (!ranked.length) throw new SourceError("CFTC returned no usable rows")
  return [`Largest open interest · report ${date.slice(0, 10)}`, ...ranked.map((r, i) => `${i + 1}. ${r.market} · ${fmt(r.oi)} contracts`)].join("\n")
}

export async function cotAverages(a: { market: string; weeks: number }): Promise<string> {
  const rows = await fetchRows(a.market, a.weeks)
  if (!rows.length) return `CFTC has no market matching "${a.market}".`
  const avg = (pick: (r: Cot) => number) => rows.reduce((n, r) => n + pick(r), 0) / rows.length
  const longAvg = avg((r) => num(r.noncomm_positions_long_all))
  const shortAvg = avg((r) => num(r.noncomm_positions_short_all))
  const oiAvg = avg((r) => num(r.open_interest_all))
  return [
    `Average positioning over ${rows.length} week(s) for "${a.market}"`,
    `Non-commercial long: ${fmt(Math.round(longAvg))}`,
    `Non-commercial short: ${fmt(Math.round(shortAvg))}`,
    `Net non-commercial: ${fmt(Math.round(longAvg - shortAvg))}`,
    `Open interest: ${fmt(Math.round(oiAvg))}`,
    `Window: ${String(rows[rows.length - 1].report_date_as_yyyy_mm_dd).slice(0, 10)} to ${String(rows[0].report_date_as_yyyy_mm_dd).slice(0, 10)}`,
  ].join("\n")
}
