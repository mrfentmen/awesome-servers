const BASE = "https://the-one-api.dev/v2"
const UA = "mrfentmen-lotr-mcp/1.0 (https://github.com/mrfentmen)"
export class LotrError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new LotrError(`The One API returned HTTP ${res.status}`)
  return (await res.json()) as T
}

export async function books(_args?: unknown): Promise<string> {
  const d = await get<any>(`${BASE}/book`)
  const docs = (d?.docs ?? []) as any[]
  if (!docs.length) return "No books found"
  return "Lord of the Rings books:\n" + docs.map((b: any, i: number) => `${i + 1}. ${b?.name ?? "n/a"} (id ${b?._id ?? ""})`).join("\n")
}

export async function chapters(args: { bookId?: string }): Promise<string> {
  const id = (args.bookId ?? "").trim()
  if (!id) throw new LotrError("Provide a book ID")
  const d = await get<any>(`${BASE}/book/${encodeURIComponent(id)}/chapter`)
  const docs = (d?.docs ?? []) as any[]
  if (!docs.length) return `No chapters found for book ${id}`
  return `Chapters (${docs.length} total, first 30 shown):\n` + docs.slice(0, 30).map((c: any, i: number) => `${i + 1}. ${c?.chapterName ?? "n/a"}`).join("\n")
}

// ---- muxB tools:

// wikitext -> readable lead, the same way the rest of this repo strips wikitext
function tgPlain(wt: string, maxChars: number): string {
  // infoboxes nest their arguments, so peel templates until none are left
  let text = wt
  for (let pass = 0; pass < 12 && text.includes('{{'); pass++) {
    const before = text
    text = text.replace(/\{\{[^{}]*\}\}/g, '')
    if (text === before) break
  }
  return text
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/^\s*[=*#:;]+/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .slice(0, maxChars)
}

export interface GatewayPageArgs {
  title?: string
  maxChars?: number
}

export interface GatewayCategoriesArgs {
  title?: string
  limit?: number
}

