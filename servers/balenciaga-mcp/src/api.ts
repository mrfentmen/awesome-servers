export class BalenciagaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BalenciagaError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const VENDORS: string[] = ["balenciaga"]
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

function slim(source: string, base: string, p: any, cents = false): Slim {
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

async function getJson(url: string): Promise<any> {
  let res: Response
  try {
    res = await fetch(url, { headers: { ...UA } })
  } catch (e) {
    throw new BalenciagaError(`Network error: ${(e as Error).message}`)
  }
  if (!res.ok) throw new BalenciagaError(`HTTP ${res.status} for ${new URL(url).hostname}`)
  return res.json()
}

async function catalog(source: Source, page: number): Promise<any[]> {
  const data = await getJson(`${source.catalog}?limit=250&page=${page}`)
  const products = Array.isArray(data.products) ? data.products : []
  return products.filter((p: any) => matchesBrand(p.vendor))
}

// Distilled-pages fetch: several catalog pages in parallel, brand-filtered.
async function catalogPages(source: Source, pages: number[]): Promise<any[]> {
  const batches = await Promise.all(pages.map((pg) => catalog(source, pg).catch(() => [] as any[])))
  return batches.flat()
}

// Round-robin sampling across sources and pages: keeps the brand sample
// source-balanced (page 1 alone is often 250 Fashionphile items).
async function sampleCatalog(maxItems: number, pages: number[]): Promise<{ source: Source; p: any }[]> {
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
  if (condition !== undefined && cond === null) throw new BalenciagaError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`)
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
  return pretty({ brand: "Balenciaga", query, count: out.length, condition_filter: cond ?? null, listings: out.slice(0, n) })
}

export async function listNewest(limit?: string, page?: string, productType?: string, maxPrice?: string, condition?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 50)
  const pg = Math.max(Number(page ?? 1) || 1, 1)
  const mp = maxPrice !== undefined ? Number(maxPrice) : undefined
  const cond = condition !== undefined ? normCondition(condition) : undefined
  if (condition !== undefined && cond === null) throw new BalenciagaError(`Unknown condition '${condition}'. Use: ${CONDITIONS.join(", ")}.`)
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
  return pretty({ brand: "Balenciaga", page: pg, count: out.length, listings: out.slice(0, n) })
}

export async function getListing(handle: string, source?: string): Promise<string> {
  const sources = source ? SOURCES.filter((s) => s.name === source) : SOURCES
  if (!sources.length) throw new BalenciagaError(`Unknown source '${source}'. Use fashionphile or rebag.`)
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
        brand: "Balenciaga", ...sl, price_usd: dollar, variants, images,
        description: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500) || null,
        tags: p.tags,
      })
    } catch { /* try next source */ }
  }
  throw new BalenciagaError(`Listing '${handle}' not found on ${sources.map((s) => s.name).join(", ")}.`)
}

export async function priceOverview(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 200) || 200, 500)
  const prices: number[] = []
  const byCondition: Record<string, number[]> = {}
  for (const { source: s, p } of await sampleCatalog(n, [1, 2, 3, 4, 5])) {
    const sl = slim(s.name, s.base, p)
    if (sl.price_usd === null) continue
    prices.push(sl.price_usd)
    const c = sl.condition ?? "unknown"
    if (!byCondition[c]) byCondition[c] = []
    byCondition[c].push(sl.price_usd)
  }
  if (!prices.length) throw new BalenciagaError("No priced listings found.")
  const stats = (arr: number[]) => {
    const a = [...arr].sort((x, y) => x - y)
    const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2
    return { n: a.length, min: a[0], median: mid, max: a[a.length - 1] }
  }
  const condStats: Record<string, unknown> = {}
  for (const [c, arr] of Object.entries(byCondition)) condStats[c] = stats(arr)
  return pretty({
    brand: "Balenciaga", currency: "USD", overall: stats(prices), by_condition: condStats,
    note: "Asking prices on resale sources, not appraisals. Not affiliated with Balenciaga.",
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
  return pretty({ brand: "Balenciaga", query, groups: rows.length, rows: rows.slice(0, 15) })
}

export async function findDeals(limit?: string, sample?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 25)
  const per = Math.min(Number(sample ?? 200) || 200, 500)
  const all: Slim[] = []
  for (const { source: s, p } of await sampleCatalog(per, [1, 2, 3, 4, 5])) {
    const sl = slim(s.name, s.base, p)
    if (sl.price_usd !== null && sl.available) all.push(sl)
  }
  if (!all.length) throw new BalenciagaError("No available priced listings found.")
  const ps = all.map((s) => s.price_usd as number).sort((a, b) => a - b)
  const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2
  const deals = all
    .filter((s) => (s.price_usd as number) < median)
    .map((s) => ({ ...s, vs_median_usd: Math.round(((s.price_usd as number) - median) * 100) / 100, vs_median_pct: Math.round((((s.price_usd as number) - median) / median) * 1000) / 10 }))
    .sort((a, b) => a.vs_median_pct - b.vs_median_pct)
  return pretty({
    brand: "Balenciaga", sample: all.length, brand_median_usd: median, count: Math.min(deals.length, n),
    deals: deals.slice(0, n),
    note: "Below-median asks, not appraisals or authenticity guarantees. Not affiliated with Balenciaga.",
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
    brand: "Balenciaga", catalog_sample: total, by_source: bySource,
    by_product_type: byType, by_condition: byCondition,
    note: "Sample of newest ~500 listings per source. Not affiliated with Balenciaga.",
  })
}
