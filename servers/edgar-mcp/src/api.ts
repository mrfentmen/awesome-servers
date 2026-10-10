const UA = "mrfentmen edgar mcp research contact@example.com"
export class EdgarError extends Error {}

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new EdgarError(`SEC EDGAR error ${res.status}`)
  return (await res.json()) as T
}

async function resolveCik(ticker: string): Promise<string> {
  const t = ticker.trim().toUpperCase()
  if (/^\d+$/.test(t)) return t.padStart(10, "0")
  const map = await request<Record<string, { cik_str: number; ticker: string; title: string }>>(
    "https://www.sec.gov/files/company_tickers.json"
  )
  for (const row of Object.values(map)) {
    if ((row.ticker ?? "").toUpperCase() === t) return String(row.cik_str).padStart(10, "0")
  }
  throw new EdgarError(`Ticker ${t} not found in SEC company list`)
}

function cikUrl(cik: string): string {
  return `https://data.sec.gov/submissions/CIK${cik}.json`
}

export async function companyFilings(args: { ticker?: string }): Promise<string> {
  const cik = await resolveCik(args.ticker ?? "")
  const d = await request<any>(cikUrl(cik))
  const r = d.filings?.recent
  const rows = (r?.form ?? []).map((form: string, i: number) => {
    const date = r.filingDate?.[i] ?? ""
    const acc = r.accessionNumber?.[i] ?? ""
    const doc = r.primaryDocument?.[i] ?? ""
    return `${form} ${date} | ${acc} | ${doc}`
  })
  return `${d.name ?? cik} (CIK ${cik})\n${rows.slice(0, 20).join("\n")}`
}

export async function companyFacts(args: { ticker?: string }): Promise<string> {
  const cik = await resolveCik(args.ticker ?? "")
  const d = await request<any>(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`)
  const facts = d.facts?.usGaap ?? {}
  const pick = ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "NetIncomeLoss", "Assets", "Liabilities", "StockholdersEquity", "EarningsPerShareBasic"]
  const out: string[] = []
  for (const key of pick) {
    const f = facts[key]
    if (!f) continue
    const units = Object.values(f.units ?? {}) as any[][]
    const latest = units.flat().slice(-1)[0]
    if (latest) out.push(`${key}: ${latest.val ?? "n/a"} (${latest.end ?? ""})`)
  }
  return `${d.entityName ?? cik}\n${out.join("\n") || "No common XBRL facts found"}`
}

export async function searchFilings(args: { query?: string; limit?: number }): Promise<string> {
  const q = encodeURIComponent(args.query ?? "")
  const end = new Date().toISOString().slice(0, 10)
  const start = new Date(Date.now() - 365 * 2 * 86400000).toISOString().slice(0, 10)
  const d = await request<any>(`https://efts.sec.gov/LATEST/search-index?q=${q}&dateRange=custom&startdt=${start}&enddt=${end}`)
  const hits = d.hits?.hits ?? []
  const limit = Math.min(args.limit ?? 10, 25)
  return hits.slice(0, limit).map((h: any) => {
    const s = h._source ?? {}
    return `${s.file_date ?? ""} ${s.form_type ?? ""} | ${s.display_names?.[0] ?? s.entity_name ?? ""}\n  ${(s.description ?? "").slice(0, 200)}`
  }).join("\n\n") || "No filings found"
}

// ---- muxF tools:
const DATA = "https://data.sec.gov"

interface Submissions {
  cik?: string
  name?: string
  entityType?: string
  sic?: string
  sicDescription?: string
  ownerOrg?: string
  category?: string
  fiscalYearEnd?: string
  stateOfIncorporation?: string
  stateOfIncorporationDescription?: string
  phone?: string
  ein?: string
  website?: string
  investorWebsite?: string
  flags?: string
  tickers?: string[]
  exchanges?: string[]
  formerNames?: Array<{ name?: string; from?: string; to?: string }>
  addresses?: {
    business?: { street1?: string; street2?: string; city?: string; stateOrCountry?: string; zipCode?: string }
    mailing?: { street1?: string; street2?: string; city?: string; stateOrCountry?: string; zipCode?: string }
  }
  filings?: {
    recent?: Record<string, Array<string | number | null>>
    files?: Array<{ name?: string; filingCount?: number; filingFrom?: string; filingTo?: string }>
  }
}

interface FilingRow {
  form: string
  date: string
  accession: string
  size: number
  xbrl: boolean
  items: string
}

function bound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

function orNumber(value: unknown): string {
  const n = Number(value)
  return Number.isFinite(n) ? n.toLocaleString() : 'not reported'
}

function rowsFrom(block: Record<string, Array<string | number | null>> | undefined): FilingRow[] {
  if (!block || !Array.isArray(block.form)) return []
  const out: FilingRow[] = []
  const n = block.form.length
  for (let i = 0; i < n; i += 1) {
    out.push({
      form: String(block.form[i] ?? ''),
      date: String(block.filingDate?.[i] ?? ''),
      accession: String(block.accessionNumber?.[i] ?? ''),
      size: Number(block.size?.[i]) || 0,
      xbrl: Number(block.isXBRL?.[i]) === 1,
      items: String(block.items?.[i] ?? ''),
    })
  }
  return out
}

/** The whole filing history as a census: which forms, how many of each, how they spread over the years and how much XBRL there is. */
export async function filingCensus(args: { ticker?: string; year?: number }): Promise<string> {
  const cik = await resolveCik(args.ticker ?? '')
  const d = await request<Submissions>(`${DATA}/submissions/CIK${cik}.json`)
  const recent = rowsFrom(d.filings?.recent)
  const older: FilingRow[] = []
  for (const shard of (d.filings?.files ?? []).slice(0, 3)) {
    if (!shard.name) continue
    const block = await request<Record<string, Array<string | number | null>>>(`${DATA}/submissions/${shard.name}`).catch(() => null)
    older.push(...rowsFrom(block ?? undefined))
  }
  const all = [...recent, ...older]
  if (!all.length) throw new EdgarError(`SEC holds no filing rows for CIK ${cik}.`)
  const year = bound(args.year, 1990, 2100, 0)
  const scoped = year ? all.filter((r) => Number(r.date.slice(0, 4)) === year) : all
  const byForm = new Map<string, number>()
  const byYear = new Map<number, number>()
  let xbrl = 0
  let bytes = 0
  for (const r of scoped) {
    byForm.set(r.form || 'form not reported', (byForm.get(r.form || 'form not reported') ?? 0) + 1)
    const y = Number(r.date.slice(0, 4))
    if (Number.isFinite(y)) byYear.set(y, (byYear.get(y) ?? 0) + 1)
    if (r.xbrl) xbrl += 1
    bytes += r.size
  }
  const dates = all.map((r) => r.date).filter(Boolean).sort()
  const topForms = [...byForm.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  return [
    `Filing census for ${d.name ?? 'name not reported'} (CIK ${d.cik ?? cik})`,
    `Rows walked: ${all.length} (${recent.length} from the recent block, ${older.length} from up to three older shards)`,
    year ? `Scoped to ${year}: ${scoped.length} filing(s)` : `Scoped to everything: ${scoped.length} filing(s)`,
    `Earliest filing in the walked rows: ${dates[0] ?? 'not reported'}`,
    `Most recent filing in the walked rows: ${dates[dates.length - 1] ?? 'not reported'}`,
    `Filings carrying XBRL: ${xbrl} of ${scoped.length} (${scoped.length ? ((xbrl / scoped.length) * 100).toFixed(1) : '0.0'}%)`,
    `Total primary document bytes: ${orNumber(bytes)} (${(bytes / (1024 * 1024)).toFixed(1)} MiB)`,
    `Leading forms: ${topForms.length ? topForms.map(([k, n]) => `${k} ${n}`).join(', ') : 'not reported'}`,
    `Distinct forms filed: ${byForm.size}`,
    `Filings per year: ${[...byYear.entries()].sort((a, b) => a[0] - b[0]).map(([y, n]) => `${y} ${n}`).join(', ')}`,
    'The SEC caps how far back the recent block goes, so older shards are fetched explicitly and the walked row count is stated above rather than assumed.',
  ].join('\n')
}

interface FramePoint {
  accn?: string
  cik?: number
  entityName?: string
  loc?: string
  end?: string
  val?: number
}

/** The cadence of one form type: when it was filed and what the reporting gaps between filings look like. */
export async function formCadence(args: { ticker?: string; form?: string; limit?: number }): Promise<string> {
  const cik = await resolveCik(args.ticker ?? '')
  const form = (args.form ?? '8-K').trim().toUpperCase()
  if (!/^[A-Z0-9\-/]+$/.test(form)) throw new EdgarError(`Not a form type: "${args.form ?? form}"`)
  const limit = bound(args.limit, 1, 30, 12)
  const d = await request<Submissions>(`${DATA}/submissions/CIK${cik}.json`)
  const rows = rowsFrom(d.filings?.recent).filter((r) => r.form.toUpperCase() === form)
  if (!rows.length) {
    const known = [...new Set(rowsFrom(d.filings?.recent).map((r) => r.form))].sort().slice(0, 20)
    return `${d.name ?? 'the registrant'} has no ${form} in its recent filings block. Form types present there include: ${known.join(', ')}.`
  }
  const dates = rows.map((r) => Date.parse(`${r.date}T00:00:00Z`)).filter((n) => Number.isFinite(n)).sort((a, b) => b - a)
  const gaps: number[] = []
  for (let i = 0; i < dates.length - 1; i += 1) gaps.push((dates[i] - dates[i + 1]) / 86400000)
  const sortedGaps = [...gaps].sort((a, b) => a - b)
  const medianGap = sortedGaps.length ? sortedGaps[Math.floor(sortedGaps.length / 2)] : null
  const itemCodes = new Map<string, number>()
  for (const r of rows) {
    for (const code of r.items.split(',').map((c) => c.trim()).filter(Boolean)) itemCodes.set(code, (itemCodes.get(code) ?? 0) + 1)
  }
  return [
    `${form} filing cadence for ${d.name ?? 'the registrant'} (CIK ${d.cik ?? cik})`,
    `Filings of this form in the recent block: ${rows.length}`,
    `First in the block: ${rows[rows.length - 1]?.date ?? 'not reported'}`,
    `Most recent: ${rows[0]?.date ?? 'not reported'}`,
    `Median gap between filings: ${medianGap === null ? 'not reported' : `${medianGap.toFixed(0)} days`}`,
    `Shortest gap: ${gaps.length ? `${Math.min(...gaps).toFixed(0)} days` : 'not reported'} | longest: ${gaps.length ? `${Math.max(...gaps).toFixed(0)} days` : 'not reported'}`,
    `Item codes reported across these filings (${itemCodes.size}): ${itemCodes.size ? [...itemCodes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => `${k} (${n})`).join(', ') : 'none recorded'}`,
    `Most recent ${Math.min(limit, rows.length)}:`,
    ...rows.slice(0, limit).map((r) => `- ${r.date} | ${r.accession || 'accession not reported'} | ${(r.size / 1024).toFixed(0)} KiB${r.xbrl ? ' | XBRL' : ''}${r.items ? ` | items ${r.items}` : ''}`),
    'Gaps are calendar days between consecutive filings of this form in the recent block, which the SEC caps in length.',
  ].join('\n')
}
