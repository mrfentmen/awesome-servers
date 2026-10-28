/**
 * BioStudies — keyless public API client.
 */
const BASE = "https://www.ebi.ac.uk/biostudies/api/v1"
const SOURCE = "BioStudies"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "biostudies-mcp", accept },
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
  if (!/^[A-Z]-[A-Z0-9]{3,20}$/.test(v)) throw new SourceError(`"${raw}" is not a BioStudies accession like S-BSST1`)
  return v
}

function attribute(attrs: any[] | undefined, name: string): string {
  const hit = (attrs ?? []).find((a) => String(a?.name).toLowerCase() === name.toLowerCase())
  return String(hit?.value ?? "").replace(/\s+/g, " ").trim()
}

export async function searchStudies(a: { query: string; limit: number }): Promise<string> {
  const q = a.query.trim()
  if (q.length < 2) throw new SourceError("search text must be at least 2 characters")
  const d = await getJson(`/search?query=${encodeURIComponent(q)}&pageSize=${a.limit}&page=1`)
  const rows: any[] = Array.isArray(d?.hits) ? d.hits : []
  if (!rows.length) return `BioStudies has no studies matching "${q}".`
  return [
    `${Number(d?.totalHits ?? rows.length).toLocaleString("en-US")} studies match "${q}" (showing ${rows.length}):`,
    ...rows.map((r, i) => `${i + 1}. ${r.accession} - ${String(r.title ?? "Untitled").slice(0, 160)}${r.author ? `\n   ${String(r.author).slice(0, 120)}` : ""}`),
  ].join("\n")
}

export async function studyDetail(a: { accession: string }): Promise<string> {
  const acc = checkAcc(a.accession)
  const d = await getJson(`/studies/${acc}`)
  if (!d?.accno) throw new SourceError(`BioStudies has no study ${acc}`)
  const title = attribute(d.attributes, "Title")
  const released = attribute(d.attributes, "ReleaseDate")
  const description = attribute(d.attributes, "Description")
  const organisms = (d?.section?.attributes ?? []).filter((x: any) => /organism/i.test(String(x?.name))).map((x: any) => x.value).join(", ")
  return [
    `${d.accno} - ${title || "Untitled"}`,
    `Released: ${released || "unknown"}`,
    organisms ? `Organisms: ${organisms}` : "",
    description ? `Description: ${description.slice(0, 1200)}` : "",
    `Files: ${Array.isArray(d?.files) && d.files[0]?.path ? d.files.length : "not listed"}`,
    `BioStudies: https://www.ebi.ac.uk/biostudies/studies/${d.accno}`,
  ].filter(Boolean).join("\n")
}
