/**
 * EPSS — keyless public API client.
 */
const BASE = "https://api.first.org/data/v1"
const SOURCE = "EPSS"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "epss-mcp", accept },
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

const CVE = /^CVE-\d{4}-\d{4,7}$/i

function checkCve(raw: string): string {
  const v = raw.trim().toUpperCase()
  if (!CVE.test(v)) throw new SourceError(`"${raw}" is not a CVE ID like CVE-2024-3094`)
  return v
}

const pct = (v: unknown): string => `${(Number(v) * 100).toFixed(2)}%`

export async function getEpssScore(a: { cve: string }): Promise<string> {
  const cve = checkCve(a.cve)
  const d = await getJson(`/epss?cve=${encodeURIComponent(cve)}`)
  const row = (d?.data ?? [])[0]
  if (!row) return `EPSS has no score for ${cve} (it may be too new or not scored).`
  return [
    `${row.cve}`,
    `Exploit probability (30 days): ${pct(row.epss)}`,
    `Percentile: ${pct(row.percentile)}`,
    `Score date: ${row.date}`,
    `Reading: ${Number(row.epss) >= 0.5 ? "very likely to be exploited" : Number(row.epss) >= 0.1 ? "elevated risk" : "low risk"}`,
  ].join("\n")
}

function render(rows: any[], total: number): string {
  return [
    `${total.toLocaleString("en-US")} CVEs scored, showing ${rows.length}:`,
    ...rows.map((r, i) => `${i + 1}. ${r.cve} - ${pct(r.epss)} (percentile ${pct(r.percentile)})`),
  ].join("\n")
}

export async function topEpssScores(a: { limit: number }): Promise<string> {
  const d = await getJson(`/epss?limit=${a.limit}&order=!epss`)
  const rows = d?.data ?? []
  if (!rows.length) return "EPSS returned no scores."
  return render(rows, Number(d?.total ?? rows.length))
}

export async function epssAboveThreshold(a: { threshold: number; limit: number }): Promise<string> {
  const d = await getJson(`/epss?epss-gt=${a.threshold}&limit=${a.limit}&order=!epss`)
  const rows = d?.data ?? []
  if (!rows.length) return `No CVE currently scores above ${pct(a.threshold)}.`
  return render(rows, Number(d?.total ?? rows.length))
}
