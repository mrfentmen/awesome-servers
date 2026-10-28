/**
 * textfiles.com client — the archive of BBS-era text files.
 * No API; the site is a plain static file tree with Apache directory
 * listings. We fetch the HTML and parse links. http:// (https has
 * connection issues from some networks, so we pin http).
 */
const BASE = "http://textfiles.com"

export class TextfilesError extends Error {}

export interface TfEntry {
  name: string
  path: string
  size?: string
  isDir: boolean
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "textfiles-mcp/1.0",
      Accept: "text/html,text/plain,*/*",
    },
  })
  if (!res.ok) throw new TextfilesError(`textfiles.com error ${res.status} for ${url}`)
  const buf = await res.arrayBuffer()
  // The archive predates UTF-8; decode as latin-1 to avoid mojibake.
  return new TextDecoder("latin1").decode(buf)
}

const META_PAGES = new Set(["index.html", "filestats.html", "disclaimer.html", "directory.html"])

/** Parse a textfiles directory listing (site's own HTML table markup). */
export function parseListing(html: string): TfEntry[] {
  const out: TfEntry[] = []
  const re = /<A HREF="([^"]+)">([^<]+)<\/A>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const href = m[1]
    const name = (m[2] ?? "").trim()
    if (!href || href.startsWith("/") || href.startsWith("http") || href.includes("mailto")) continue
    if (META_PAGES.has(href.toLowerCase())) continue
    // Subdirectories have no extension (e.g. BIBLIOGRAPHIES); files do (22.txt).
    const isDir = !href.includes(".")
    out.push({ name, path: href, isDir })
  }
  return out
}

/** Extract topic sections from the directory page (directory.html). */
export function parseTopics(html: string): TfEntry[] {
  const out: TfEntry[] = []
  const re = /<A HREF="([^"]+)">([^<]+)<\/A>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const href = m[1]
    const name = (m[2] ?? "").trim()
    if (!href || href.startsWith("/") || href.startsWith("http") || href.includes("mailto")) continue
    if (META_PAGES.has(href.toLowerCase())) continue
    if (href.includes(".")) continue // only section dirs, not meta pages
    out.push({ name, path: href, isDir: true })
  }
  return out
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function listTopics(): Promise<TfEntry[]> {
  const html = await fetchText(`${BASE}/directory.html`)
  return parseTopics(html)
}

export async function listDirectory(dir: string): Promise<TfEntry[]> {
  const clean = dir.replace(/^\/+/, "").replace(/\/+$/, "")
  const url = clean ? `${BASE}/${clean}/` : `${BASE}/`
  const html = await fetchText(url)
  return parseListing(html)
}

export async function readTextFile(path: string, maxChars = 20000): Promise<string> {
  const clean = path.replace(/^\/+/, "")
  const url = clean.startsWith("http") ? clean : `${BASE}/${clean}`
  const raw = await fetchText(url)
  // The archive's files use CRLF; normalize for clean display.
  return raw.replace(/\r\n/g, "\n").slice(0, maxChars)
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatEntry(e: TfEntry, index: number): string {
  const kind = e.isDir ? "[dir]" : "[file]"
  return `${index + 1}. ${kind} ${e.name}${e.size ? ` (${e.size})` : ""}\n   ${BASE}/${e.path}`
}
