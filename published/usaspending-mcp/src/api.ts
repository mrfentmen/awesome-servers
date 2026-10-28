/**
 * USAspending — keyless public API client.
 */
const BASE = "https://api.usaspending.gov/api/v2"
const SOURCE = "USAspending"
const UA = "usaspending-mcp"

export class SourceError extends Error {}

async function request(path: string, init?: RequestInit, timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "user-agent": UA,
        accept: "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
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

export async function getJson(path: string, init?: RequestInit): Promise<any> {
  const res = await request(path, init)
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

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

function usd(n: unknown): string {
  const v = Number(n)
  if (!Number.isFinite(v)) return ""
  return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 })
}

export async function agency_totals(a: { limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 15, 50)
  const d = await getJson(`/references/toptier_agencies/`)
  const list: any[] = Array.isArray(d?.results) ? d.results : []
  if (!list.length) return "USAspending returned no agencies."
  return section(`${list.length} agencies, fiscal year ${clean(list[0]?.active_fy)}`, list.slice(0, limit).map((x, i) => `${i + 1}. ${clean(x.agency_name)} — obligated ${usd(x.obligated_amount)}, outlays ${usd(x.outlay_amount)}`))
}

export async function agency_detail(a: { code: string }): Promise<string> {
  const code = clean(a.code)
  if (!/^[0-9A-Z]{1,10}$/.test(code)) throw new SourceError("code must be a top-tier agency code")
  const d = await getJson(`/agency/${code}/`)
  if (!d?.name) throw new SourceError(`No agency with code ${code}`)
  return section(clean(d.name), [
    bullet("Abbreviation", d.abbreviation),
    bullet("Top-tier code", d.toptier_code),
    bullet("Fiscal year", d.fiscal_year),
    bullet("Sub-agencies", d.subtier_agency_count),
    bullet("Website", d.website),
    bullet("Mission", clean(d.mission).slice(0, 400)),
  ])
}

export async function award_search(a: { keyword: string, limit?: number }): Promise<string> {
  const keyword = clean(a.keyword)
  if (keyword.length < 2) throw new SourceError("keyword must be at least 2 characters")
  const limit = clampLimit(a.limit, 5, 20)
  const body = {
    filters: { keywords: [keyword], award_type_codes: ["A", "B", "C", "D"] },
    fields: ["Award ID", "Recipient Name", "Award Amount", "Start Date", "End Date", "Awarding Agency", "Award Type"],
    page: 1, limit, sort: "Award Amount", order: "desc",
  }
  const d = await getJson(`/search/spending_by_award/`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  const list: any[] = Array.isArray(d?.results) ? d.results : []
  if (!list.length) return `No awards match "${keyword}".`
  return section(`${list.length} award(s) match "${keyword}"`, list.map((x, i) => `${i + 1}. ${clean(x["Recipient Name"])} — ${usd(x["Award Amount"])} · ${clean(x["Awarding Agency"])} · ${clean(x["Start Date"])} → ${clean(x["End Date"])}`))
}

export async function recipient_search(a: { keyword: string, limit?: number }): Promise<string> {
  const keyword = clean(a.keyword)
  if (keyword.length < 2) throw new SourceError("keyword must be at least 2 characters")
  const limit = clampLimit(a.limit, 10, 20)
  const body = { keyword, limit, page: 1, order: "desc", sort: "amount" }
  const d = await getJson(`/recipient/`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  const list: any[] = Array.isArray(d?.results) ? d.results : []
  if (!list.length) return `No recipient matches "${keyword}".`
  return section(`${list.length} recipient(s) match "${keyword}"`, list.map((x, i) => `${i + 1}. ${clean(x.name)} — ${usd(x.amount)} · ${clean(x.recipient_level)}`))
}

export async function top_recipients(a: { limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 20)
  const body = { filters: {}, category: "recipient", limit, page: 1 }
  const d = await getJson(`/search/spending_by_category/recipient`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  const list: any[] = Array.isArray(d?.results) ? d.results : []
  if (!list.length) return "USAspending returned no category results."
  return section(`Top ${list.length} recipients`, list.map((x, i) => `${i + 1}. ${clean(x.name)} — ${usd(x.amount)}`))
}
