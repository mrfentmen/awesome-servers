/**
 * ProPublica Nonprofit Explorer client, keyless.
 * IRS Form 990 data for every US registered nonprofit.
 */

export class NonprofitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NonprofitError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = "mrfentmen-nonprofit-mcp/1.0"
const BASE = "https://projects.propublica.org/nonprofits/api/v2"

export interface OrgSummary {
  ein: number
  strein?: string
  name: string
  sub_name?: string
  city?: string
  state?: string
  ntee_code?: string
  subseccd?: number
  score?: number
}

export interface Filing {
  formtype?: number
  pdf_url?: string
  updated?: string
  tax_prd_yr?: number
  totrevenue?: number
  totfuncexpns?: number
  totassetsend?: number
  totliabend?: number
  pdf_url_alt?: string
}

export interface OrgDetails {
  organization: {
    ein: number
    name: string
    sub_name?: string
    address?: string
    city?: string
    state?: string
    zipcode?: string
    ntee_code?: string
    subseccd?: number
    ruling_date?: string
    have_filings?: boolean
  }
  filings_with_data?: Filing[]
  filings_without_data?: Filing[]
}

export interface SearchResult {
  total_results: number
  organizations: OrgSummary[]
}

async function get(path: string): Promise<string> {
  let res: Response
  try {
    res = await fetch(BASE + path, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    throw new NonprofitError(`Could not reach ProPublica: ${errorMessage(e)}`)
  }
  if (res.status === 404) throw new NonprofitError("No nonprofit found for that EIN.")
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200)
    throw new NonprofitError(`ProPublica returned HTTP ${res.status}: ${body}`)
  }
  return res.text()
}

async function getJson<T>(path: string): Promise<T> {
  const raw = await get(path)
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new NonprofitError("ProPublica returned a non-JSON response.")
  }
}

function page(pageNo?: number): string {
  const p = Math.min(Math.max(Math.round(pageNo ?? 0) || 0, 0), 99)
  return p > 0 ? `&page=${p}` : ""
}

export async function search(query: string, pageNo?: number): Promise<SearchResult> {
  const q = query.trim()
  if (q.length < 2) throw new NonprofitError("Search needs at least two characters.")
  return getJson<SearchResult>(`/search.json?q=${encodeURIComponent(q)}${page(pageNo)}`)
}

export async function searchByState(state: string, pageNo?: number): Promise<SearchResult> {
  const s = state.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(s)) throw new NonprofitError(`"${state}" is not a two-letter state code.`)
  return getJson<SearchResult>(`/search.json?state%5Bid%5D=${s}${page(pageNo)}`)
}

/** ProPublica filters nonprofits by the numeric NTEE major group: A=1, B=2, ... Z=26. */
export function majorGroupNumber(ntee: string): number {
  const code = ntee.trim().toUpperCase()
  let n: number
  if (/^\d{1,2}$/.test(code)) {
    n = Number(code)
  } else if (/^[A-Z]$/.test(code)) {
    n = code.charCodeAt(0) - 64
  } else if (/^[A-Z][0-9]{2}$/.test(code)) {
    n = code.charCodeAt(0) - 64
  } else {
    throw new NonprofitError(
      `"${ntee}" is not an NTEE category. Use a letter (A-Z) or the numeric major group 1-26.`
    )
  }
  if (n < 1 || n > 26) throw new NonprofitError(`NTEE major group must be 1-26, got ${n}.`)
  return n
}

export async function searchByCategory(ntee: string, state?: string, pageNo?: number): Promise<SearchResult> {
  const code = String(majorGroupNumber(ntee))
  let path = `/search.json?ntee%5Bid%5D=${encodeURIComponent(code)}`
  if (state && state.trim()) {
    const s = state.trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(s)) throw new NonprofitError(`"${state}" is not a two-letter state code.`)
    path += `&state%5Bid%5D=${s}`
  }
  return getJson<SearchResult>(`${path}${page(pageNo)}`)
}

export async function details(ein: string): Promise<OrgDetails> {
  return getJson<OrgDetails>(`/organizations/${cleanEin(ein)}.json`)
}

export function cleanEin(ein: string): string {
  const clean = ein.replace(/[-\s]/g, "")
  if (!/^\d{9}$/.test(clean)) {
    throw new NonprofitError(`"${ein}" is not a 9-digit EIN - search first to find it.`)
  }
  return clean
}

function money(n: number | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "n/a"
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

export function formatSearch(result: SearchResult, title: string): string {
  const orgs = result.organizations ?? []
  if (orgs.length === 0) return `No nonprofits match ${title}.`
  const lines = orgs.map((o) => {
    const where = [o.city, o.state].filter(Boolean).join(", ")
    return `  ${String(o.strein ?? o.ein).padStart(11)}  ${o.name}${o.sub_name ? ` (${o.sub_name})` : ""}\n               ${where}${o.ntee_code ? ` · NTEE ${o.ntee_code}` : ""}`
  })
  return [
    `${title} - ${result.total_results} match(es), showing ${orgs.length}:`,
    "",
    lines.join("\n"),
    "",
    "Use details with an EIN to see finances and filings.",
  ].join("\n")
}

export function formatDetails(d: OrgDetails): string {
  const o = d.organization
  const filings = [...(d.filings_with_data ?? []), ...(d.filings_without_data ?? [])]
  const withData = (d.filings_with_data ?? []).filter((f) => typeof f.totrevenue === "number")
  const latest = withData.sort((a, b) => (b.tax_prd_yr ?? 0) - (a.tax_prd_yr ?? 0))[0]
  const lines = [
    `${o.name}${o.sub_name ? ` (${o.sub_name})` : ""}`,
    `  EIN            ${o.ein}`,
    `  address        ${[o.address, o.city, o.state, o.zipcode].filter(Boolean).join(", ") || "n/a"}`,
    `  NTEE code      ${o.ntee_code ?? "n/a"}`,
    `  ruling date    ${o.ruling_date ?? "n/a"}`,
    `  filings        ${filings.length} on record`,
  ]
  if (latest) {
    lines.push(
      "",
      `Latest financials (FY ${latest.tax_prd_yr ?? "?"}):`,
      `  revenue        ${money(latest.totrevenue)}`,
      `  expenses       ${money(latest.totfuncexpns)}`,
      `  net            ${money((latest.totrevenue ?? 0) - (latest.totfuncexpns ?? 0))}`,
      `  assets         ${money(latest.totassetsend)}`,
      `  liabilities    ${money(latest.totliabend)}`
    )
  }
  const pdf = filings.find((f) => f.pdf_url)?.pdf_url
  if (pdf) lines.push("", `Latest filing PDF: ${pdf}`)
  return lines.join("\n")
}

export function financialSummary(d: OrgDetails): string {
  const o = d.organization
  const rows = (d.filings_with_data ?? [])
    .filter((f) => typeof f.totrevenue === "number" && (f.tax_prd_yr ?? 0) > 0)
    .sort((a, b) => (b.tax_prd_yr ?? 0) - (a.tax_prd_yr ?? 0))
    .slice(0, 8)
  if (rows.length === 0) {
    return `${o.name} has no financial data filed electronically.`
  }
  const lines = rows.map((f) => {
    const net = (f.totrevenue ?? 0) - (f.totfuncexpns ?? 0)
    return `  ${String(f.tax_prd_yr).padEnd(6)} revenue ${money(f.totrevenue).padStart(11)}  expenses ${money(f.totfuncexpns).padStart(11)}  net ${money(net).padStart(11)}`
  })
  const newest = rows[0]
  const oldest = rows[rows.length - 1]
  const growth =
    typeof oldest.totrevenue === "number" && oldest.totrevenue !== 0 && typeof newest.totrevenue === "number"
      ? ((newest.totrevenue - oldest.totrevenue) / Math.abs(oldest.totrevenue)) * 100
      : undefined
  const tail = growth === undefined
    ? ""
    : `\n\nRevenue change from FY ${oldest.tax_prd_yr} to FY ${newest.tax_prd_yr}: ${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%.`
  return `${o.name} (EIN ${o.ein}) - revenue and expenses by year:\n\n${lines.join("\n")}${tail}`
}

export async function compare(eins: string[]): Promise<string> {
  const list = eins.map((e) => e.trim()).filter(Boolean).slice(0, 5)
  if (list.length === 0) throw new NonprofitError("Give at least one EIN.")
  const profiles = await Promise.all(list.map((e) => details(e)))
  return `Compared ${profiles.length} nonprofits:\n\n${profiles.map((d) => formatDetails(d)).join("\n\n")}`
}
