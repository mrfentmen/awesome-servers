/**
 * OpenCitations Index — open citation links between DOIs. Keyless.
 *
 * Verified live: /citations/{doi}, /references/{doi}, /citation-count/{doi} and
 * /reference-count/{doi}. An unknown DOI answers 200 with an empty array, so
 * "no links" is a normal answer, not an error.
 *
 * The /citations/ and /references/ responses can be very large (the links for
 * one Nature paper are ~460 KB), so output is capped and the total is printed.
 */
const API = "https://opencitations.net/index/api/v1"

export class OpenCitationsError extends Error {}

interface Link {
  oci?: string
  citing?: string
  cited?: string
  creation?: string
  timespan?: string
  journal_sc?: string
  author_sc?: string
}

async function get<T>(path: string, timeoutMs = 40000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "opencitations-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new OpenCitationsError("OpenCitations has no record for that DOI")
    if (!res.ok) throw new OpenCitationsError(`OpenCitations responded ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof OpenCitationsError) throw e
    if ((e as Error).name === "AbortError") throw new OpenCitationsError("OpenCitations request timed out")
    throw new OpenCitationsError(`OpenCitations request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

function doiOf(input: string): string {
  const v = input
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
  if (!/^10\.\d{4,9}\/\S+$/.test(v)) {
    throw new OpenCitationsError(`"${input}" is not a DOI — expected something like 10.1038/nature12373`)
  }
  return v
}

const clamp = (n: number, lo: number, hi: number): number => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo)

function render(list: Link[], doi: string, kind: "citations" | "references", limit: number): string {
  const size = clamp(limit, 1, 100)
  if (list.length === 0) return `OpenCitations has no ${kind} recorded for ${doi}.`

  const shown = list.slice(0, size)
  const lines = shown.map((l) => {
    const other = kind === "citations" ? (l.citing ?? "unknown DOI") : (l.cited ?? "unknown DOI")
    const flags = [l.journal_sc === "yes" ? "journal self-citation" : "", l.author_sc === "yes" ? "author self-citation" : ""]
      .filter((f) => f !== "")
      .join(", ")
    return `   ${l.creation ?? "date unknown"}  ${other}${flags ? `  [${flags}]` : ""}`
  })

  const header = `${kind === "citations" ? "Citations of" : "References in"} ${doi} — ${list.length} links`
  const tail = list.length > shown.length ? [`   ... ${list.length - shown.length} more (raise limit to see them)`] : []
  return [header, "", ...lines, ...tail].join("\n")
}

export async function citations(doi: string, limit = 25): Promise<string> {
  const clean = doiOf(doi)
  const list = await get<Link[]>(`/citations/${encodeURIComponent(clean)}`)
  return render(Array.isArray(list) ? list : [], clean, "citations", limit)
}

export async function references(doi: string, limit = 25): Promise<string> {
  const clean = doiOf(doi)
  const list = await get<Link[]>(`/references/${encodeURIComponent(clean)}`)
  return render(Array.isArray(list) ? list : [], clean, "references", limit)
}

export async function counts(doi: string): Promise<string> {
  const clean = doiOf(doi)
  const encoded = encodeURIComponent(clean)
  const [cit, ref] = await Promise.all([
    get<Array<{ count?: string }>>(`/citation-count/${encoded}`),
    get<Array<{ count?: string }>>(`/reference-count/${encoded}`),
  ])
  const cited = Number(cit?.[0]?.count ?? 0)
  const refs = Number(ref?.[0]?.count ?? 0)
  return [
    `${clean}`,
    "",
    `Cited by: ${Number.isFinite(cited) ? cited : 0} works`,
    `References: ${Number.isFinite(refs) ? refs : 0} works`,
  ].join("\n")
}
