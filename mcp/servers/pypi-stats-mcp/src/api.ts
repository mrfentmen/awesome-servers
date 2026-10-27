/**
 * pypistats.org client. Keyless. Download counts per package: recent totals,
 * a daily series, Python version split and operating-system split.
 */
const BASE = "https://pypistats.org/api/packages"

export class PyPIStatsError extends Error {}

export interface Recent {
  last_day?: number
  last_week?: number
  last_month?: number
}

export interface Slice {
  category?: string
  date?: string
  downloads?: number
}

async function getJson(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "pypi-stats-mcp/1.0 (awesome-servers)" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new PyPIStatsError("package not found on PyPI")
  if (!res.ok) throw new PyPIStatsError(`pypistats error ${res.status}`)
  return res.json()
}

export async function recent(pkg: string): Promise<Recent> {
  const body = (await getJson(`/${encodeURIComponent(pkg)}/recent`)) as { data?: Recent }
  return body.data ?? {}
}

export async function byDate(pkg: string, days = 30): Promise<Slice[]> {
  const body = (await getJson(`/${encodeURIComponent(pkg)}/overall?mirrors=false`)) as {
    data?: Slice[]
  }
  const rows = (body.data ?? []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))
  return rows.slice(0, days)
}

export async function byPythonMajor(pkg: string): Promise<Slice[]> {
  const body = (await getJson(`/${encodeURIComponent(pkg)}/python_major`)) as { data?: Slice[] }
  return body.data ?? []
}

export async function byPythonMinor(pkg: string): Promise<Slice[]> {
  const body = (await getJson(`/${encodeURIComponent(pkg)}/python_minor`)) as { data?: Slice[] }
  return body.data ?? []
}

export async function bySystem(pkg: string): Promise<Slice[]> {
  const body = (await getJson(`/${encodeURIComponent(pkg)}/system`)) as { data?: Slice[] }
  return body.data ?? []
}

export function number(n: number | undefined): string {
  if (n === undefined || n === null) return "unknown"
  return n.toLocaleString("en-US")
}

export function totals(r: Recent): string {
  return [
    `last day:   ${number(r.last_day)}`,
    `last week:  ${number(r.last_week)}`,
    `last month: ${number(r.last_month)}`,
  ].join("\n")
}

export function sliceLines(rows: Slice[], label: string, limit = 12): string {
  if (!rows.length) return `No ${label} data.`
  const totals = new Map<string, number>()
  for (const r of rows) {
    const key = r.category ?? r.date ?? "unknown"
    totals.set(key, (totals.get(key) ?? 0) + (r.downloads ?? 0))
  }
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
  return top.map(([key, n]) => `${key}: ${number(n)}`).join("\n")
}
