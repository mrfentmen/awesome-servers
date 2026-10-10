import TurndownService from "turndown"

export class HtmlMdError extends Error {}

export async function convert(args: { html?: string; max_length?: number }): Promise<string> {
  const html = args.html ?? ""
  if (!html.trim()) throw new HtmlMdError("Provide HTML text")
  const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" })
  let out = td.turndown(html).replace(/\n{3,}/g, "\n\n").trim()
  const max = Math.min(Math.max(args.max_length ?? 8000, 500), 30000)
  if (out.length > max) out = out.slice(0, max) + "\n[...truncated]"
  return out || "(empty result)"
}

// ---- muxC tools:


const UA = "mrfentmen-html-to-markdown-mcp/1.0 (https://github.com/mrfentmen)"

function service(): TurndownService {
  return new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" })
}

/** Turndown walks <style> and <script> bodies as text, so drop them first. */
function stripNonContent(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
}

async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string; type: string }> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new HtmlMdError(`"${url}" is not a valid url; include the scheme, e.g. https://example.com/page`)
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new HtmlMdError("Only http and https urls can be fetched")
  const res = await fetch(parsed.toString(), { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" }, redirect: "follow", signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new HtmlMdError(`${res.status} ${res.statusText} fetching ${parsed.hostname}`)
  const type = res.headers.get("content-type") ?? "not reported"
  if (!/text\/html|application\/xhtml/i.test(type)) throw new HtmlMdError(`${parsed.hostname} answered ${type}, not HTML`)
  return { html: stripNonContent(await res.text()), finalUrl: res.url || parsed.toString(), type }
}

/** Fetch a page over http and convert it to markdown, which saves a copy-paste step. */
export async function convertUrl(args: { url?: string; max_length?: number }): Promise<string> {
  const url = (args.url ?? "").trim()
  if (!url) throw new HtmlMdError("Provide a url to fetch and convert")
  const { html, finalUrl, type } = await fetchHtml(url)
  const max = Math.min(Math.max(args.max_length ?? 12000, 500), 60000)
  const out = service().turndown(html).replace(/\n{3,}/g, "\n\n").trim()
  const body = out.length > max ? out.slice(0, max) + "\n[...truncated]" : out
  return [`Fetched ${finalUrl} (${type}, ${html.length} bytes of HTML)`, "", body || "(the page converted to nothing)"].join("\n")
}

/** Pull every outbound link and image out of a page, grouped by what it points at. */
export async function extractLinks(args: { url?: string; limit?: number }): Promise<string> {
  const url = (args.url ?? "").trim()
  if (!url) throw new HtmlMdError("Provide a url whose links you want listed")
  const limit = Math.max(1, Math.min(args.limit ?? 40, 200))
  const { html, finalUrl } = await fetchHtml(url)
  const base = new URL(finalUrl)
  const links: string[] = []
  const images: string[] = []
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    try {
      links.push(new URL(m[1], base).toString())
    } catch {
      /* skip unparseable hrefs */
    }
  }
  for (const m of html.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    try {
      images.push(new URL(m[1], base).toString())
    } catch {
      /* skip unparseable srcs */
    }
  }
  const uniq = (a: string[]) => [...new Set(a)]
  const internal = uniq(links).filter((l) => new URL(l).hostname === base.hostname)
  const external = uniq(links).filter((l) => new URL(l).hostname !== base.hostname)
  return [
    `Links found on ${finalUrl}`,
    `links: ${uniq(links).length} (${internal.length} internal, ${external.length} external) | images: ${uniq(images).length}`,
    "",
    internal.length ? `internal (${Math.min(limit, internal.length)} shown):\n${internal.slice(0, limit).map((l) => `  ${l}`).join("\n")}` : "internal: none",
    "",
    external.length ? `external (${Math.min(limit, external.length)} shown):\n${external.slice(0, limit).map((l) => `  ${l}`).join("\n")}` : "external: none",
    "",
    uniq(images).length ? `images (${Math.min(limit, uniq(images).length)} shown):\n${uniq(images).slice(0, limit).map((l) => `  ${l}`).join("\n")}` : "images: none",
  ].join("\n")
}
