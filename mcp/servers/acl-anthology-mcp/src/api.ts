/**
 * ACL Anthology — keyless access to 100k+ computational-linguistics papers.
 *
 * Two official surfaces are used, both public and stable: the per-paper BibTeX
 * file (`<id>.bib`) and the site's static archive pages (paper, volume, event).
 * Volume and event pages are large, so parsed listings are cached in-process.
 */
const BASE = "https://aclanthology.org"

export class AnthologyError extends Error {}

const UA = { "user-agent": "acl-anthology-mcp", accept: "text/html,application/x-bibtex" }

async function getText(url: string, timeoutMs = 30000): Promise<string> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: UA })
    if (res.status === 404) throw new AnthologyError(`ACL Anthology has nothing at ${url.replace(BASE, "")}`)
    if (!res.ok) throw new AnthologyError(`ACL Anthology responded ${res.status}`)
    return await res.text()
  } catch (e) {
    if (e instanceof AnthologyError) throw e
    if ((e as Error).name === "AbortError") throw new AnthologyError("ACL Anthology request timed out")
    throw new AnthologyError(`ACL Anthology request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

/* ------------------------------------------------------------------ ids */

/** Modern ids (`2024.acl-long.1`) and the pre-2019 style (`P19-1001`). */
const ID_RE = /^(?:\d{4}\.[a-z0-9-]+\.\d+|[A-Z]\d{2}-\d{4})$/

export function normaliseId(id: string): string {
  const v = id
    .trim()
    .replace(/^https?:\/\/aclanthology\.org\//, "")
    .replace(/\.(pdf|bib)$/, "")
    .replace(/\/$/, "")
  if (!ID_RE.test(v)) {
    throw new AnthologyError(`"${id}" is not an Anthology id — expected 2024.acl-long.1 or P19-1001`)
  }
  return v
}

/* --------------------------------------------------------------- parsing */

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

interface Meta {
  title: string
  authors: string[]
  venue: string
  date: string
  doi: string
  pages: string
  pdf: string
}

function readMeta(html: string): Meta {
  const all = (name: string): string[] =>
    [...html.matchAll(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*name=${name}>`, "g"))].map((m) => decode(m[1]))
  const one = (name: string): string => all(name)[0] ?? ""
  const first = one("citation_firstpage")
  const last = one("citation_lastpage")
  return {
    title: one("citation_title"),
    authors: all("citation_author"),
    venue: one("citation_conference_title"),
    date: one("citation_publication_date"),
    doi: one("citation_doi"),
    pages: first ? (last && last !== first ? `${first}-${last}` : first) : "",
    pdf: one("citation_pdf_url"),
  }
}

function readAbstract(html: string): string {
  const m =
    html.match(/<div[^>]*class="[^"]*acl-abstract[^"]*"[^>]*>([\s\S]*?)<\/div>/) ??
    html.match(/<h5[^>]*>\s*Abstract\s*<\/h5>([\s\S]*?)<\/div>/)
  if (!m) return ""
  return decode(m[1].replace(/<h5[^>]*>[\s\S]*?<\/h5>/, ""))
}

/* -------------------------------------------------------------- caching */

const TTL_MS = 10 * 60 * 1000
const cache = new Map<string, { at: number; value: unknown }>()

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T
  const value = await load()
  cache.set(key, { at: Date.now(), value })
  return value
}

/* ---------------------------------------------------------------- tools */

const authorsLine = (a: string[]): string =>
  a.length === 0 ? "no authors listed" : a.length > 6 ? `${a.slice(0, 6).join(", ")} +${a.length - 6} more` : a.join(", ")

export async function paper(id: string): Promise<string> {
  const aid = normaliseId(id)
  const html = await getText(`${BASE}/${aid}/`)
  const meta = readMeta(html)
  const abstract = readAbstract(html)
  if (!meta.title) throw new AnthologyError(`could not read metadata for ${aid}`)
  return [
    meta.title,
    "",
    `Authors: ${authorsLine(meta.authors)}`,
    meta.venue ? `Venue: ${meta.venue}` : "",
    meta.date ? `Published: ${meta.date}` : "",
    meta.pages ? `Pages: ${meta.pages}` : "",
    meta.doi ? `DOI: ${meta.doi}` : "",
    `Anthology: ${BASE}/${aid}/`,
    meta.pdf ? `PDF: ${meta.pdf}` : "",
    "",
    abstract || "(no abstract on the Anthology page)",
  ]
    .filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""))
    .join("\n")
}

export async function bibtex(id: string): Promise<string> {
  const aid = normaliseId(id)
  const body = (await getText(`${BASE}/${aid}.bib`)).trim()
  if (!body.startsWith("@")) throw new AnthologyError(`no BibTeX published for ${aid}`)
  return body
}

interface VolumeEntry {
  id: string
  title: string
}

async function loadVolume(volumeId: string): Promise<VolumeEntry[]> {
  const vid = volumeId.trim().replace(/^https?:\/\/aclanthology\.org\/volumes\//, "").replace(/\/$/, "")
  if (!/^[a-z0-9.-]+$/i.test(vid)) throw new AnthologyError(`"${volumeId}" is not a volume id, e.g. 2024.acl-long`)
  return cached(`vol:${vid}`, async () => {
    const html = await getText(`${BASE}/volumes/${vid}/`)
    const seen = new Set<string>()
    const out: VolumeEntry[] = []
    const re = /<a[^>]*href="?\/?((?:\d{4}\.[a-z0-9-]+\.\d+|[A-Z]\d{2}-\d{4}))"?[^>]*>([\s\S]*?)<\/a>/g
    for (const m of html.matchAll(re)) {
      const id = m[1]
      if (seen.has(id)) continue
      const title = decode(m[2])
      if (title.length < 3) continue
      seen.add(id)
      out.push({ id, title })
    }
    if (out.length === 0) throw new AnthologyError(`volume "${vid}" has no papers listed — check the id`)
    return out
  })
}

export async function volumePapers(volumeId: string, limit = 20, offset = 0): Promise<string> {
  const papers = await loadVolume(volumeId)
  const size = clamp(limit, 1, 100)
  const start = Number.isInteger(offset) && offset > 0 ? offset : 0
  if (start >= papers.length) throw new AnthologyError(`offset ${start} is past the end of this volume (${papers.length} papers)`)
  const page = papers.slice(start, start + size)
  const vid = volumeId.trim().replace(/^https?:\/\/aclanthology\.org\/volumes\//, "").replace(/\/$/, "")
  return [
    `${vid}: ${papers.length} papers, showing ${start + 1}-${start + page.length}`,
    "",
    ...page.map((p, i) => `${start + i + 1}. ${p.title}\n   ${p.id} · ${BASE}/${p.id}/`),
  ].join("\n")
}

export async function findInVolume(volumeId: string, query: string): Promise<string> {
  const q = query.trim().toLowerCase()
  if (q.length < 2) throw new AnthologyError("Search term must be at least 2 characters")
  const papers = await loadVolume(volumeId)
  const hits = papers.filter((p) => p.title.toLowerCase().includes(q))
  if (hits.length === 0) return `No paper title in that volume contains "${query}".`
  return [
    `${hits.length} of ${papers.length} papers match "${query}":`,
    "",
    ...hits.map((p, i) => `${i + 1}. ${p.title}\n   ${p.id} · ${BASE}/${p.id}/`),
  ].join("\n")
}

export async function eventVolumes(eventId: string): Promise<string> {
  const eid = eventId.trim().replace(/^https?:\/\/aclanthology\.org\/events\//, "").replace(/\/$/, "")
  if (!/^[a-z0-9-]+$/i.test(eid)) throw new AnthologyError(`"${eventId}" is not an event id, e.g. acl-2024`)
  const volumes = await cached(`ev:${eid}`, async () => {
    const html = await getText(`${BASE}/events/${eid}/`)
    const seen = new Set<string>()
    for (const m of html.matchAll(/href="?\/?volumes\/([a-z0-9.-]+)\/?/gi)) seen.add(m[1])
    if (seen.size === 0) throw new AnthologyError(`event "${eid}" lists no volumes — check the id`)
    return [...seen]
  })
  return [
    `${eid}: ${volumes.length} volumes`,
    "",
    ...volumes.map((v, i) => `${i + 1}. ${v} · ${BASE}/volumes/${v}/`),
  ].join("\n")
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isInteger(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}
