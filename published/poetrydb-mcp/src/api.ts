/**
 * PoetryDB — keyless public API client.
 */
const BASE = "https://poetrydb.org"
const SOURCE = "PoetryDB"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "poetrydb-mcp", accept },
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

function render(p: any, lines: number): string {
  const body: string[] = Array.isArray(p?.lines) ? p.lines.slice(0, lines) : []
  return [
    `"${clean(p?.title)}" by ${clean(p?.author)} (${p?.linecount ?? body.length} lines)`,
    ...body.map((l) => `  ${l}`),
  ].join("\n")
}

function check(d: any, what: string): any[] {
  if (d && !Array.isArray(d) && d.status === 404) return []
  const rows: any[] = Array.isArray(d) ? d : []
  if (rows.length) return rows
  throw new SourceError(`PoetryDB returned nothing for ${what}`)
}

export async function poemsByAuthor(a: { author: string; limit?: number }): Promise<string> {
  const author = clean(a.author)
  if (author.length < 2) throw new SourceError("author must be at least 2 characters")
  const limit = a.limit ?? 2
  if (!Number.isInteger(limit) || limit < 1 || limit > 5) throw new SourceError("limit must be between 1 and 5")
  const d = await getJson(`/author/${encodeURIComponent(author)}`)
  const rows = check(d, `author ${author}`)
  return [
    `${rows.length} poem(s) by ${author} (showing ${Math.min(limit, rows.length)}, first 12 lines each):`,
    "",
    ...rows.slice(0, limit).map((p) => render(p, 12)),
  ].join("\n\n")
}

export async function poemsByTitle(a: { title: string; limit?: number }): Promise<string> {
  const title = clean(a.title)
  if (title.length < 2) throw new SourceError("title must be at least 2 characters")
  const limit = a.limit ?? 2
  if (!Number.isInteger(limit) || limit < 1 || limit > 5) throw new SourceError("limit must be between 1 and 5")
  const d = await getJson(`/title/${encodeURIComponent(title)}`)
  const rows = check(d, `title ${title}`)
  return [
    `${rows.length} poem(s) matching "${title}" (showing ${Math.min(limit, rows.length)}):`,
    "",
    ...rows.slice(0, limit).map((p) => render(p, 12)),
  ].join("\n\n")
}

export async function findPoem(a: { author: string; title: string }): Promise<string> {
  const author = clean(a.author)
  const title = clean(a.title)
  if (author.length < 2 || title.length < 2) throw new SourceError("author and title must each be at least 2 characters")
  const d = await getJson(`/author,title/${encodeURIComponent(author)};${encodeURIComponent(title)}`)
  const rows = check(d, `${title} by ${author}`)
  const p = rows[0]
  const body: string[] = Array.isArray(p?.lines) ? p.lines : []
  return [
    `"${clean(p.title)}" by ${clean(p.author)} (${p.linecount ?? body.length} lines)`,
    "",
    ...body,
  ].join("\n")
}

export async function randomPoem(a: { count?: number }): Promise<string> {
  const count = a.count ?? 1
  if (!Number.isInteger(count) || count < 1 || count > 5) throw new SourceError("count must be between 1 and 5")
  const d = await getJson(`/random/${count}`)
  const rows = check(d, `${count} random poem(s)`)
  return [
    `Random pick from PoetryDB (${rows.length} poem(s)):`,
    "",
    ...rows.map((p) => render(p, 14)),
  ].join("\n\n")
}
