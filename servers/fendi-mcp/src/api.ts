export class FendiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FendiError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const VENDORS: string[] = ["fendi"]
const CONDITIONS = ["excellent", "great", "very good", "good", "fair"]

interface Source { name: string; catalog: string; suggest: string; product: (handle: string) => string; base: string }

const SOURCES: Source[] = [
  {
    name: "fashionphile",
    catalog: "https://www.fashionphile.com/products.json",
    suggest: "https://www.fashionphile.com/search/suggest.json",
    product: (handle: string) => `https://www.fashionphile.com/products/${encodeURIComponent(handle)}.js`,
    base: "https://www.fashionphile.com/products",
  },
  {
    name: "rebag",
    catalog: "https://shop.rebag.com/products.json",
    suggest: "https://shop.rebag.com/search/suggest.json",
    product: (handle: string) => `https://shop.rebag.com/products/${encodeURIComponent(handle)}.js`,
    base: "https://shop.rebag.com/products",
  },
]

function matchesBrand(vendor: unknown): boolean {
  const v = String(vendor ?? "").toLowerCase()
  return VENDORS.some((s) => v.includes(s))
}

interface Slim {
  source: string; id: number; title: string; handle: string; vendor: string;
  product_type: string; price_usd: number | null; available: boolean; url: string;
  image: string | null; condition: string | null; color: string | null; material: string | null;
  published_at: string | null;
}

function parseCondition(title: unknown, tags: unknown): string | null {
  const t = String(title ?? "")
  const m = t.match(/^(Excellent|Great|Very Good|Good|Fair)\b/i)
  if (m) {
    const c = m[1].toLowerCase()
    return c === "great" ? "great" : c
  }
  if (Array.isArray(tags)) {
    for (const tag of tags) {
      const tm = String(tag).match(/^bc-filter-(Excellent|Great|Very Good|Good|Fair)$/i)
      if (tm) return tm[1].toLowerCase()
    }
  }
  return null
}

function parseTag(tags: unknown, prefix: string): string | null {
  if (!Array.isArray(tags)) return null
  for (const tag of tags) {
    const s = String(tag)
    if (s.toLowerCase().startsWith(prefix)) return s.slice(prefix.length).replace(/‚/g, ",")
  }
  return null
}

function slim(source: string, base: string, p: Product, cents = false): Slim {
  const variants = Array.isArray(p.variants) ? p.variants : []
  const varPrices = variants.map((v: any) => Number(v.price)).filter((n: number) => Number.isFinite(n))
  // Suggest-shaped items carry no variants: fall back to top-level price fields.
  const topPrice = Number(p.price ?? p.price_min)
  const raw = varPrices.length ? varPrices : (Number.isFinite(topPrice) ? [topPrice] : [])
  // /products/{handle}.js quotes money in cents; catalog + suggest quote dollars.
  const prices = cents ? raw.map((x: number) => Math.round(x) / 100) : raw
  const images = Array.isArray(p.images) ? p.images : []
  const tags = Array.isArray(p.tags) ? p.tags : []
  const firstTitle = variants.length ? variants[0].title : ""
  let material = parseTag(tags, "bc-filter-exterior-material-")
  if (!material && tags.some((t: unknown) => String(t).toLowerCase() === "exotic")) material = "exotic"
  return {
    source,
    id: p.id,
    title: p.title,
    handle: p.handle,
    vendor: p.vendor,
    product_type: p.product_type,
    price_usd: prices.length ? Math.min(...prices) : null,
    available: variants.some((v: any) => v.available) || p.available === true,
    url: `${base}/${p.handle}`,
    image: images.length ? (typeof images[0] === "string" ? images[0] : images[0].src ?? null) : null,
    condition: parseCondition(firstTitle, tags),
    color: parseTag(tags, "bc-filter-exterior-color-"),
    material,
    published_at: p.published_at ?? null,
  }
}

function normCondition(c: string): string | null {
  const v = c.trim().toLowerCase()
  return CONDITIONS.includes(v) ? v : null
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

// Upstream Shopify catalog row, as far as this server reads it. Every field is
// read defensively at the call sites; the shape is asserted once, here.
interface Product {
  id: number; title: string; handle: string; vendor: string; product_type: string;
  variants?: { title?: string; price?: string | number; available?: boolean }[];
  price?: string | number; price_min?: string | number;
  images?: (string | { src?: string })[];
  tags?: string[]; available?: boolean; published_at?: string;
  body_html?: string; description?: string;
}

// A catalog row is only usable if it carries the handle the product URL is built
// from and a title to show. Anything else is a malformed upstream row.
function isProduct(x: unknown): x is Product {
  if (typeof x !== "object" || x === null) return false
  const row = x as { handle?: unknown; title?: unknown }
  return typeof row.handle === "string" && typeof row.title === "string"
}

async function getJson(url: string): Promise<any> {
  let res: Response
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA } })
  } catch (e) {
    throw new FendiError(`Network error: ${(e as Error).message}`)
  }
  if (!res.ok) throw new FendiError(`HTTP ${res.status} for ${new URL(url).hostname}`)
  return res.json()
}

async function catalog(source: Source, page: number): Promise<Product[]> {
  const data = await getJson(`${source.catalog}?limit=250&page=${page}`)
  const products: unknown[] = Array.isArray(data.products) ? data.products : []
  return products.filter(isProduct).filter((p) => matchesBrand(p.vendor))
}

// Distilled-pages fetch: several catalog pages in parallel, brand-filtered.
async function catalogPages(source: Source, pages: number[]): Promise<Product[]> {
  const batches = await Promise.all(pages.map((pg) => catalog(source, pg).catch(() => [])))
  return batches.flat()
}

// Round-robin sampling across sources and pages: keeps the brand sample
// source-balanced (page 1 alone is often 250 Fashionphile items).
async function sampleCatalog(maxItems: number, pages: number[]): Promise<{ source: Source; p: Product }[]> {
  const out: { source: Source; p: any }[] = []
  for (const pg of pages) {
    for (const s of SOURCES) {
      if (out.length >= maxItems) break
      try {
        for (const p of await catalog(s, pg)) {
          out.push({ source: s, p })
          if (out.length >= maxItems) break
        }
      } catch { /* source down — keep the other */ }
    }
    if (out.length >= maxItems) break
  }
  return out
}

function passes(s: Slim, maxPrice?: number, condition?: string | null, productType?: string): boolean {
  if (maxPrice !== undefined && (s.price_usd === null || s.price_usd > maxPrice)) return false
  if (condition && s.condition !== condition) return false
  if (productType && !s.product_type.toLowerCase().includes(productType.toLowerCase())) return false
  return true
}

export async function searchListings(query: string, limit?: string, maxPrice?: string, condition?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 25)
  const mp = maxPrice !== undefined ? Number(maxPrice) : undefined
  const cond = condition !== undefined ? normCondition(condition) : undefined
  if (condition !== undefined && cond === null) throw new FendiError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`)
  const out: Slim[] = []
  for (const s of SOURCES) {
    try {
      const data = await getJson(`${s.suggest}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=${n}`)
      const products = data?.resources?.results?.products ?? []
      for (const p of products) {
        if (!matchesBrand(p.vendor)) continue
        // Suggest items carry no variant titles/tags: condition unknown outside Rebag catalog data.
        // When a condition filter is set, only items with a known matching condition pass
        // (Fashionphile suggest hits are omitted — documented limitation).
        const sl = slim(s.name, s.base, p)
        if (cond && sl.condition !== cond) continue
        if (passes(sl, mp, null)) out.push(sl)
        if (out.length >= n) break
      }
    } catch { /* source down — keep the other */ }
    if (out.length >= n) break
  }
  return pretty({ brand: "Fendi", query, returned: out.length, truncated: out.length >= n, condition_filter: cond ?? null, listings: out.slice(0, n) })
}

export async function listNewest(limit?: string, page?: string, productType?: string, maxPrice?: string, condition?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 50)
  const pg = Math.max(Number(page ?? 1) || 1, 1)
  const mp = maxPrice !== undefined ? Number(maxPrice) : undefined
  const cond = condition !== undefined ? normCondition(condition) : undefined
  if (condition !== undefined && cond === null) throw new FendiError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`)
  const out: Slim[] = []
  for (const s of SOURCES) {
    try {
      for (const p of await catalog(s, pg)) {
        const sl = slim(s.name, s.base, p)
        if (passes(sl, mp, cond ?? undefined, productType)) out.push(sl)
      }
    } catch { /* source down — keep the other */ }
  }
  out.sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")))
  return pretty({ brand: "Fendi", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) })
}

export async function getListing(handle: string, source?: string): Promise<string> {
  const sources = source ? SOURCES.filter((s) => s.name === source) : SOURCES
  if (!sources.length) throw new FendiError(`Unknown source '${source}'. Use fashionphile or rebag.`)
  for (const s of sources) {
    try {
      const p = await getJson(s.product(handle))
      const sl = slim(s.name, s.base, p, true)
      const rawVars: any[] = Array.isArray(p.variants) ? p.variants : []
      const variants = rawVars.map((v: any) => ({
        title: v.title, price_usd: Math.round(Number(v.price)) / 100, available: v.available,
        condition: parseCondition(v.title, p.tags),
      }))
      const images = (Array.isArray(p.images) ? p.images : []).map((i: any) => typeof i === "string" ? i : i.src).filter(Boolean)
      const html = typeof p.body_html === "string" ? p.body_html : (typeof p.description === "string" ? p.description : "")
      const dollar = variants.length && Number.isFinite(variants[0].price_usd) ? variants[0].price_usd : sl.price_usd
      return pretty({
        brand: "Fendi", ...sl, price_usd: dollar, variants, images,
        description: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500) || null,
        tags: p.tags,
      })
    } catch { /* try next source */ }
  }
  throw new FendiError(`Listing '${handle}' not found on ${sources.map((s) => s.name).join(", ")}.`)
}

export async function priceOverview(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 200) || 200, 500)
  const prices: number[] = []
  let unpriced = 0
  const byCondition: Record<string, number[]> = {}
  for (const { source: s, p } of await sampleCatalog(n, [1, 2, 3, 4, 5])) {
    const sl = slim(s.name, s.base, p)
    if (sl.price_usd === null || sl.price_usd <= 0) { unpriced += 1; continue }
    prices.push(sl.price_usd)
    const c = sl.condition ?? "unknown"
    if (!byCondition[c]) byCondition[c] = []
    byCondition[c].push(sl.price_usd)
  }
  if (!prices.length) throw new FendiError("No priced listings found.")
  const stats = (arr: number[]) => {
    const a = [...arr].sort((x, y) => x - y)
    const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2
    return { n: a.length, min: a[0], median: mid, max: a[a.length - 1] }
  }
  const condStats: Record<string, unknown> = {}
  for (const [c, arr] of Object.entries(byCondition)) condStats[c] = stats(arr)
  return pretty({
    brand: "Fendi", currency: "USD", unpriced, overall: stats(prices), by_condition: condStats,
    note: "Asking prices on resale sources, not appraisals. Not affiliated with Fendi.",
  })
}

function normTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()
}

export async function comparePrices(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 30) || 30, 60)
  const all: Slim[] = []
  for (const s of SOURCES) {
    try {
      const data = await getJson(`${s.suggest}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=${n}`)
      const products = data?.resources?.results?.products ?? []
      for (const p of products) {
        if (matchesBrand(p.vendor)) all.push(slim(s.name, s.base, p))
      }
    } catch { /* source down — keep the other */ }
  }
  const groups = new Map<string, Slim[]>()
  for (const sl of all) {
    const key = normTitle(sl.title)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(sl)
  }
  const rows = [...groups.entries()].map(([model, items]) => {
    const ps = items.map((i) => i.price_usd).filter((x): x is number => x !== null)
    return {
      model: items[0].title, count: items.length,
      sources: [...new Set(items.map((i) => i.source))],
      min_usd: ps.length ? Math.min(...ps) : null,
      max_usd: ps.length ? Math.max(...ps) : null,
      spread_usd: ps.length > 1 ? Math.max(...ps) - Math.min(...ps) : 0,
      listings: items.map((i) => ({ source: i.source, price_usd: i.price_usd, condition: i.condition, url: i.url })),
    }
  }).sort((a, b) => (b.spread_usd ?? 0) - (a.spread_usd ?? 0))
  return pretty({ brand: "Fendi", query, groups: rows.length, rows: rows.slice(0, 15) })
}

export async function findDeals(limit?: string, sample?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 25)
  const per = Math.min(Number(sample ?? 200) || 200, 500)
  const all: Slim[] = []
  for (const { source: s, p } of await sampleCatalog(per, [1, 2, 3, 4, 5])) {
    const sl = slim(s.name, s.base, p)
    if (sl.price_usd !== null && sl.price_usd > 0 && sl.available) all.push(sl)
  }
  if (!all.length) throw new FendiError("No available priced listings found.")
  const ps = all.map((s) => s.price_usd as number).sort((a, b) => a - b)
  const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2
  const deals = all
    .filter((s) => (s.price_usd as number) < median)
    .map((s) => ({ ...s, vs_median_usd: Math.round(((s.price_usd as number) - median) * 100) / 100, vs_median_pct: Math.round((((s.price_usd as number) - median) / median) * 1000) / 10 }))
    .sort((a, b) => a.vs_median_pct - b.vs_median_pct)
  return pretty({
    brand: "Fendi", sample: all.length, brand_median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
    deals: deals.slice(0, n),
    note: "Below-median asks, not appraisals or authenticity guarantees. Not affiliated with Fendi.",
  })
}

export async function brandOverview(): Promise<string> {
  const bySource: Record<string, number> = {}
  const byType: Record<string, number> = {}
  const byCondition: Record<string, number> = {}
  let total = 0
  for (const s of SOURCES) {
    try {
      const items = await catalogPages(s, [1, 2])
      bySource[s.name] = items.length
      for (const p of items) {
        const sl = slim(s.name, s.base, p)
        total++
        byType[sl.product_type || "unknown"] = (byType[sl.product_type || "unknown"] ?? 0) + 1
        const c = sl.condition ?? "unknown"
        byCondition[c] = (byCondition[c] ?? 0) + 1
      }
    } catch {
      bySource[s.name] = -1
    }
  }
  return pretty({
    brand: "Fendi", catalog_sample: total, by_source: bySource,
    by_product_type: byType, by_condition: byCondition,
    note: "Sample of newest ~500 listings per source. Not affiliated with Fendi.",
  })
}


// --- catalog tools: collections + attribute/size filters ---
function collectionsOrigin(catalogUrl: string): string {
  return new URL(catalogUrl).origin
}

// Curated store collections. store_products is the collection's full size on the
// store, not just this brand's slice - browse_collection returns the brand rows.
export async function listCollections(query?: string): Promise<string> {
  const wanted = query ? query.trim().toLowerCase() : null
  const rows: { source: string; title: string; handle: string; store_products: number | null }[] = []
  for (const s of SOURCES) {
    try {
      const data = await getJson(`${collectionsOrigin(s.catalog)}/collections.json?limit=250`)
      const list: unknown[] = Array.isArray(data.collections) ? data.collections : []
      for (const row of list) {
        const c = row as { title?: unknown; handle?: unknown; products_count?: unknown }
        if (typeof c.title !== "string" || typeof c.handle !== "string") continue
        if (wanted && !c.title.toLowerCase().includes(wanted)) continue
        rows.push({
          source: s.name,
          title: c.title,
          handle: c.handle,
          store_products: typeof c.products_count === "number" ? c.products_count : null,
        })
      }
    } catch { /* source down - keep the other */ }
  }
  return pretty({
    brand: "Fendi", query: query ?? null, returned: rows.length,
    note: "Collection handles feed browse_collection. store_products counts the whole collection.",
    collections: rows.slice(0, 60),
  })
}

export async function browseCollection(handle: string, source?: string, limit?: string, maxPrice?: string, condition?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 25)
  const mp = maxPrice !== undefined ? Number(maxPrice) : undefined
  const cond = condition !== undefined ? normCondition(condition) : undefined
  if (condition !== undefined && cond === null) throw new FendiError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`)
  const sources = source ? SOURCES.filter((s) => s.name === source) : SOURCES
  if (!sources.length) throw new FendiError(`Unknown source '${source}'. Use ${SOURCES.map((s) => s.name).join(" or ")}.`)
  const out: Slim[] = []
  let brandItems = 0
  for (const s of sources) {
    try {
      for (const page of [1, 2, 3]) {
        const data = await getJson(`${collectionsOrigin(s.catalog)}/collections/${encodeURIComponent(handle)}/products.json?limit=250&page=${page}`)
        const products: unknown[] = Array.isArray(data.products) ? data.products : []
        if (!products.length) break
        for (const raw of products) {
          if (!isProduct(raw) || !matchesBrand(raw.vendor)) continue
          brandItems += 1
          const sl = slim(s.name, s.base, raw)
          if (passes(sl, mp, cond ?? undefined)) out.push(sl)
        }
      }
    } catch { /* collection or source missing - keep the other */ }
  }
  if (!brandItems) throw new FendiError(`Collection '${handle}' has no Fendi listings on ${sources.map((s) => s.name).join(", ")}.`)
  out.sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")))
  return pretty({
    brand: "Fendi", collection: handle, brand_items_matched: brandItems,
    returned: Math.min(out.length, n), truncated: out.length > n, listings: out.slice(0, n),
  })
}

export async function find_by_attribute(color?: string, material?: string, condition?: string, maxPrice?: string, limit?: string, sample?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 25)
  const per = Math.min(Number(sample ?? 200) || 200, 500)
  const mp = maxPrice !== undefined ? Number(maxPrice) : undefined
  const cond = condition !== undefined ? normCondition(condition) : undefined
  if (condition !== undefined && cond === null) throw new FendiError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`)
  const wantColor = color ? color.trim().toLowerCase() : null
  const wantMaterial = material ? material.trim().toLowerCase() : null
  if (!wantColor && !wantMaterial && !cond) throw new FendiError("Give at least one of color, material or condition.")
  const all: (Slim & { matched_on: string })[] = []
  const colors: Record<string, number> = {}
  const materials: Record<string, number> = {}
  let tagged = 0
  for (const { source: s, p } of await sampleCatalog(per, [1, 2, 3, 4])) {
    const sl = slim(s.name, s.base, p)
    if (sl.color) { tagged += 1; colors[sl.color] = (colors[sl.color] ?? 0) + 1 }
    if (sl.material) materials[sl.material] = (materials[sl.material] ?? 0) + 1
    if (wantColor && !(sl.color ?? "").toLowerCase().includes(wantColor)) continue
    if (wantMaterial && !(sl.material ?? "").toLowerCase().includes(wantMaterial)) continue
    // Structured tags exist on one source only, so a colour/material also matches the
    // listing title. Which side matched is reported per row (matched_on).
    const colorOnTag = wantColor ? (sl.color ?? "").toLowerCase().includes(wantColor) : false
    const materialOnTag = wantMaterial ? (sl.material ?? "").toLowerCase().includes(wantMaterial) : false
    const hay = `${sl.title} ${sl.vendor} ${sl.product_type}`.toLowerCase()
    if (wantColor && !colorOnTag && !hay.includes(wantColor)) continue
    if (wantMaterial && !materialOnTag && !hay.includes(wantMaterial)) continue
    if (!passes(sl, mp, cond ?? undefined)) continue
    all.push({ ...sl, matched_on: colorOnTag || materialOnTag ? "structured attribute" : "title keyword" })
  }
  const top = (m: Record<string, number>) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }))
  return pretty({
    brand: "Fendi", color: wantColor, material: wantMaterial, condition: cond ?? null,
    sample: per, attributes_known: tagged, top_colors: top(colors), top_materials: top(materials),
    note: "Structured colour/material tags where the source publishes them, listing-title match otherwise.",
    matched: all.length, returned: Math.min(all.length, n), listings: all.slice(0, n).sort((a, b) => (a.price_usd ?? Infinity) - (b.price_usd ?? Infinity)),
  })
}
