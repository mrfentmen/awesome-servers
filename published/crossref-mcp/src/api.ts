/**
 * Crossref REST API — keyless metadata for 160M+ scholarly works:
 * papers, DOIs, journals, authors, funders. Polite pool via a plain UA.
 */
const BASE = "https://api.crossref.org"
const UA = "crossref-mcp/1.0 (https://github.com/mrfentmen/awesome-servers)"

export class CrossrefError extends Error {}

async function getJson(path: string, timeoutMs = 30000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    let res = await fetch(`${BASE}${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": UA, accept: "application/json" },
    })
    // Crossref rate-limits bursts; one polite retry covers normal tool use.
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500))
      res = await fetch(`${BASE}${path}`, {
        signal: ctrl.signal,
        headers: { "user-agent": UA, accept: "application/json" },
      })
    }
    if (res.status === 404) throw new CrossrefError("Crossref has no record for that DOI, ISSN or funder id")
    if (res.status === 429) throw new CrossrefError("Crossref is rate-limiting right now — try again in a few seconds")
    if (!res.ok) throw new CrossrefError(`Crossref responded ${res.status}`)
    const d = await res.json()
    return d?.message
  } catch (e) {
    if (e instanceof CrossrefError) throw e
    if ((e as Error).name === "AbortError") throw new CrossrefError("Crossref request timed out")
    if (e instanceof SyntaxError) throw new CrossrefError("Crossref returned malformed JSON")
    throw new CrossrefError(`Crossref request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const doiArg = (doi: string): string => {
  const v = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
  if (!/^10\.\d{4,9}\/\S+$/.test(v)) throw new CrossrefError(`"${doi}" is not a DOI, e.g. 10.1038/nature12373`)
  return v
}

const wrap = (q: string): string => encodeURIComponent(q.trim())

function date(d: any): string {
  const parts = d?.["date-parts"]?.[0]
  if (!Array.isArray(parts) || typeof parts[0] !== "number") return "date unknown"
  const [y, m, day] = parts
  return [y, m ? String(m).padStart(2, "0") : undefined, day ? String(day).padStart(2, "0") : undefined].filter(Boolean).join("-")
}

function authors(d: any, max = 4): string {
  const list: any[] = d?.author ?? []
  if (list.length === 0) return "no authors listed"
  const names = list.slice(0, max).map((a) => [a.given, a.family].filter(Boolean).join(" ") || a.name || "?")
  return `${names.join(", ")}${list.length > max ? ` +${list.length - max} more` : ""}`
}

const title = (d: any): string => (Array.isArray(d?.title) ? d.title[0] : d?.title) ?? "untitled"

function workLine(w: any, i?: number): string {
  const kind = w.type ? ` [${w.type}]` : ""
  const cited = typeof w["is-referenced-by-count"] === "number" ? ` · cited ${w["is-referenced-by-count"]}x` : ""
  return `${i !== undefined ? `${i + 1}. ` : ""}${title(w)}${kind}\n   ${authors(w)} · ${String(w["container-title"]?.[0] ?? w.publisher ?? "no venue")} · ${date(w.issued)}${cited}${w.DOI ? ` · doi:${w.DOI}` : ""}`
}

export async function searchWorks(query: string, rows = 8): Promise<string> {
  const q = query.trim()
  if (q.length < 3) throw new CrossrefError("Search query must be at least 3 characters")
  if (!Number.isInteger(rows) || rows < 1 || rows > 25) throw new CrossrefError("rows must be between 1 and 25")
  const d = await getJson(`/works?query.bibliographic=${wrap(q)}&rows=${rows}&select=DOI,title,author,issued,container-title,type,is-referenced-by-count,publisher`)
  const items: any[] = d?.items ?? []
  if (items.length === 0) return `No Crossref works match "${query}".`
  return [
    `Crossref works matching "${query}" (${items.length} of ${Number(d["total-results"] ?? items.length).toLocaleString("en-US")}):`,
    "",
    ...items.map((w, i) => workLine(w, i)),
  ].join("\n")
}

export async function workByDoi(doi: string): Promise<string> {
  const w = await getJson(`/works/${doiArg(doi)}`)
  const refs: any[] = w.reference ?? []
  const lic = (w.license ?? []).map((l: any) => l.URL).filter(Boolean)
  return [
    `${title(w)} [${w.type ?? "unknown type"}]`,
    `Authors: ${authors(w, 10)}`,
    `Venue: ${String(w["container-title"]?.[0] ?? w.publisher ?? "unknown")}${w.volume ? ` · vol ${w.volume}` : ""}${w.issue ? ` · issue ${w.issue}` : ""}${w.page ? ` · p${w.page}` : ""}`,
    `Published: ${date(w.issued)} · publisher ${w.publisher ?? "unknown"}`,
    `DOI: ${w.DOI}`,
    typeof w["is-referenced-by-count"] === "number" ? `Cited by ${w["is-referenced-by-count"]} works` : "",
    refs.length ? `References: ${refs.length}` : "",
    w.ISSN?.length ? `ISSN: ${w.ISSN.join(", ")}` : "",
    lic.length ? `License: ${lic[0]}` : "",
    w.URL ? `URL: ${w.URL}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function journalInfo(issn: string): Promise<string> {
  const clean = issn.trim().replace(/[^0-9Xx-]/g, "")
  if (!/^\d{4}-?\d{3}[\dXx]$/.test(clean)) throw new CrossrefError(`"${issn}" is not an ISSN, e.g. 0028-0836`)
  const j = await getJson(`/journals/${clean}`)
  return [
    `${title(j)}${j["publisher"] ? ` — ${j.publisher}` : ""}`,
    `ISSNs: ${(j.ISSN ?? [clean]).join(", ")}`,
    `Works indexed: ${Number(j.counts?.["total-dois"] ?? 0).toLocaleString("en-US")}`,
    j["breakdown-dois-by-type"]?.journal_article !== undefined
      ? `Journal articles: ${Number(j["breakdown-dois-by-type"].journal_article).toLocaleString("en-US")}`
      : "",
    j.ISSN?.[0] ? `Journal page: https://api.crossref.org/journals/${j.ISSN[0]}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function recentWorks(query?: string, days = 7, rows = 8): Promise<string> {
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new CrossrefError("days must be between 1 and 365")
  if (!Number.isInteger(rows) || rows < 1 || rows > 25) throw new CrossrefError("rows must be between 1 and 25")
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)
  let path = `/works?filter=from-pub-date:${since},type:journal-article&rows=${rows}&sort=published&order=desc&select=DOI,title,author,issued,container-title,type,is-referenced-by-count,publisher`
  const q = (query ?? "").trim()
  if (q) {
    if (q.length < 3) throw new CrossrefError("Optional query must be at least 3 characters")
    path += `&query.bibliographic=${wrap(q)}`
  }
  const d = await getJson(path)
  // A few Crossref records carry nonsense issue dates; drop them for a clean list.
  const maxYear = new Date().getUTCFullYear() + 1
  const items: any[] = (d?.items ?? []).filter((w: any) => {
    const y = w?.issued?.["date-parts"]?.[0]?.[0]
    return typeof y === "number" && y >= 1900 && y <= maxYear
  })
  if (items.length === 0) return `No journal articles published since ${since}${q ? ` matching "${q}"` : ""}.`
  return [
    `Journal articles published since ${since}${q ? ` matching "${q}"` : ""} (${items.length} of ${Number(d["total-results"] ?? items.length).toLocaleString("en-US")}):`,
    "",
    ...items.map((w, i) => workLine(w, i)),
  ].join("\n")
}

export async function worksByAuthor(author: string, rows = 8): Promise<string> {
  const q = author.trim()
  if (q.length < 3) throw new CrossrefError("Author name must be at least 3 characters")
  if (!Number.isInteger(rows) || rows < 1 || rows > 25) throw new CrossrefError("rows must be between 1 and 25")
  const d = await getJson(`/works?query.author=${wrap(q)}&rows=${rows}&sort=is-referenced-by-count&order=desc&select=DOI,title,author,issued,container-title,type,is-referenced-by-count,publisher`)
  const items: any[] = d?.items ?? []
  if (items.length === 0) return `No Crossref works found for author "${author}".`
  return [
    `Most-cited Crossref works attributed to "${author}" (${items.length} of ${Number(d["total-results"] ?? items.length).toLocaleString("en-US")}):`,
    "",
    ...items.map((w, i) => workLine(w, i)),
  ].join("\n")
}

export async function funderSearch(query: string, rows = 8): Promise<string> {
  const q = query.trim()
  if (q.length < 2) throw new CrossrefError("Funder query must be at least 2 characters")
  if (!Number.isInteger(rows) || rows < 1 || rows > 25) throw new CrossrefError("rows must be between 1 and 25")
  const d = await getJson(`/funders?query=${wrap(q)}&rows=${rows}`)
  const items: any[] = d?.items ?? []
  if (items.length === 0) return `No Crossref funders match "${query}".`
  const lines = items.map((f, i) => {
    const where = [f.location ?? f["location"]].filter(Boolean)
    const region = f["country"] ?? f.location ?? ""
    return `${i + 1}. ${f.name}${f["alt-names"]?.length ? ` (aka ${f["alt-names"].slice(0, 3).join(", ")})` : ""}\n   id ${f.id ?? f.URI ?? "?"}${region ? ` · ${region}` : ""}${where.length ? "" : ""}`
  })
  return [`Crossref funders matching "${query}" (${items.length} of ${Number(d["total-results"] ?? items.length).toLocaleString("en-US")}):`, "", ...lines].join("\n")
}
