export class PolygonError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PolygonError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.POLYGON_API_KEY;
  if (!k) throw new PolygonError("Set POLYGON_API_KEY (free Polygon plan).");
  return k;
}

async function get(path: string): Promise<string> {
  const sep = path.includes("?") ? "&" : "?";
  let res: Response;
  try {
    res = await fetch(`https://api.polygon.io${path}${sep}apikey=${encodeURIComponent(key())}`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new PolygonError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new PolygonError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listTickers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/v3/reference/tickers?limit=${n}`);
}

export function getTicker(ticker: string): Promise<string> {
  return get(`/v3/reference/tickers/${encodeURIComponent(ticker.toUpperCase())}`);
}

export function prevClose(ticker: string): Promise<string> {
  return get(`/v2/aggs/ticker/${encodeURIComponent(ticker.toUpperCase())}/prev`);
}



export function aggregates(ticker: string, from: string, to: string): Promise<string> {
  return get(`/v2/aggs/ticker/${encodeURIComponent(ticker.toUpperCase())}/range/1/day/${encodeURIComponent(from)}/${encodeURIComponent(to)}?limit=30`);
}

export function groupedDaily(date: string): Promise<string> {
  return get(`/v2/aggs/grouped/locale/us/market/stocks/${encodeURIComponent(date)}`).then((t) => t.slice(0, 6000));
}

export function openClose(ticker: string, date: string): Promise<string> {
  return get(`/v1/open-close/${encodeURIComponent(ticker.toUpperCase())}/${encodeURIComponent(date)}`);
}

export function rsi(ticker: string): Promise<string> {
  return get(`/v1/indicators/rsi/${encodeURIComponent(ticker.toUpperCase())}?timespan=day&window=14&limit=5`);
}

export function macd(ticker: string): Promise<string> {
  return get(`/v1/indicators/macd/${encodeURIComponent(ticker.toUpperCase())}?limit=5`);
}

export function dividends(ticker?: string): Promise<string> {
  const q = ticker ? `?ticker=${encodeURIComponent(ticker.toUpperCase())}&limit=10` : "?limit=10";
  return get(`/v3/reference/dividends${q}`);
}

export function splits(ticker?: string): Promise<string> {
  const q = ticker ? `?ticker=${encodeURIComponent(ticker.toUpperCase())}&limit=10` : "?limit=10";
  return get(`/v3/reference/splits${q}`);
}

export function news(ticker: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 5) || 5, 20);
  return get(`/v2/reference/news?ticker=${encodeURIComponent(ticker.toUpperCase())}&limit=${n}`);
}

export function gainers(): Promise<string> {
  return get("/v2/snapshot/locale/us/markets/stocks/gainers").then((t) => t.slice(0, 6000));
}

// ---- muxH tools:
// The tools above read prices and indicators from Polygon. These two read what
// a company actually filed with the SEC, which is public and needs no key: the
// filing history behind a ticker, and the revenue a company has reported.

// The SEC rejects a User-Agent containing a semicolon with HTTP 403, so this is
// deliberately the plain "name contact" form their fair-access policy asks for.
const SEC_UA = "polygon-mcp/1.2 mcfentmen@gmail.com"
const SEC_TICKERS = "https://www.sec.gov/files/company_tickers.json"
const SEC_DATA = "https://data.sec.gov"

interface SecTickerRow {
  cik_str?: number
  ticker?: string
  title?: string
}

interface SecSubmissions {
  cik?: number
  name?: string
  sic?: string
  sicDescription?: string
  tickers?: string[]
  exchanges?: string[]
  stateOfIncorporation?: string
  fiscalYearEnd?: string
  ein?: string
  category?: string
  filings?: {
    recent?: {
      accessionNumber?: string[]
      filingDate?: string[]
      reportDate?: string[]
      form?: string[]
      primaryDocument?: string[]
      items?: string[]
    }
  }
}

interface SecFactUnit {
  start?: string
  end?: string
  val?: number
  form?: string
  fy?: number
  fp?: string
  filed?: string
  frame?: string
}

interface SecConcept {
  cik?: number
  entityName?: string
  label?: string
  description?: string
  units?: Record<string, SecFactUnit[]>
}

let tickerMapCache: Map<string, SecTickerRow> | null = null

async function secFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": SEC_UA }, signal: AbortSignal.timeout(25000) })
  if (res.status === 404) throw new PolygonError("The SEC has no record at that address.")
  if (res.status === 429) throw new PolygonError("The SEC rate-limited this host. Try again in a moment.")
  if (!res.ok) throw new PolygonError(`SEC error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

async function secTickers(): Promise<Map<string, SecTickerRow>> {
  if (!tickerMapCache) {
    const body = await secFetch<Record<string, SecTickerRow>>(SEC_TICKERS)
    tickerMapCache = new Map(Object.values(body).map((row) => [(row.ticker ?? "").toUpperCase(), row]))
  }
  return tickerMapCache
}

const cikPadded = (cik: number): string => `CIK${String(cik).padStart(10, "0")}`

/**
 * What a company has filed with the SEC: the recent filing history behind a
 * ticker, its SIC classification, its state of incorporation and its fiscal
 * year end. This is the disclosure record a price feed never carries.
 */
export async function secFilings(args: { ticker: string; limit?: number; forms?: string }): Promise<string> {
  const ticker = (args.ticker ?? "").trim().toUpperCase()
  if (!ticker) throw new PolygonError("Give a US ticker, e.g. AAPL.")
  const map = await secTickers()
  const row = map.get(ticker)
  if (!row?.cik_str) {
    throw new PolygonError(`"${ticker}" is not in the SEC ticker-to-CIK file. It may be listed on a non-US exchange or may be a fund.`)
  }
  const size = Math.min(Math.max(Math.trunc(args.limit ?? 15), 1), 40)
  const wanted = (args.forms ?? "")
    .split(",")
    .map((f) => f.trim().toUpperCase())
    .filter(Boolean)

  const sub = await secFetch<SecSubmissions>(`${SEC_DATA}/submissions/${cikPadded(row.cik_str)}.json`)
  const recent = sub.filings?.recent ?? {}
  const forms = recent.form ?? []
  const dates = recent.filingDate ?? []
  const accessions = recent.accessionNumber ?? []
  const documents = recent.primaryDocument ?? []
  const items = recent.items ?? []

  const rows: string[] = []
  for (let i = 0; i < forms.length; i += 1) {
    if (wanted.length && !wanted.includes(String(forms[i]).toUpperCase())) continue
    const accession = String(accessions[i] ?? "")
    const bare = accession.replace(/-/g, "")
    const doc = String(documents[i] ?? "")
    rows.push(
      [
        `${String(forms[i]).padEnd(10)} filed ${String(dates[i] ?? "unknown").padEnd(12)}`,
        `    ${String(sub.name ?? row.title ?? "unknown")}`,
        `    https://www.sec.gov/Archives/edgar/data/${row.cik_str}/${bare}/${doc}`,
        items[i] ? `    items: ${String(items[i])}` : "",
      ].join("\n")
    )
    if (rows.length >= size) break
  }
  if (!rows.length) {
    throw new PolygonError(`No filing in the recent history of ${ticker} matches form ${wanted.join(", ") || "(none)"}.`)
  }

  return [
    `SEC filings for ${ticker} — ${String(sub.name ?? row.title)}`,
    `  CIK ${cikPadded(row.cik_str)} | SIC ${String(sub.sic ?? "not reported")} ${String(sub.sicDescription ?? "")}`.trimEnd(),
    `  incorporated in ${sub.stateOfIncorporation ?? "not reported"} | fiscal year ends ${sub.fiscalYearEnd ?? "not reported"}`,
    `  exchanges: ${(sub.exchanges ?? []).join(", ") || "not reported"} | other tickers: ${(sub.tickers ?? []).filter((t) => t !== ticker).join(", ") || "none"}`,
    `  ${forms.length} filings in the recent index, showing ${rows.length}${wanted.length ? ` matching ${wanted.join(", ")}` : ""}`,
    "",
    ...rows,
    "",
    "Source: SEC EDGAR submissions API, a public dataset.",
  ].join("\n")
}

/**
 * A company's reported annual revenue, taken from the XBRL facts the SEC
 * requires it to tag in its own filings rather than from an estimate.
 */
export async function secRevenue(args: { ticker: string; years?: number }): Promise<string> {
  const ticker = (args.ticker ?? "").trim().toUpperCase()
  if (!ticker) throw new PolygonError("Give a US ticker, e.g. MSFT.")
  const span = Math.min(Math.max(Math.trunc(args.years ?? 6), 2), 20)
  const map = await secTickers()
  const row = map.get(ticker)
  if (!row?.cik_str) throw new PolygonError(`"${ticker}" is not in the SEC ticker-to-CIK file.`)

  // Revenues was renamed RevenueFromContractWithCustomerExcludingAssessedTax
  // under the 2018 taxonomy, so both tags have to be tried.
  const tags = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax"]
  let concept: SecConcept | null = null
  let usedTag = ""
  const misses: string[] = []
  for (const tag of tags) {
    try {
      concept = await secFetch<SecConcept>(`${SEC_DATA}/api/xbrl/companyconcept/${cikPadded(row.cik_str)}/us-gaap/${tag}.json`)
      usedTag = tag
      break
    } catch (e) {
      misses.push(`${tag}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  if (!concept) {
    throw new PolygonError(`None of the revenue tags are filed for ${ticker}. Tried ${misses.join(" | ")}`)
  }

  const facts = concept.units?.USD ?? []
  // Keep only annual durations: a fiscal year tag, or a ~365 day span.
  const annual = facts.filter((f) => {
    if (f.form !== "10-K" && f.form !== "10-K/A") return false
    if (!f.start || !f.end) return false
    const days = (Date.parse(f.end) - Date.parse(f.start)) / 86400000
    return days > 300 && days < 400
  })
  const byYear = new Map<string, number>()
  for (const fact of annual) {
    const year = fact.fy ? String(fact.fy) : String(fact.end).slice(0, 4)
    if (!byYear.has(year)) byYear.set(year, fact.val as number)
  }
  const rows = [...byYear.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, span)
  if (!rows.length) {
    throw new PolygonError(`${ticker} files no annual ${usedTag} figure with a 300-400 day period.`)
  }

  const newest = rows[0]
  const previous = rows[1]
  const growth = previous && previous[1] > 0 ? ((newest[1] - previous[1]) / previous[1]) * 100 : null
  const billions = (v: number) => `$${(v / 1e9).toLocaleString(undefined, { maximumFractionDigits: 2 })}B`

  return [
    `Reported annual revenue for ${ticker} — ${String(concept.entityName ?? row.title)}`,
    `  XBRL tag: ${usedTag}${usedTag !== "RevenueFromContractWithCustomerExcludingAssessedTax" ? " (the tag this filer actually uses)" : ""}`,
    `  ${rows.length} fiscal year(s) from 10-K filings`,
    "",
    ...rows.map(([year, value]) => `  FY${year}  ${billions(value).padStart(10)}  (${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD)`),
    "",
    growth === null
      ? "Only one year is in range, so no growth rate can be computed."
      : `Year on year, FY${newest[0]} is ${growth >= 0 ? "up" : "down"} ${Math.abs(growth).toFixed(1)}% against FY${previous![0]}.`,
    "Source: SEC XBRL company-concept API. These are the numbers as tagged in the filings, not a normalised series.",
  ].join("\n")
}
