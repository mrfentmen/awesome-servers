/**
 * StrategyWiki API client (open MediaWiki instance).
 * Docs: https://www.mediawiki.org/wiki/API
 * StrategyWiki hosts collaborative walkthroughs, FAQs, and cheat codes
 * for thousands of games — the GameFAQs niche, but with an open API.
 * (GameFAQs itself blocks all non-browser clients with a bot wall, so
 * we source the same kind of content here instead.)
 *
 * Be polite: MediaWiki asks for 1 req/s from scripts.
 *
 * Transport note: the site returns 403 to Node's native fetch (TLS
 * fingerprinting), so we shell out to curl, which it accepts.
 */

import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileP = promisify(execFile)
const API = "https://strategywiki.org/w/api.php"
const WIKI = "https://strategywiki.org/wiki"
const UA = "walkthrough-mcp/1.0 (https://github.com/mrfentmen/walkthrough-mcp)"

export class WikiError extends Error {}

let lastRequest = 0

async function curlGet(url: string): Promise<string> {
  // /usr/bin/curl on macOS; plain `curl` elsewhere.
  const binary = process.platform === "darwin" ? "/usr/bin/curl" : "curl"
  const { stdout } = await execFileP(binary, [
    "-s",
    "-m", "25",
    "--compressed",
    "-L",
    "-H", `User-Agent: ${UA}`,
    url,
  ], { maxBuffer: 20 * 1024 * 1024 })
  return stdout
}

async function apiGet(params: Record<string, string>): Promise<any> {
  // ~1.1s throttle between requests (MediaWiki etiquette).
  const wait = 1100 - (Date.now() - lastRequest)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastRequest = Date.now()

  const qs = new URLSearchParams({ format: "json", ...params })
  const body = await curlGet(`${API}?${qs}`)
  let data: any
  try {
    data = JSON.parse(body)
  } catch {
    throw new WikiError(`StrategyWiki returned non-JSON (${body.length} bytes)`)
  }
  if (data.error) {
    throw new WikiError(`StrategyWiki API error: ${data.error.code} — ${data.error.info ?? ""}`)
  }
  return data
}

export interface SearchResult {
  title: string
  pageId: number
  url: string
  snippet: string
}

export async function searchPages(query: string, limit = 10): Promise<SearchResult[]> {
  const data = await apiGet({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: String(limit),
  })
  return (data.query?.search ?? []).map((r: any) => ({
    title: r.title,
    pageId: r.pageid,
    url: `${WIKI}/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
    snippet: stripTags(r.snippet ?? ""),
  }))
}

/** List the subpages of a game page (e.g. "…/Walkthrough", "…/Cheats"). */
export async function getSubpages(title: string): Promise<SearchResult[]> {
  const data = await apiGet({
    action: "query",
    list: "allpages",
    apprefix: `${title}/`,
    aplimit: "50",
  })
  return (data.query?.allpages ?? []).map((r: any) => ({
    title: r.title,
    pageId: r.pageid,
    url: `${WIKI}/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
    snippet: "",
  }))
}

/** Fetch the wikitext of a page, lightly cleaned for LLM consumption. */
export async function getPageWikitext(title: string): Promise<string> {
  const data = await apiGet({
    action: "parse",
    page: title,
    prop: "wikitext",
  })
  const raw = data.parse?.wikitext?.["*"]
  if (!raw) throw new WikiError(`Page "${title}" not found.`)
  return cleanWikitext(raw)
}

function cleanWikitext(raw: string): string {
  let t = raw
  // Drop infobox / template junk (but keep section headers).
  t = t.replace(/\{\{[^{}]*\}\}/gs, "")
  t = t.replace(/\{\{[^{}]*\}\}/gs, "") // twice for nested leftovers
  // Turn links into plain text: [[Target|label]] → label, [[Target]] → Target
  t = t.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2")
  t = t.replace(/\[\[([^\]]*)\]\]/g, "$1")
  // Markdown-ish headers from wiki headers
  t = t.replace(/^={1,6}\s*(.+?)\s*={1,6}\s*$/gm, "## $1")
  // Strip references and categories
  t = t.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
  t = t.replace(/<ref[^/]*\/>/g, "")
  t = t.replace(/\[\[Category:[^\]]*\]\]/g, "")
  t = t.replace(/<[^>]+>/g, "")
  // Collapse blank runs
  t = t.replace(/\n{3,}/g, "\n\n").trim()
  return t || "(page had no parseable text)"
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
}
