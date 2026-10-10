const BASE = "https://poetrydb.org"
const UA = "mrfentmen-poetry-mcp/1.0 (https://github.com/mrfentmen)"
export class PoetryError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new PoetryError("PoetryDB rate limit hit, wait and retry")
  if (!res.ok) throw new PoetryError(`PoetryDB error ${res.status}`)
  return (await res.json()) as T
}

function fmtPoem(p: any): string {
  const lines = Array.isArray(p?.lines) ? p.lines : []
  const text = lines.slice(0, 24).join("\n")
  return `# ${p.title ?? "Untitled"} by ${p.author ?? "unknown"}\n\n${text}${lines.length > 24 ? `\n... (${lines.length - 24} more lines)` : ""}`
}

export async function searchTitles(args: { title?: string; limit?: number }): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) throw new PoetryError("Provide a poem title")
  const limit = Math.min(args.limit ?? 3, 5)
  const d = await get<any>(`${BASE}/title/${encodeURIComponent(title)}`)
  const arr = Array.isArray(d) ? d : [d]
  if (!arr.length || (arr.length === 1 && arr[0]?.status === 404)) return "No poem found"
  return arr.slice(0, limit).map(fmtPoem).join("\n\n---\n\n")
}

export async function byAuthor(args: { author?: string; limit?: number }): Promise<string> {
  const author = (args.author ?? "").trim()
  if (!author) throw new PoetryError("Provide an author name")
  const limit = Math.min(args.limit ?? 10, 25)
  const d = await get<any>(`${BASE}/author/${encodeURIComponent(author)}/title`)
  const arr = Array.isArray(d) ? d : [d]
  if (!arr.length || (arr.length === 1 && arr[0]?.status === 404)) return "No poems by this author"
  return arr.slice(0, limit).map((p: any, i: number) => `${i + 1}. ${p.title}`).join("\n")
}

export async function randomPoem(args: Record<string, never>): Promise<string> {
  const d = await get<any>(`${BASE}/random`)
  const arr = Array.isArray(d) ? d : [d]
  return fmtPoem(arr[0] ?? {})
}

// ---- muxB tools:

