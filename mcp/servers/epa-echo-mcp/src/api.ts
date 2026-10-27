/**
 * EPA ECHO — keyless public API client.
 */
const BASE = "https://echodata.epa.gov/echo"
const SOURCE = "EPA ECHO"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "epa-echo-mcp", accept },
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

const ENVIROFACTS = "https://data.epa.gov/efservice"

function checkState(state: string): string {
  const s = clean(state).toUpperCase()
  if (!/^[A-Z]{2}$/.test(s)) throw new SourceError("state must be a two-letter code like RI")
  return s
}

function checkLimit(n: number | undefined): number {
  const v = n ?? 15
  if (!Number.isInteger(v) || v < 1 || v > 50) throw new SourceError("limit must be between 1 and 50")
  return v
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let field = ""
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i += 1 } else quoted = false
      } else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ",") { out.push(field); field = "" }
    else field += ch
  }
  out.push(field)
  return out
}

async function csvRows(queryId: string): Promise<Array<Record<string, string>>> {
  const text = await getText(`/echo_rest_services.get_download?output=CSV&qid=${encodeURIComponent(queryId)}`, "text/csv")
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []
  const header = splitCsvLine(lines[0]).map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line)
    const row: Record<string, string> = {}
    header.forEach((h, i) => { row[h] = (cells[i] ?? "").trim() })
    return row
  })
}

export async function searchFacilities(a: { state: string; city?: string; limit?: number }): Promise<string> {
  const state = checkState(a.state)
  const limit = checkLimit(a.limit)
  const query = new URLSearchParams({ output: "JSON", p_st: state })
  if (a.city) query.set("p_city", clean(a.city))
  const head = await getJson(`/echo_rest_services.get_facilities?${query.toString()}`)
  const results = head?.Results ?? {}
  if (!results.QueryID) throw new SourceError(`EPA ECHO did not return a query id: ${clean(results.Message) || "unknown error"}`)
  const rows = await csvRows(String(results.QueryID))
  if (!rows.length) return `EPA ECHO returned no facilities for ${state}${a.city ? ` / ${clean(a.city)}` : ""} (${clean(results.QueryRows) || "0"} row(s) reported).`
  const shown = rows.slice(0, limit)
  const blocks = shown.map((r) => [
    clean(r.FacName) || "unnamed facility",
    `  ${[r.FacStreet, r.FacCity, r.FacState, r.FacZip].map((x) => clean(x)).filter(Boolean).join(", ") || "address not published"}`,
    `  registry ${clean(r.RegistryID)}${r.FacSICCodes ? ` · SIC ${clean(r.FacSICCodes)}` : ""}${r.FacNAICSDescs ? ` · NAICS ${clean(r.FacNAICSDescs).slice(0, 60)}` : ""}`,
    r.FacDateLastFormalAction ? `  last formal action: ${clean(r.FacDateLastFormalAction)}` : "",
  ].filter(Boolean).join("\n"))
  return [
    `EPA ECHO facilities in ${state}${a.city ? ` / ${clean(a.city)}` : ""} - ${clean(results.QueryRows) || rows.length} total, showing ${shown.length}:`,
    "",
    ...blocks,
  ].join("\n")
}

export async function enforcementTotals(a: { state: string }): Promise<string> {
  const state = checkState(a.state)
  const d = await getJson(`/echo_rest_services.get_facilities?output=JSON&p_st=${state}&p_act=Y`)
  const r = d?.Results ?? {}
  if (clean(r.Message).toLowerCase() !== "success") throw new SourceError(`EPA ECHO error: ${clean(r.Message) || "no message"}`)
  return [
    `EPA ECHO enforcement profile for ${state} (${clean(r.Version) || "version unknown"})`,
    `Facilities in query: ${clean(r.QueryRows) || "unknown"}`,
    `Clean Water Act rows: ${clean(r.CWARows) || "0"}`,
    `Clean Air Act rows: ${clean(r.CAARows) || "0"}`,
    `RCRA hazardous waste rows: ${clean(r.RCRRows) || "0"}`,
    `Safe Drinking Water rows: ${clean(r.SVRows) || "0"}`,
    `Toxic release inventory rows: ${clean(r.TRIRows) || "0"}`,
    `Formal enforcement actions: ${clean(r.FEARows) || "0"}`,
    `Inspections: ${clean(r.INSPRows) || "0"}`,
    `Total penalties in query: ${clean(r.TotalPenalties) || "none reported"}`,
  ].join("\n")
}

export async function facilitySite(a: { registryId: string }): Promise<string> {
  const id = clean(a.registryId)
  if (!/^\d{9,}$/.test(id)) throw new SourceError("registryId must be a numeric EPA FRS registry ID")
  const res = await fetch(`${ENVIROFACTS}/FRS_FACILITY_SITE/REGISTRY_ID/${id}/JSON`, { headers: { "user-agent": "epa-echo-mcp", accept: "application/json" } })
  if (!res.ok) throw new SourceError(`EPA Envirofacts responded ${res.status}`)
  let rows: any
  try {
    rows = await res.json()
  } catch {
    throw new SourceError("EPA Envirofacts returned malformed JSON")
  }
  if (!Array.isArray(rows) || !rows.length) return `EPA Envirofacts has no FRS facility site for registry ID ${id}.`
  const r = rows[0]
  return [
    clean(r.primary_name) || `Registry ${id}`,
    `Registry ID: ${clean(r.registry_id)}`,
    `Address: ${clean(r.std_full_address) || "not published"}`,
    `City/state: ${[r.std_city_name, r.state_code, r.std_zip].map((x) => clean(x)).filter(Boolean).join(", ") || "unknown"}`,
    r.county_name ? `County: ${clean(r.county_name)}` : "",
    r.federal_agency_name ? `Federal agency: ${clean(r.federal_agency_name)}` : "",
    r.epa_region_code ? `EPA region: ${clean(r.epa_region_code)}` : "",
    r.huc_code ? `HUC: ${clean(r.huc_code)}` : "",
    r.facility_url ? `Facility page: ${clean(r.facility_url)}` : "",
    `ECHO: https://echo.epa.gov/detailed-facility-report?fid=${id}`,
  ].filter(Boolean).join("\n")
}
