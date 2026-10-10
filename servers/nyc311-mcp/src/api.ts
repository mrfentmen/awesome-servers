const BASE = "https://data.cityofnewyork.us/resource/erm2-nwe9.json"
const HEADERS = { "User-Agent": "mrfentmen-nyc311-mcp/1.0" }

export class Nyc311Error extends Error {}

function quote(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

function validateDates(start?: string, end?: string): void {
  const parse = (value: string) => {
    const date = new Date(`${value}T00:00:00Z`)
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Nyc311Error(`Invalid date: ${value}`)
    return date
  }
  if (start && end && parse(start) >= parse(end)) throw new Nyc311Error("start must be earlier than end")
  if (start) parse(start)
  if (end) parse(end)
}

function filters(complaintType?: string, borough?: string, agency?: string, start?: string, end?: string): string[] {
  validateDates(start, end)
  const result: string[] = []
  if (complaintType) result.push(`complaint_type = ${quote(complaintType)}`)
  if (borough) result.push(`borough = ${quote(borough.toUpperCase())}`)
  if (agency) result.push(`agency = ${quote(agency.toUpperCase())}`)
  if (start) result.push(`created_date >= ${quote(start)}`)
  if (end) result.push(`created_date < ${quote(end)}`)
  return result
}

async function query(params: Record<string, string>): Promise<unknown> {
  const url = new URL(BASE)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Nyc311Error(`NYC 311 error ${response.status}`)
  return response.json()
}

export function searchRequests(complaintType?: string, borough?: string, agency?: string, start?: string, end?: string, limit = 20) {
  const where = filters(complaintType, borough, agency, start, end)
  return query({
    $select: "created_date,closed_date,agency,complaint_type,descriptor,borough,status",
    $order: "created_date DESC",
    $limit: String(limit),
    ...(where.length ? { $where: where.join(" AND ") } : {}),
  })
}

export function countRequests(complaintType?: string, borough?: string, agency?: string, start?: string, end?: string, limit = 100) {
  const where = filters(complaintType, borough, agency, start, end)
  return query({
    $select: "complaint_type,count(*) as total",
    $group: "complaint_type",
    $order: "total DESC",
    $limit: String(limit),
    ...(where.length ? { $where: where.join(" AND ") } : {}),
  })
}

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, 16000) }

// ---- muxB tools:

// aggregation only: the existing tools deliberately keep addresses and
// coordinates out of the response, so these do too
async function groupBy(column: string, where: string, limit: number): Promise<Array<Record<string, string>>> {
  const params: Record<string, string> = {
    $select: `${column},count(*) as n`,
    $group: column,
    $order: 'n DESC',
    $limit: String(limit),
  }
  if (where) params.$where = where
  const url = new URL(BASE)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Nyc311Error(`NYC 311 error ${response.status}`)
  return (await response.json()) as Array<Record<string, string>>
}

const nycCount = (row: Record<string, string>): string => {
  const n = Number(row.n)
  return Number.isFinite(n) ? n.toLocaleString('en-US') : 'not reported'
}

export interface AgencyBreakdownArgs {
  start?: string
  end?: string
  limit?: number
}

export interface BoroughBreakdownArgs {
  start?: string
  end?: string
}

export async function boroughBreakdown(args: BoroughBreakdownArgs): Promise<string> {
  validateDates(args.start, args.end)
  const where = filters(undefined, undefined, undefined, args.start, args.end).join(' AND ')
  const rows = await groupBy('borough', where, 6)
  if (!rows.length) return 'NYC 311 returned no borough totals.'
  return `NYC 311 requests by borough (${rows.length} shown):\n` +
    rows.map((r, i) => `${i + 1}. ${r.borough || 'not reported'}: ${nycCount(r)} requests`).join('\n')
}

export interface OpenByTypeArgs {
  limit?: number
}

