const BASE = "https://data.cityofnewyork.us/resource/qgea-i56i.json"
const HEADERS = { "User-Agent": "mrfentmen-police-transparency-mcp/1.0" }

export class PoliceTransparencyError extends Error {}

type Group = "borough" | "law_category" | "offense"
const GROUP_COLUMNS: Record<Group, string> = {
  borough: "boro_nm",
  law_category: "law_cat_cd",
  offense: "ofns_desc",
}

function quote(value: string): string { return `'${value.replaceAll("'", "''")}'` }

async function aggregate(params: Record<string, string>) {
  const url = new URL(BASE)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new PoliceTransparencyError(`NYC Open Data police error ${response.status}`)
  return response.json()
}

export async function summarize(group: Group, year?: number, borough?: string, limit = 50) {
  const column = GROUP_COLUMNS[group]
  const where: string[] = []
  if (year) where.push(`cmplnt_fr_dt >= ${quote(`${year}-01-01T00:00:00.000`)} AND cmplnt_fr_dt < ${quote(`${year + 1}-01-01T00:00:00.000`)}`)
  if (borough) where.push(`boro_nm = ${quote(borough.toUpperCase())}`)
  return aggregate({
    $select: `${column},count(*) as total`,
    $group: column,
    $having: "count(*) >= 5",
    $order: "total DESC",
    $limit: String(limit),
    ...(where.length ? { $where: where.join(" AND ") } : {}),
  })
}

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, 14000) }
