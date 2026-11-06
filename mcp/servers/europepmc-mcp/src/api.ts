/**
 * Europe PMC — biomedical and life-science literature. Keyless.
 *
 * Verified live: GET /search?query=<q>&format=json returns
 * `{hitCount, nextCursorMark, resultList:{result:[...]}}` with title, authors,
 * journal, year, doi, pmid and citation counts.
 */
const API = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"

export class EuropePmcError extends Error {}

interface Result {
  id?: string
  source?: string
  pmid?: string
  pmcid?: string
  doi?: string
  title?: string
  authorString?: string
  journalTitle?: string
  pubYear?: string
  citedByCount?: number
  isOpenAccess?: string
  abstractText?: string
}

interface SearchBody {
  hitCount?: number
  nextCursorMark?: string
  resultList?: { result?: Result[] }
}

async function get<T>(params: URLSearchParams, timeoutMs = 30000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}?${params.toString()}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "europepmc-mcp", accept: "application/json" },
    })
    if (!res.ok) throw new EuropePmcError(`Europe PMC responded ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof EuropePmcError) throw e
    if ((e as Error).name === "AbortError") throw new EuropePmcError("Europe PMC request timed out")
    throw new EuropePmcError(`Europe PMC request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const clamp = (n: number, lo: number, hi: number): number => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo)

export async function search(query: string, limit = 10, cursor?: string): Promise<string> {
  const q = query.trim()
  if (q === "") throw new EuropePmcError("query must not be empty")

  const params = new URLSearchParams({
    query: q,
    format: "json",
    pageSize: String(clamp(limit, 1, 100)),
    resultType: "lite",
  })
  if (cursor !== undefined && cursor !== "") params.set("cursorMark", cursor)

  const body = await get<SearchBody>(params)
  const total = body.hitCount ?? 0
  const results = body.resultList?.result ?? []
  if (total === 0) return `No Europe PMC papers match "${q}".`
  if (results.length === 0) return `"${q}" has ${total} papers, but that cursor is past the end.`

  const lines = results.flatMap((r, i) => {
    const meta = [
      r.authorString ?? "authors unknown",
      r.journalTitle ?? "no journal",
      r.pubYear ?? "no year",
      r.citedByCount !== undefined ? `cited ${r.citedByCount}` : "",
      r.isOpenAccess === "Y" ? "open access" : "",
    ]
      .filter((p) => p !== "")
      .join(" · ")

    const ids = [
      r.pmid ? `pmid ${r.pmid}` : "",
      r.pmcid ? r.pmcid : "",
      r.doi ? `doi ${r.doi}` : "",
    ]
      .filter((p) => p !== "")
      .join(" · ")

    return [`${i + 1}. ${(r.title ?? "(untitled)").trim()}`, `   ${meta}`, ids ? `   ${ids}` : ""].filter((l) => l !== "")
  })

  const next = body.nextCursorMark ?? ""
  const tail = next !== "" && results.length === clamp(limit, 1, 100) ? `\n\nNext cursor: ${next}` : ""

  return [`"${q}" — ${total} papers`, "", ...lines].join("\n") + tail
}
