/**
 * SciELO ArticleMeta — keyless access to 567k+ open-access articles from Latin
 * America, Spain, Portugal and South Africa.
 *
 * ArticleMeta answers in JSON, but article bodies are MARC-like tag maps
 * (`v10` authors, `v977` title, `v83` abstract, `v14` pages, `v65` date), so
 * most of this file is a small, format-specific reader for those tags.
 */
const BASE = "https://articlemeta.scielo.org/api/v1"

export class ScieloError extends Error {}

interface MarcField {
  _?: string
  l?: string
  s?: string
  n?: string
  f?: string
  k?: string
  a?: string
}

type Marc = Record<string, MarcField[] | undefined>

interface ArticleRecord {
  code?: string
  collection?: string
  title?: string
  publication_date?: string
  article?: Marc
  citations?: unknown
  fulltexts?: unknown
}

async function getJson(url: string, timeoutMs = 30000): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "scielo-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new ScieloError("SciELO has no record at that address")
    if (!res.ok) throw new ScieloError(`SciELO responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof ScieloError) throw e
    if ((e as Error).name === "AbortError") throw new ScieloError("SciELO request timed out")
    throw new ScieloError(`SciELO request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

/* --------------------------------------------------------------- readers */

const decode = (s: string): string =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()

function fieldText(fields: Marc, tag: string, lang?: string): string {
  const arr = fields[tag]
  if (!Array.isArray(arr) || arr.length === 0) return ""
  const pick = lang ? arr.find((f) => f?.l === lang) : undefined
  const nonEmpty = arr.find((f) => typeof f?._ === "string" && f._.trim() !== "")
  return decode((pick ?? nonEmpty ?? arr[0])?._ ?? "")
}

function authorList(fields: Marc): string[] {
  const arr = fields.v10
  if (!Array.isArray(arr)) return []
  return arr
    .map((a) => [a?.n, a?.s].filter((p) => typeof p === "string" && p.trim() !== "").join(" ").trim())
    .filter((n) => n !== "")
}

function pageRange(fields: Marc): string {
  const arr = fields.v14
  if (!Array.isArray(arr)) return ""
  const from = arr.find((f) => typeof f?.f === "string" && f.f.trim() !== "")?.f ?? ""
  const to = arr.find((f) => typeof f?.l === "string" && f.l.trim() !== "")?.l ?? ""
  if (!from) return ""
  return to && to !== from ? `${from}-${to}` : from
}

function keywordList(fields: Marc): string[] {
  const arr = fields.v85 ?? fields.v978
  if (!Array.isArray(arr)) return []
  return arr
    .map((k) => (typeof k?.k === "string" ? k.k.trim() : ""))
    .filter((k) => k !== "")
}

function dateOf(rec: ArticleRecord): string {
  const raw = rec.article ? fieldText(rec.article, "v65") : ""
  if (/^\d{6}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}`
  if (/^\d{4}-\d{2}/.test(rec.publication_date ?? "")) return (rec.publication_date as string).slice(0, 7)
  return raw || "date unknown"
}

const cleanCode = (code: string): string => {
  const v = code.trim().replace(/^https?:\/\/.*\/article\//, "").replace(/\/$/, "")
  if (!/^[A-Z]?\d{4}-\d{3}[\dX][A-Z0-9]{8,}$/i.test(v)) {
    throw new ScieloError(`"${code}" is not a SciELO article code — expected something like S0100-879X1998080002`)
  }
  return v
}

const clamp = (n: number, lo: number, hi: number): number => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo)

const isoDate = (d: string, label: string): string => {
  const v = d.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new ScieloError(`${label} must be a date like 2025-01-31`)
  return v
}

/* ----------------------------------------------------------------- tools */

export async function article(code: string): Promise<string> {
  const clean = cleanCode(code)
  const rec = (await getJson(`${BASE}/article/?code=${encodeURIComponent(clean)}`)) as ArticleRecord | null
  if (!rec || typeof rec !== "object" || !rec.article) throw new ScieloError(`SciELO has no article with code ${clean}`)

  const f = rec.article
  const title = fieldText(f, "v12", "en") || fieldText(f, "v977", "en") || fieldText(f, "v12") || fieldText(f, "v977")
  const authors = authorList(f)
  const journal = fieldText(f, "v30")
  const volume = fieldText(f, "v31")
  const issue = fieldText(f, "v32")
  const pages = pageRange(f)
  const abstract = fieldText(f, "v83", "en") || fieldText(f, "v83")
  const keywords = keywordList(f)
  const citations = Array.isArray(rec.citations) ? rec.citations.length : 0
  const fulltexts = Array.isArray(rec.fulltexts)
    ? (rec.fulltexts as Array<Record<string, unknown>>)
        .map((x) => (typeof x?.url === "string" ? x.url : typeof x?._ === "string" ? x._ : ""))
        .filter((u) => u !== "")
    : []
  const authorsShown = authors.length > 8 ? `${authors.slice(0, 8).join(", ")} +${authors.length - 8} more` : authors.join(", ")

  return [
    title || "(no title in the record)",
    "",
    `Authors: ${authorsShown || "none listed"}`,
    journal ? `Journal: ${journal}` : "",
    volume || issue ? `Volume/issue: ${[volume, issue].filter(Boolean).join(" / ")}` : "",
    pages ? `Pages: ${pages}` : "",
    `Published: ${dateOf(rec)}`,
    `Collection: ${(rec.collection ?? fieldText(f, "v992")) || "unknown"}`,
    `SciELO code: ${clean}`,
    fulltexts.length > 0 ? `Full text: ${fulltexts[0]}` : "",
    citations > 0 ? `Cited-by records in SciELO: ${citations}` : "",
    keywords.length > 0 ? `Keywords: ${keywords.join(", ")}` : "",
    "",
    abstract || "(no abstract in the record)",
  ]
    .filter((line) => line !== "")
    .join("\n")
}

export async function recentArticles(
  collection = "scl",
  limit = 20,
  offset = 0,
  from?: string,
  until?: string
): Promise<string> {
  const col = collection.trim()
  if (!/^[a-z0-9]{2,6}$/i.test(col)) throw new ScieloError(`"${collection}" is not a collection code, e.g. scl, arg, mex`)
  const size = clamp(limit, 1, 100)
  const skip = Number.isInteger(offset) && offset > 0 ? offset : 0
  const params = new URLSearchParams({ collection: col, limit: String(size), offset: String(skip) })
  if (from) params.set("from", isoDate(from, "from"))
  if (until) params.set("until", isoDate(until, "until"))

  const data = (await getJson(`${BASE}/article/identifiers/?${params.toString()}`)) as {
    meta?: { total?: number }
    objects?: Array<{ code?: string; processing_date?: string }>
  }
  const total = data?.meta?.total ?? 0
  const rows = data?.objects ?? []
  if (rows.length === 0) return `No ${col} articles in that window.`
  return [
    `${col}: ${total} articles match, showing ${skip + 1}-${skip + rows.length}`,
    "",
    ...rows.map((r, i) => `${skip + i + 1}. ${r.code ?? "unknown code"} · indexed ${r.processing_date ?? "unknown"}`),
  ].join("\n")
}

export async function journal(issn: string, collection = "scl"): Promise<string> {
  const code = issn.trim().toUpperCase()
  if (!/^\d{4}-?\d{3}[\dX]$/.test(code)) throw new ScieloError(`"${issn}" is not an ISSN — expected 0100-879X`)
  const col = collection.trim()
  const data = (await getJson(
    `${BASE}/journal/?collection=${encodeURIComponent(col)}&issn=${encodeURIComponent(code)}`
  )) as Array<Record<string, unknown>>
  if (!Array.isArray(data) || data.length === 0) throw new ScieloError(`SciELO has no journal ${code} in collection ${col}`)

  return data
    .map((j) => {
      const title = Array.isArray(j.v100) ? decode(String((j.v100 as MarcField[])[0]?._ ?? "")) : ""
      const issns = Array.isArray(j.issns) ? (j.issns as string[]).join(", ") : ""
      const publisher = Array.isArray(j.v480) ? decode(String((j.v480 as MarcField[])[0]?._ ?? "")) : ""
      return [
        title || `(journal ${String(j.code ?? code)})`,
        `   ISSN: ${issns || String(j.code ?? code)}`,
        publisher ? `   Publisher: ${publisher}` : "",
        `   Collection: ${String(j.collection ?? col)}`,
        `   SciELO journal code: ${String(j.code ?? code)}`,
      ]
        .filter((l) => l !== "")
        .join("\n")
    })
    .join("\n\n")
}

export async function journals(collection = "scl", limit = 20, offset = 0): Promise<string> {
  const col = collection.trim()
  const size = clamp(limit, 1, 100)
  const skip = Number.isInteger(offset) && offset > 0 ? offset : 0
  const data = (await getJson(
    `${BASE}/journal/?collection=${encodeURIComponent(col)}&limit=${size}&offset=${skip}`
  )) as Array<Record<string, unknown>>
  if (!Array.isArray(data) || data.length === 0) throw new ScieloError(`collection "${col}" returned no journals`)
  return [
    `${col} journals, showing ${skip + 1}-${skip + data.length}`,
    "",
    ...data.map((j, i) => {
      const title = Array.isArray(j.v100) ? decode(String((j.v100 as MarcField[])[0]?._ ?? "")) : ""
      const issns = Array.isArray(j.issns) ? (j.issns as string[]).join(", ") : ""
      return `${skip + i + 1}. ${title || "(untitled)"} · ${issns || String(j.code ?? "")}`
    }),
  ].join("\n")
}

export async function collections(): Promise<string> {
  const data = (await getJson(`${BASE}/collection/identifiers/`)) as Array<Record<string, unknown>>
  if (!Array.isArray(data) || data.length === 0) throw new ScieloError("SciELO returned no collections")
  return [
    `${data.length} SciELO collections`,
    "",
    ...data.map((c, i) => {
      const acron = String(c.acron ?? c.code ?? "")
      const domain = String(c.domain ?? "")
      return `${i + 1}. ${acron}${domain ? ` · ${domain}` : ""}`
    }),
  ].join("\n")
}
