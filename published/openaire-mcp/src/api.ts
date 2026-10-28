/**
 * OpenAIRE — keyless public API client.
 */
const BASE = "https://api.openaire.eu"
const SOURCE = "OpenAIRE"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "openaire-mcp", accept },
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

const val = (v: any): any => (v && typeof v === "object" && "$" in v ? v.$ : v)

function results(d: any): any[] {
  const r = d?.response?.results?.result
  return Array.isArray(r) ? r : r ? [r] : []
}

const asList = (v: any): any[] => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v])

function entity(row: any): any {
  return row?.metadata?.["oaf:entity"]?.["oaf:result"] ?? row?.metadata?.["oaf:entity"]?.["oaf:project"] ?? {}
}

const text = (v: any): string => String(val(v) ?? "").replace(/\s+/g, " ").trim()

function creators(e: any): string {
  const list = asList(e?.creator)
  const names = list.map((c: any) => text(c?.["$"] ?? c)).filter(Boolean)
  return names.slice(0, 3).join(", ") + (names.length > 3 ? ` +${names.length - 3}` : "")
}

function render(title: string, rows: any[], total: any, limit: number): string {
  if (!rows.length) return `No ${title.toLowerCase()} matched.`
  const out = rows.slice(0, limit).map((row, i) => {
    const e = entity(row)
    const name = text(e?.title) || "Untitled"
    const date = text(e?.dateofacceptance?.$ ?? e?.dateofacceptance) || "n.d."
    const type = text(e?.resulttype?.["@classname"] ?? e?.resulttype) || "publication"
    const doi = asList(e?.pid).find((p: any) => String(p?.["@classid"]).toLowerCase() === "doi")
    const publisher = text(e?.publisher)
    const authors = creators(e)
    const project = row?.metadata?.["oaf:entity"]?.["oaf:project"]
    const funding = project ? text(project?.title) : ""
    return `${i + 1}. ${name}\n   ${date} · ${type}${publisher ? ` · ${publisher}` : ""}${authors ? `\n   ${authors}` : ""}${doi ? `\n   doi:${text(doi)}` : ""}${funding ? `\n   project: ${funding}` : ""}`
  })
  return [`${Number(total ?? rows.length).toLocaleString("en-US")} ${title.toLowerCase()}, showing ${out.length}:`, ...out].join("\n")
}

async function search(a: { query: string; limit: number }, kind: string): Promise<string> {
  const q = a.query.trim()
  if (q.length < 2) throw new SourceError("search query must be at least 2 characters")
  const d = await getJson(`/search/${kind}?keywords=${encodeURIComponent(q)}&format=json&size=${a.limit}`)
  const rows = results(d)
  const total = val(d?.response?.header?.total)
  return render(kind, rows, total, a.limit)
}

export async function searchPublications(a: { query: string; limit: number }): Promise<string> {
  return search(a, "publications")
}

export async function searchDatasets(a: { query: string; limit: number }): Promise<string> {
  return search(a, "datasets")
}

export async function searchProjects(a: { query: string; limit: number }): Promise<string> {
  return search(a, "projects")
}
