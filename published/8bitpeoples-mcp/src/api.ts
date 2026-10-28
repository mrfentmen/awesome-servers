/**
 * 8bitpeoples client. The legendary free chiptune record label, running
 * since 1999. The storefront is a custom shop (not Shopify), so the
 * catalog lives at /categories/digital-discography (paginated) and each
 * release has a /products/<id>-<slug> page with full metadata.
 */
const BASE = "https://www.8bitpeoples.com"

export class BitError extends Error {}

export interface Release {
  slug: string
  title: string
  description?: string
  url: string
}

async function fetchText(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "8bitpeoples-mcp/1.0", Accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new BitError(`8bitpeoples error ${res.status} for ${path}`)
  return res.text()
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

/** '520414-sievert-chips-dips-and-facerips' -> 'Sievert: Chips, Dips and Facerips' */
export function titleFromSlug(slug: string): string {
  const base = (slug.split("/").pop() ?? slug).replace(/^\d+-/, "")
  return base
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
}

/** Strip tags, decode nbsp entities, collapse whitespace. */
function cleanText(s: string): string {
  return stripTags(s)
    .replace(/&nbsp;/gi, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** The info anchors look like: 8BP142<br> Random: Arpeggio Springs. */
export function parseListing(html: string): Release[] {
  const out: Release[] = []
  const re = /<a[^>]*class="[^"]*info[^"]*"[^>]*href="(\/products\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const slug = m[1]
    if (out.some((r) => r.slug === slug)) continue
    const text = cleanText(m[2])
    const title = text.replace(/^8BP\d+\s*/, "").trim() || titleFromSlug(slug)
    out.push({ slug, title, url: `${BASE}${slug}` })
  }
  return out
}

export async function listReleases(page = 1): Promise<Release[]> {
  const html = await fetchText(`/categories/digital-discography?page=${page}`)
  const releases = parseListing(html)
  if (releases.length === 0 && page === 1) {
    // Fall back to the homepage which lists the newest releases.
    return parseListing(await fetchText("/"))
  }
  return releases
}

export async function getRelease(slug: string): Promise<Release | null> {
  const clean = slug.startsWith("/products/") ? slug : `/products/${slug}`
  const html = await fetchText(clean)
  const title =
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ??
    html.match(/property="og:title" content="([^"]+)"/i)?.[1] ??
    html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ??
    titleFromSlug(clean)
  const desc =
    html.match(/<meta name="description" content="([^"]+)"/i)?.[1] ??
    html.match(/property="og:description" content="([^"]+)"/i)?.[1]
  return {
    slug: clean,
    title: stripTags(title),
    description: desc ? stripTags(desc).slice(0, 400) : undefined,
    url: `${BASE}${clean}`,
  }
}

export function formatRelease(r: Release, index?: number): string {
  const lines = [
    `${index !== undefined ? `${index + 1}. ` : ""}${r.title}`,
    r.description ? r.description : "Free digital release",
    r.url,
  ].filter(Boolean)
  return lines.join("\n")
}
