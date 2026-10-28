/**
 * FDIC Bank Data — keyless public API client.
 */
const BASE = "https://api.fdic.gov/banks"
const SOURCE = "FDIC Bank Data"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "fdic-mcp", accept },
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

const FIELDS = "NAME,CERT,CITY,STALP,ASSET,DEPOSITS,ACTIVE,ESTYMD,WEBADDR,BKCLASS,OFFICES,NETINC,INSDATE"

function rowsOf(d: any): any[] {
  const rows = Array.isArray(d?.data) ? d.data : []
  return rows.map((r: any) => r?.data ?? r).filter((r: any) => r && r.NAME)
}

function millions(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return "?"
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}B`
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}M`
  return `$${n}K`
}

function detailLine(r: any): string {
  const status = Number(r.ACTIVE) === 1 ? "active" : "inactive"
  return [
    `${clean(r.NAME)} (FDIC cert ${r.CERT})`,
    `  ${clean(r.CITY)}, ${clean(r.STALP)} · ${status}${r.ESTYMD ? ` · established ${clean(r.ESTYMD)}` : ""}${r.INSDATE ? ` · insured since ${clean(r.INSDATE)}` : ""}`,
    `  assets ${millions(r.ASSET)} · deposits ${millions(r.DEPOSITS)}${r.OFFICES ? ` · ${r.OFFICES} office(s)` : ""}${Number(r.NETINC) ? ` · net income ${millions(r.NETINC)}` : ""}`,
    r.WEBADDR ? `  ${clean(r.WEBADDR)}` : "",
  ].filter(Boolean).join("\n")
}

function filtersFor(parts: string[]): string {
  if (!parts.length) throw new SourceError("give at least one filter")
  return encodeURIComponent(parts.join(" AND "))
}

export async function searchInstitutions(a: { name?: string; state?: string; limit?: number }): Promise<string> {
  const limit = a.limit ?? 5
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new SourceError("limit must be between 1 and 20")
  const parts: string[] = []
  if (a.name) {
    const name = clean(a.name)
    if (name.length < 2) throw new SourceError("name must be at least 2 characters")
    if (/[:,()]/.test(name)) throw new SourceError("name must not contain filter punctuation")
    parts.push(`NAME:*${name}*`)
  }
  if (a.state) {
    const state = clean(a.state).toUpperCase()
    if (!/^[A-Z]{2}$/.test(state)) throw new SourceError("state must be a two-letter code")
    parts.push(`STALP:${state}`)
  }
  const d = await getJson(`/institutions?filters=${filtersFor(parts)}&fields=${FIELDS}&limit=${limit}&format=json`)
  const rows = rowsOf(d)
  if (!rows.length) return `The FDIC has no institution matching those filters.`
  return [
    `${d?.meta?.total ?? rows.length} institution(s) match, showing ${rows.length} (asset figures are in thousands of dollars):`,
    "",
    ...rows.map(detailLine),
  ].join("\n")
}

export async function institutionDetail(a: { cert: number }): Promise<string> {
  if (!Number.isInteger(a.cert) || a.cert < 1) throw new SourceError("cert must be a positive FDIC certificate number")
  const d = await getJson(`/institutions?filters=${filtersFor([`CERT:${a.cert}`])}&fields=${FIELDS}&limit=1&format=json`)
  const rows = rowsOf(d)
  const r = rows[0]
  if (!r) return `The FDIC has no institution with certificate ${a.cert}.`
  return [
    detailLine(r),
    "",
    `BankFind profile: https://banks.data.fdic.gov/bankfind-suite/bankfind/details/${r.CERT}`,
  ].join("\n")
}

export async function banksInState(a: { state: string; limit?: number }): Promise<string> {
  const state = clean(a.state).toUpperCase()
  if (!/^[A-Z]{2}$/.test(state)) throw new SourceError("state must be a two-letter code")
  const limit = a.limit ?? 10
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new SourceError("limit must be between 1 and 25")
  const d = await getJson(`/institutions?filters=${filtersFor([`STALP:${state}`, "ACTIVE:1"])}&fields=${FIELDS}&sort_by=ASSET&sort_order=DESC&limit=${limit}&format=json`)
  const rows = rowsOf(d)
  if (!rows.length) return `The FDIC lists no active bank headquartered in ${state}.`
  return [
    `${d?.meta?.total ?? rows.length} active bank(s) headquartered in ${state}, largest first (showing ${rows.length}):`,
    "",
    ...rows.map((r) => `- ${clean(r.NAME)} (cert ${r.CERT}) · ${clean(r.CITY)} · assets ${millions(r.ASSET)} · deposits ${millions(r.DEPOSITS)}`),
  ].join("\n")
}

const FIN_FIELDS = "CERT,REPDTE,ASSET,DEP,DEPDOM,NETINC,ROA,ROE,LNLSNET,EQ,LNLSDEP"

function financialsOf(d: any): any[] {
  const rows = Array.isArray(d?.data) ? d.data : []
  return rows.map((r: any) => r?.data ?? r).filter((r: any) => r && r.CERT)
}

export async function bankFinancials(a: { cert: number }): Promise<string> {
  const d = await getJson(`/financials?filters=CERT:${a.cert}&fields=${FIN_FIELDS}&sort_by=REPDTE&sort_order=DESC&limit=8`)
  const rows = financialsOf(d).sort((x, y) => String(y.REPDTE).localeCompare(String(x.REPDTE)))
  if (!rows.length) throw new SourceError(`No financial reports for FDIC cert ${a.cert}`)
  const r = rows[0]
  const date = String(r.REPDTE)
  return section(`FDIC cert ${a.cert} · quarter ending ${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`, [
    bullet("Total assets", millions(r.ASSET)),
    bullet("Total deposits", millions(r.DEP)),
    bullet("Domestic deposits", millions(r.DEPDOM)),
    bullet("Net loans and leases", millions(r.LNLSNET)),
    bullet("Total equity", millions(r.EQ)),
    bullet("Net income", millions(r.NETINC)),
    bullet("Return on assets", r.ROA !== undefined ? `${Number(r.ROA).toFixed(2)}%` : ""),
    bullet("Return on equity", r.ROE !== undefined ? `${Number(r.ROE).toFixed(2)}%` : ""),
    bullet("Prior quarters", rows.slice(1, 5).map((x) => `${String(x.REPDTE).slice(0, 4)}Q${Math.ceil(Number(String(x.REPDTE).slice(4, 6)) / 3)}`).join(", ")),
  ])
}

export async function banksByCity(a: { city: string; state?: string; limit: number }): Promise<string> {
  const city = clean(a.city)
  if (city.length < 2) throw new SourceError("city must be at least 2 characters")
  const parts = [`CITY:${city}`]
  if (a.state) parts.push(`STALP:${clean(a.state).toUpperCase()}`)
  const d = await getJson(`/institutions?filters=${encodeURIComponent(parts.join(" AND "))}&fields=${FIELDS}&limit=${a.limit}`)
  const rows = rowsOf(d)
  if (!rows.length) return `No banks found in ${city}${a.state ? `, ${a.state}` : ""}.`
  return section(`${rows.length} bank(s) in ${city}${a.state ? `, ${a.state}` : ""}`, rows.map(detailLine))
}

export async function bankLocations(a: { cert: number; limit: number }): Promise<string> {
  const d = await getJson(`/locations?filters=CERT:${a.cert}&limit=${a.limit}`)
  const rows = Array.isArray(d?.data) ? d.data.map((r: any) => r?.data ?? r).filter((r: any) => r && r.ADDRESS) : []
  if (!rows.length) return `No branch records for FDIC cert ${a.cert}.`
  return section(`${rows.length} branch office(s) for cert ${a.cert}`, rows.map((r: any, i: number) =>
    `${i + 1}. ${clean(r.ADDRESS)} · ${clean(r.CITY)}, ${clean(r.STALP)} ${clean(r.ZIP)} · ${clean(r.CBSA_METRO_NAME) || clean(r.COUNTY) || ""}`))
}

export async function failedBanks(a: { since?: string; limit: number }): Promise<string> {
  const since = a.since ? clean(a.since) : ""
  const filters = since ? `ACTIVE:0 AND ENDEFYMD:[${since} TO 29991231]` : "ACTIVE:0"
  const d = await getJson(`/institutions?filters=${encodeURIComponent(filters)}&fields=${FIELDS},ENDEFYMD&limit=${a.limit}`)
  const rows = rowsOf(d).filter((r: any) => r.ENDEFYMD)
  if (!rows.length) return "No closed banks match that filter."
  return section(`${rows.length} closed bank(s)`, rows.map((r: any, i: number) =>
    `${i + 1}. ${clean(r.NAME)} (cert ${r.CERT}) · ${clean(r.CITY)}, ${clean(r.STALP)} · closed ${clean(r.ENDEFYMD)}`))
}
