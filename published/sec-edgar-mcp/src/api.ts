/**
 * SEC EDGAR — keyless public API client.
 */
const BASE = "https://data.sec.gov"
const SOURCE = "SEC EDGAR"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "awesome-servers-mcp", accept },
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

let tickerCache: { at: number; rows: any[] } | undefined

function cik10(value: string | number): string {
  const digits = clean(String(value)).replace(/^CIK/i, "").replace(/\D/g, "")
  if (!digits) throw new SourceError("cik must contain digits, e.g. 320193")
  if (digits.length > 10) throw new SourceError("cik must be at most 10 digits")
  return digits.padStart(10, "0")
}

function cikNumber(value: string): number {
  return Number(value.replace(/^0+/, "") || "0")
}

function filingUrl(cik: string, accession: string, document: string): string {
  const accn = clean(accession).replace(/-/g, "")
  return `https://www.sec.gov/Archives/edgar/data/${cikNumber(cik)}/${accn}/${document}`
}

export async function companyProfile(a: { cik: string }): Promise<string> {
  const cik = cik10(a.cik)
  const d = await getJson(`/submissions/CIK${cik}.json`)
  if (!d || !d.name) return `EDGAR has no company with CIK ${cik}.`
  const recent = d.filings?.recent ?? {}
  const forms: string[] = Array.isArray(recent.form) ? recent.form : []
  const dates: string[] = Array.isArray(recent.filingDate) ? recent.filingDate : []
  const accessions: string[] = Array.isArray(recent.accessionNumber) ? recent.accessionNumber : []
  const documents: string[] = Array.isArray(recent.primaryDocument) ? recent.primaryDocument : []
  const rows = forms.slice(0, 8).map((form, i) => `- ${form} filed ${dates[i] ?? "?"}: ${filingUrl(cik, accessions[i] ?? "", documents[i] ?? "")}`)
  return [
    `${clean(d.name)} (CIK ${cik})`,
    `SIC ${clean(d.sic)} - ${clean(d.sicDescription) || "industry unknown"} · state of incorporation ${clean(d.stateOfIncorporation) || "?"} · fiscal year ends ${clean(d.fiscalYearEnd) || "?"}`,
    Array.isArray(d.tickers) && d.tickers.length ? `Tickers: ${d.tickers.join(", ")}${Array.isArray(d.exchanges) && d.exchanges.length ? ` on ${d.exchanges.join(", ")}` : ""}` : "",
    d.formerNames?.length ? `Former names: ${d.formerNames.slice(0, 3).map((f: any) => clean(f.name)).join(", ")}` : "",
    d.filings?.files?.length ? `Filing archive files: ${d.filings.files.length}` : "",
    "",
    `Most recent filings (${forms.length} in the current feed):`,
    ...rows,
    "",
    `All filings: https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=&dateb=&owner=include&count=40`,
  ].filter(Boolean).join("\n")
}

export async function companyConcept(a: { cik: string; tag: string; limit?: number }): Promise<string> {
  const cik = cik10(a.cik)
  const tag = clean(a.tag)
  if (!/^[A-Za-z][A-Za-z0-9]{1,60}$/.test(tag)) throw new SourceError("tag must be an XBRL tag such as Revenues or Assets")
  const limit = a.limit ?? 10
  if (!Number.isInteger(limit) || limit < 1 || limit > 30) throw new SourceError("limit must be between 1 and 30")
  const d = await getJson(`/api/xbrl/companyconcept/CIK${cik}/us-gaap/${encodeURIComponent(tag)}.json`)
  if (!d || !d.units) return `EDGAR has no us-gaap ${tag} facts for CIK ${cik}. Try a tag like Revenues, Assets or NetIncomeLoss.`
  const blocks: string[] = []
  for (const [unit, values] of Object.entries(d.units as Record<string, any[]>)) {
    const rows = [...values].filter((v) => v && v.end).sort((x, y) => String(y.end).localeCompare(String(x.end))).slice(0, limit)
    blocks.push(`Unit ${unit}:`)
    for (const v of rows) {
      blocks.push(`  - ${clean(v.end)}: ${Number(v.val).toLocaleString("en-US")} (${clean(v.form)}${v.fy ? ` FY${v.fy}${v.fp ? ` ${clean(v.fp)}` : ""}` : ""}${v.frame ? ` · ${clean(v.frame)}` : ""})`)
    }
  }
  return [
    `${clean(d.entityName) || `CIK ${cik}`} - us-gaap ${clean(d.tag)} (${clean(d.label) || tag})`,
    d.description ? `${clean(d.description).slice(0, 300)}` : "",
    "",
    ...blocks,
    "",
    `Frames view: https://www.sec.gov/cgi-bin/viewer?action=view&cik=${cikNumber(cik)}`,
  ].filter(Boolean).join("\n")
}

export async function fullTextSearch(a: { query: string; forms?: string; limit?: number }): Promise<string> {
  const query = clean(a.query)
  if (query.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = a.limit ?? 5
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new SourceError("limit must be between 1 and 20")
  const forms = a.forms ? clean(a.forms) : ""
  if (forms && !/^[A-Za-z0-9,\-]{1,20}$/.test(forms)) throw new SourceError("forms must look like 10-K or 8-K")
  const d = await getJson(`https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(query)}${forms ? `&forms=${encodeURIComponent(forms)}` : ""}`)
  const hits: any[] = d?.hits?.hits ?? []
  if (!hits.length) return `EDGAR full-text search found nothing for "${query}"${forms ? ` in ${forms}` : ""}.`
  return [
    `${d?.hits?.total?.value ?? hits.length} filing(s) mention "${query}"${forms ? ` in ${forms}` : ""}, showing ${hits.length}:`,
    "",
    ...hits.slice(0, limit).map((h) => {
      const s = h._source ?? {}
      const names: string[] = Array.isArray(s.display_names) ? s.display_names : []
      const id = clean(h._id)
      const [accession, document] = id.split(":")
      const cik = Array.isArray(s.ciks) && s.ciks[0] ? String(s.ciks[0]) : ""
      return [
        `- ${names[0] ?? "unknown filer"} · ${clean(s.form_type) || clean(h._source?.root_forms?.[0]) || "form"} filed ${clean(s.file_date) || "?"}`,
        `  ${accession ? filingUrl(cik, accession, document || "") : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}`}`,
      ].join("\n")
    }),
  ].join("\n")
}

export async function tickerLookup(a: { ticker: string }): Promise<string> {
  const ticker = clean(a.ticker).toUpperCase()
  if (!/^[A-Z.\-]{1,8}$/.test(ticker)) throw new SourceError("ticker must be letters, dots or dashes, e.g. AAPL")
  if (!tickerCache || Date.now() - tickerCache.at > 86400_000) {
    const d = await getJson(`https://www.sec.gov/files/company_tickers.json`)
    const rows = Object.values(d ?? {}).filter((r: any) => r && r.ticker) as any[]
    if (!rows.length) throw new SourceError("SEC returned no ticker list")
    tickerCache = { at: Date.now(), rows }
  }
  const match = tickerCache.rows.find((r) => clean(r.ticker).toUpperCase() === ticker)
  if (!match) return `EDGAR lists no company with ticker ${ticker}.`
  const cik = cik10(String(match.cik_str))
  return [
    `${clean(match.title)} - ticker ${clean(match.ticker)}`,
    `CIK ${cik}`,
    "",
    `Use company_profile with cik ${cik} for filings and tickers.`,
    `EDGAR page: https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=&dateb=&owner=include&count=40`,
  ].join("\n")
}
