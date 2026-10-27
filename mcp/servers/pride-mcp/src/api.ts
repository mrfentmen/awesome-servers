/**
 * PRIDE Archive — keyless public API client.
 */
const BASE = "https://www.ebi.ac.uk/pride/ws/archive/v2"
const SOURCE = "PRIDE Archive"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "pride-mcp", accept },
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

const checkAcc = (raw: string): string => {
  const v = raw.trim().toUpperCase()
  if (!/^PXD\d{6,9}$/.test(v)) throw new SourceError(`"${raw}" is not a PRIDE accession like PXD001357`)
  return v
}

const flatten = (s: unknown): string => String(s ?? "").replace(/\s+/g, " ").trim()

export async function searchProjects(a: { keyword: string; limit: number }): Promise<string> {
  const kw = a.keyword.trim()
  if (kw.length < 2) throw new SourceError("keyword must be at least 2 characters")
  const d = await getJson(`/search/projects?keyword=${encodeURIComponent(kw)}&pageSize=${a.limit}&page=0`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `PRIDE has no projects matching "${kw}".`
  return [`${rows.length} PRIDE projects match "${kw}":`, ...rows.map((r, i) => `${i + 1}. ${r.accession} - ${flatten(r.title)}\n   ${flatten(r.projectDescription).slice(0, 180)}${flatten(r.projectDescription).length > 180 ? "…" : ""}`)].join("\n")
}

export async function projectDetail(a: { accession: string }): Promise<string> {
  const acc = checkAcc(a.accession)
  const d = await getJson(`/projects/${acc}`)
  if (!d?.accession) throw new SourceError(`PRIDE has no project ${acc}`)
  const organisms = (d?.organisms ?? []).map((o: any) => o?.name).filter(Boolean)
  const instruments = (d?.instruments ?? []).map((i: any) => i?.name).filter(Boolean)
  const refs = (d?.references ?? []).map((r: any) => r?.doi ? `doi:${r.doi}` : flatten(r?.referenceLine)).filter(Boolean)
  const keywords = (d?.keywords ?? []).map((k: any) => k?.value ?? k).filter(Boolean)
  return [
    `${d.accession} - ${flatten(d.title)}`,
    `Submitted: ${flatten(d.submissionDate).slice(0, 10)}${d.publicationDate ? ` · published ${flatten(d.publicationDate).slice(0, 10)}` : ""}`,
    `Organisms: ${organisms.join(", ") || "not listed"}`,
    `Instruments: ${instruments.join(", ") || "not listed"}`,
    keywords.length ? `Keywords: ${keywords.slice(0, 10).join(", ")}` : "",
    `Description: ${flatten(d.projectDescription).slice(0, 900)}`,
    d.sampleProcessingProtocol ? `Sample processing: ${flatten(d.sampleProcessingProtocol).slice(0, 600)}` : "",
    refs.length ? `References: ${refs.slice(0, 3).join("; ")}` : "",
    `PRIDE: https://www.ebi.ac.uk/pride/archive/projects/${d.accession}`,
  ].filter(Boolean).join("\n")
}
