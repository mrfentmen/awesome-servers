/**
 * ICD-10-CM — keyless public API client.
 */
const BASE = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3"
const SOURCE = "ICD-10-CM"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "icd10-mcp", accept },
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

function parse(d: any): { count: number; rows: { code: string; name: string }[] } {
  if (!Array.isArray(d)) throw new SourceError("NLM returned an unexpected response")
  const codes: string[] = Array.isArray(d[1]) ? d[1] : []
  const names: any[] = Array.isArray(d[3]) ? d[3] : []
  return {
    count: Number(d[0] ?? codes.length),
    rows: codes.map((code, i) => ({
      code,
      name: Array.isArray(names[i]) ? String(names[i][1] ?? names[i][0] ?? "") : String(names[i] ?? ""),
    })),
  }
}

async function query(params: string, sf = "code,name"): Promise<{ count: number; rows: { code: string; name: string }[] }> {
  return parse(await getJson(`/search?sf=${sf}&${params}`))
}

const cleanCode = (raw: string): string => {
  const v = raw.trim().toUpperCase()
  if (!/^[A-Z]\d{2}(\.[A-Z0-9]{1,4})?$/.test(v)) throw new SourceError(`"${raw}" is not an ICD-10-CM code like E11.9`)
  return v
}

export async function searchIcd10(a: { terms: string; limit: number }): Promise<string> {
  const terms = a.terms.trim()
  if (terms.length < 2) throw new SourceError("search text must be at least 2 characters")
  const r = await query(`terms=${encodeURIComponent(terms)}&maxList=${a.limit}`)
  if (!r.rows.length) return `No ICD-10-CM codes match "${terms}".`
  return [`${r.count.toLocaleString("en-US")} codes match "${terms}" (showing ${r.rows.length}):`, ...r.rows.map((x, i) => `${i + 1}. ${x.code} - ${x.name}`)].join("\n")
}

export async function lookupIcd10Code(a: { code: string }): Promise<string> {
  const code = cleanCode(a.code)
  const exact = await query(`terms=${encodeURIComponent(code)}&maxList=50`)
  const hit = exact.rows.find((r) => r.code === code)
  if (hit) return [`${hit.code} - ${hit.name}`, "Status: billable / exact match"].join("\n")
  const base = await query(`terms=${encodeURIComponent(code)}&maxList=50`)
  if (base.rows.length) {
    return [
      `${code} is not a billable code by itself.`,
      `Parent category results (${base.rows.length}):`,
      ...base.rows.slice(0, 10).map((r) => `${r.code} - ${r.name}`),
    ].join("\n")
  }
  return `${code} is not a valid ICD-10-CM code.`
}

export async function browseIcd10Prefix(a: { prefix: string; limit: number }): Promise<string> {
  const prefix = a.prefix.trim().toUpperCase()
  if (!/^[A-Z][0-9.]{0,4}$/.test(prefix)) throw new SourceError(`"${a.prefix}" is not an ICD-10-CM prefix`)
  const r = await query(`terms=${encodeURIComponent(prefix)}&maxList=${a.limit}`, "code")
  if (!r.rows.length) return `No codes under prefix ${prefix}.`
  return [`Codes under ${prefix} (${r.rows.length} shown):`, ...r.rows.map((x, i) => `${i + 1}. ${x.code} - ${x.name}`)].join("\n")
}
