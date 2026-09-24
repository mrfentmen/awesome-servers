export class IceboxError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "IceboxError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const CATALOG = "https://icebox.com/products.json"
const SUGGEST = "https://icebox.com/search/suggest.json"
const PRODUCT_BASE = "https://icebox.com/products"

interface Slim {
  id: number; title: string; handle: string; vendor: string; product_type: string;
  price_usd: number | null; available: boolean; url: string; image: string | null;
  published_at: string | null;
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
    throw new IceboxError(`Network error: ${(e as Error).message}`)
  }
  if (!res.ok) throw new IceboxError(`HTTP ${res.status} for ${new URL(url).hostname}`)
  return res.json()
}

function slim(p: any): Slim {
  const variants = Array.isArray(p.variants) ? p.variants : []
  const varPrices = variants.map((v: any) => Number(v.price)).filter((n: number) => Number.isFinite(n))
  const topPrice = Number(p.price ?? p.price_min)
  const prices = varPrices.length ? varPrices : (Number.isFinite(topPrice) ? [topPrice] : [])
  const images = Array.isArray(p.images) ? p.images : []
  const img0 = images.length ? images[0] : null
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    vendor: p.vendor,
    product_type: p.product_type,
    price_usd: prices.length ? Math.min(...prices) : null,
    available: variants.some((v: any) => v.available) || p.available === true,
    url: `${PRODUCT_BASE}/${p.handle}`,
    image: typeof img0 === "string" ? img0 : (img0?.src ?? null),
    published_at: p.published_at ?? null,
  }
}

function passes(s: Slim, maxPrice?: number, productType?: string): boolean {
  if (maxPrice !== undefined && (s.price_usd === null || s.price_usd > maxPrice)) return false
  if (productType && !s.product_type.toLowerCase().includes(productType.toLowerCase())) return false
  return true
}

async function catalogPage(page: number): Promise<any[]> {
  const data = await getJson(`${CATALOG}?limit=250&page=${page}`)
  return Array.isArray(data.products) ? data.products : []
}

async function sampleCatalog(maxItems: number, pages: number[]): Promise<any[]> {
  const out: any[] = []
  for (const pg of pages) {
    if (out.length >= maxItems) break
    try {
      for (const p of await catalogPage(pg)) {
        out.push(p)
        if (out.length >= maxItems) break
      }
    } catch { /* page failed — keep what we have */ }
  }
  return out
}

export async function searchProducts(query: string, limit?: string, maxPrice?: string, productType?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 25)
  const mp = maxPrice !== undefined ? Number(maxPrice) : undefined
  const data = await getJson(`${SUGGEST}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=${n}`)
  const products = data?.resources?.results?.products ?? []
  const out: Slim[] = []
  for (const p of products) {
    const sl = slim(p)
    if (passes(sl, mp, productType)) out.push(sl)
    if (out.length >= n) break
  }
  return pretty({ store: "Icebox", query, count: out.length, listings: out })
}

export async function listNewest(limit?: string, page?: string, productType?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 50)
  const pg = Math.max(Number(page ?? 1) || 1, 1)
  const out: Slim[] = []
  for (const p of await catalogPage(pg)) {
    const sl = slim(p)
    if (sl.product_type && (!productType || sl.product_type.toLowerCase().includes(productType.toLowerCase()))) out.push(sl)
  }
  out.sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")))
  return pretty({ store: "Icebox", page: pg, count: out.length, listings: out.slice(0, n) })
}

function parseParts(title: unknown): string[] {
  return String(title ?? "").split("/").map((s) => s.trim()).filter(Boolean)
}

export async function getProduct(handle: string): Promise<string> {
  const p = await getJson(`${PRODUCT_BASE}/${encodeURIComponent(handle)}.js`)
  const sl = slim(p)
  // .js detail quotes money in cents; catalog/suggest quote dollars.
  const variants = (Array.isArray(p.variants) ? p.variants : []).map((v: any) => ({
    title: v.title, parts: parseParts(v.title),
    price_usd: Math.round(Number(v.price)) / 100, compare_at_usd: v.compare_at_price !== null && v.compare_at_price !== undefined ? Math.round(Number(v.compare_at_price)) / 100 : null,
    available: v.available,
  }))
  const images = (Array.isArray(p.images) ? p.images : []).map((i: any) => typeof i === "string" ? i : i.src).filter(Boolean)
  const html = typeof p.body_html === "string" ? p.body_html : (typeof p.description === "string" ? p.description : "")
  const dollar = variants.length && Number.isFinite(variants[0].price_usd) ? variants[0].price_usd : (sl.price_usd !== null ? Math.round(sl.price_usd) / 100 : null)
  return pretty({
    store: "Icebox", ...sl, price_usd: dollar, variants, images,
    description: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500) || null,
    tags: p.tags,
  })
}

export async function priceOverview(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 200) || 200, 500)
  const prices: number[] = []
  for (const p of await sampleCatalog(n, [1, 2, 3])) {
    const sl = slim(p)
    if (sl.price_usd !== null) prices.push(sl.price_usd)
  }
  if (!prices.length) throw new IceboxError("No priced products found.")
  const a = [...prices].sort((x, y) => x - y)
  const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2
  return pretty({
    store: "Icebox", currency: "USD", sample: a.length,
    min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
    p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
    note: "Storefront asking prices. Not affiliated with Icebox.",
  })
}

export async function findDeals(limit?: string, sample?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 25)
  const per = Math.min(Number(sample ?? 200) || 200, 500)
  const all: Slim[] = []
  for (const p of await sampleCatalog(per, [1, 2, 3])) {
    const sl = slim(p)
    if (sl.price_usd !== null && sl.available) all.push(sl)
  }
  if (!all.length) throw new IceboxError("No available priced products found.")
  const ps = all.map((s) => s.price_usd as number).sort((a, b) => a - b)
  const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2
  const deals = all
    .filter((s) => (s.price_usd as number) < median)
    .map((s) => ({ ...s, vs_median_usd: Math.round(((s.price_usd as number) - median) * 100) / 100, vs_median_pct: Math.round((((s.price_usd as number) - median) / median) * 1000) / 10 }))
    .sort((a, b) => a.vs_median_pct - b.vs_median_pct)
  return pretty({
    store: "Icebox", sample: all.length, median_usd: median, count: Math.min(deals.length, n),
    deals: deals.slice(0, n),
    note: "Below-median asks, not appraisals. Not affiliated with Icebox.",
  })
}

export async function listCategories(): Promise<string> {
  const counts: Record<string, number> = {}
  for (const p of await sampleCatalog(500, [1, 2])) {
    const t = p.product_type || "unknown"
    counts[t] = (counts[t] ?? 0) + 1
  }
  return pretty({ store: "Icebox", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts })
}
