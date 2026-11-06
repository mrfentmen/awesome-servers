/**
 * bioRxiv — preprint metadata. Keyless.
 *
 * Verified live: GET /details/biorxiv/{start}/{end}/{cursor} returns
 * `{messages:[{count,total,cursor}], collection:[{doi,title,authors,date,category,version,published}]}`.
 */
const API = "https://api.biorxiv.org/details/biorxiv"

export class BiorxivError extends Error {}

interface Paper {
  doi?: string
  title?: string
  authors?: string
  author_corresponding?: string
  author_corresponding_institution?: string
  date?: string
  category?: string
  version?: string
  published?: string
  abstract?: string
}

interface DetailsBody {
  messages?: Array<{ status?: string; count?: number; total?: string; cursor?: number }>
  collection?: Paper[]
}

async function get<T>(url: string, timeoutMs = 30000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "biorxiv-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new BiorxivError("bioRxiv has no record for that request")
    if (!res.ok) throw new BiorxivError(`bioRxiv responded ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof BiorxivError) throw e
    if ((e as Error).name === "AbortError") throw new BiorxivError("bioRxiv request timed out")
    throw new BiorxivError(`bioRxiv request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

function checkDate(value: string, label: string): string {
  const v = value.trim()
  if (!DAY.test(v)) throw new BiorxivError(`${label} must be a date, YYYY-MM-DD`)
  return v
}

const iso = (d: Date): string => d.toISOString().slice(0, 10)

export async function papers(start?: string, end?: string, cursor = 0): Promise<string> {
  const to = end !== undefined && end !== "" ? checkDate(end, "end") : iso(new Date())
  const from =
    start !== undefined && start !== ""
      ? checkDate(start, "start")
      : iso(new Date(Date.parse(`${to}T00:00:00Z`) - 6 * 24 * 60 * 60 * 1000))

  if (from > to) throw new BiorxivError("start must not be after end")
  const offset = Number.isInteger(cursor) && cursor > 0 ? cursor : 0

  const body = await get<DetailsBody>(`${API}/${from}/${to}/${offset}`)
  const rows = body.collection ?? []
  const msg = body.messages?.[0]
  if (rows.length === 0) return `No bioRxiv preprints between ${from} and ${to}.`

  const total = Number(msg?.total ?? rows.length)
  const lines = rows.flatMap((p, i) => {
    const meta = [p.authors ?? "authors unknown", p.category ?? "no category", p.date ?? "no date", `v${p.version ?? "1"}`].join(" · ")
    const pub = p.published && p.published !== "NA" ? `\n   published: ${p.published}` : ""
    return [`${offset + i + 1}. ${(p.title ?? "(untitled)").trim()}`, `   ${meta}`, `   doi: ${p.doi ?? "unknown"}${pub}`]
  })

  const next = offset + rows.length < total ? `\n\nNext cursor: ${offset + rows.length}` : ""
  return [`bioRxiv ${from} to ${to} — ${total} preprints, showing ${offset + 1}-${offset + rows.length}`, "", ...lines].join("\n") + next
}

export async function paper(input: string): Promise<string> {
  const value = input
    .trim()
    .replace(/^https?:\/\/(www\.)?(bio|med)rxiv\.org\/content\//i, "")
    .replace(/v\d+.*$/, "")
    .replace(/\.full.*$/, "")
  if (!/^10\.1101\/\S+$/.test(value)) throw new BiorxivError(`"${input}" is not a bioRxiv DOI`)

  const body = await get<DetailsBody>(`${API}/${value}`)
  const p = body.collection?.[0]
  if (!p) throw new BiorxivError(`bioRxiv has no record for ${value}`)

  return [
    (p.title ?? "(untitled)").trim(),
    "",
    `DOI: ${p.doi ?? value}`,
    `Authors: ${p.authors ?? "unknown"}`,
    p.author_corresponding ? `Corresponding: ${p.author_corresponding}` : "",
    p.author_corresponding_institution ? `Institution: ${p.author_corresponding_institution}` : "",
    p.category ? `Category: ${p.category}` : "",
    p.date ? `Posted: ${p.date}` : "",
    `Version: ${p.version ?? "1"}`,
    p.published && p.published !== "NA" ? `Published: ${p.published}` : "Published: not yet",
    "",
    (p.abstract ?? "(no abstract in the record)").replace(/\s+/g, " ").trim(),
  ]
    .filter((line) => line !== "")
    .join("\n")
}
