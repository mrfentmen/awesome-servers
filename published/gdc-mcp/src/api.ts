/**
 * GDC Cancer Data — keyless public API client.
 */
const BASE = "https://api.gdc.cancer.gov"
const SOURCE = "GDC Cancer Data"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "gdc-mcp", accept },
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

export async function getJson(path: string, accept = "application/json", timeoutMs = 25000): Promise<any> {
  const res = await request(path, accept, timeoutMs)
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

export async function listProjects(a: { query?: string; limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 50)
  const needsWide = Boolean(clean(a.query))
  const size = needsWide ? 300 : limit
  const data = await getJson(`/projects?size=${size}&pretty=true`, "application/json", 30000)
  const hits: any[] = data?.data?.hits
  if (!Array.isArray(hits)) throw new SourceError("GDC returned an unexpected payload")
  const needle = clean(a.query).toLowerCase()
  const filtered = needle
    ? hits.filter((p: any) =>
        [p.project_id, p.name, p.disease_type, p.primary_site].some((v) =>
          Array.isArray(v) ? v.some((x) => clean(x).toLowerCase().includes(needle)) : clean(v).toLowerCase().includes(needle)))
    : hits
  if (!filtered.length) return `No GDC project matches "${clean(a.query)}".`
  return [
    `${filtered.length}${needle ? ` matching` : ""} GDC project(s) (showing ${Math.min(limit, filtered.length)}):`,
    "",
    ...filtered.slice(0, limit).map((p: any, i: number) => {
      const site = Array.isArray(p.primary_site) ? p.primary_site.slice(0, 3).join(", ") : clean(p.primary_site)
      return `${i + 1}. ${clean(p.project_id)} - ${clean(p.name)}\n   ${clean(p.disease_type)}${site ? ` · ${site}` : ""}`
    }),
  ].join("\n")
}

export async function projectDetail(a: { projectId: string }): Promise<string> {
  const id = clean(a.projectId)
  if (!/^[A-Za-z0-9._-]{3,64}$/.test(id)) throw new SourceError(`"${id}" is not a valid GDC project id`)
  const data = await getJson(`/projects/${encodeURIComponent(id)}?pretty=true`, "application/json", 25000)
  const p = data?.data
  if (!p || typeof p !== "object") throw new SourceError(`GDC has no project "${id}"`)
  const sites = Array.isArray(p.primary_site) ? p.primary_site.join(", ") : clean(p.primary_site)
  const tumors = Array.isArray(p.disease_type) ? p.disease_type.join(", ") : clean(p.disease_type)
  const summary = clean(p.summary?.project ?? p.summary)
  return [
    `${clean(p.project_id)} - ${clean(p.name)}`,
    "",
    bullet("program", p.program?.name ?? p.program),
    bullet("disease type", tumors),
    bullet("primary site", sites),
    bullet("state", p.state),
    "",
    summary ? summary.slice(0, 800) : "No summary on record.",
  ].filter(Boolean).join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

export async function findGenes(a: { symbols: string }): Promise<string> {
  const symbols = clean(a.symbols).split(",").map((s) => clean(s)).filter(Boolean)
  if (!symbols.length) throw new SourceError("give at least one gene symbol")
  if (symbols.length > 50) throw new SourceError("at most 50 symbols per call")
  const filters = JSON.stringify({ op: "in", content: { field: "symbol", value: symbols } })
  const data = await getJson(
    `/genes?size=${symbols.length}&pretty=true&filters=${encodeURIComponent(filters)}`,
    "application/json", 30000)
  const hits: any[] = data?.data?.hits
  if (!Array.isArray(hits)) throw new SourceError("GDC returned an unexpected payload")
  if (!hits.length) return `No GDC genes found for: ${symbols.join(", ")}.`
  const found = new Set(hits.map((g: any) => clean(g.symbol).toUpperCase()))
  const missing = symbols.filter((s) => !found.has(s.toUpperCase()))
  return [
    `${hits.length} gene(s) found:`,
    "",
    ...hits.map((g: any) => {
      const band = Array.isArray(g.cytoband) ? g.cytoband.join(", ") : clean(g.cytoband)
      const length = g.canonical_transcript_length ? `${g.canonical_transcript_length} bp transcript` : ""
      return `- ${clean(g.symbol)} · ${clean(g.id)} · ${clean(g.biotype)}${band ? ` · ${band}` : ""}${length ? ` · ${length}` : ""}`
    }),
    missing.length ? `\nNot found: ${missing.join(", ")}` : "",
  ].filter(Boolean).join("\n")
}
