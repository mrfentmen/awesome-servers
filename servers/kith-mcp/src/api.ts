export class KithError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "KithError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const CATALOG = "https://kith.com/products.json"
const SUGGEST = "https://kith.com/search/suggest.json"
const PRODUCT_BASE = "https://kith.com/products"

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
    res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA } })
  } catch (e) {
    throw new KithError(`Network error: ${(e as Error).message}`)
  }
  if (!res.ok) throw new KithError(`HTTP ${res.status} for ${new URL(url).hostname}`)
  return res.json()
}

function slim(p: any, cents = false): Slim {
  const variants = Array.isArray(p.variants) ? p.variants : []
  const varPrices = variants.map((v: any) => Number(v.price)).filter((n: number) => Number.isFinite(n))
  const topPrice = Number(p.price ?? p.price_min)
  const raw = varPrices.length ? varPrices : (Number.isFinite(topPrice) ? [topPrice] : [])
  const prices = cents ? raw.map((x: number) => Math.round(x) / 100) : raw
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
  return pretty({ store: "KITH", query, returned: out.length, truncated: out.length >= n, listings: out })
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
  return pretty({ store: "KITH", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) })
}

function parseParts(title: unknown): string[] {
  return String(title ?? "").split("/").map((s) => s.trim()).filter(Boolean)
}

export async function getProduct(handle: string): Promise<string> {
  const p = await getJson(`${PRODUCT_BASE}/${encodeURIComponent(handle)}.js`)
  const sl = slim(p, true)
  const variants = (Array.isArray(p.variants) ? p.variants : []).map((v: any) => ({
    title: v.title, parts: parseParts(v.title),
    price_usd: Math.round(Number(v.price)) / 100,
    compare_at_usd: v.compare_at_price !== null && v.compare_at_price !== undefined ? Math.round(Number(v.compare_at_price)) / 100 : null,
    available: v.available,
  }))
  const images = (Array.isArray(p.images) ? p.images : []).map((i: any) => typeof i === "string" ? i : i.src).filter(Boolean)
  const html = typeof p.body_html === "string" ? p.body_html : (typeof p.description === "string" ? p.description : "")
  const dollar = variants.length && Number.isFinite(variants[0].price_usd) ? variants[0].price_usd : (sl.price_usd !== null ? Math.round(sl.price_usd) / 100 : null)
  return pretty({
    store: "KITH", ...sl, price_usd: dollar, variants, images,
    description: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500) || null,
    tags: p.tags,
  })
}

export async function priceOverview(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 200) || 200, 500)
  const prices: number[] = []
  let unpriced = 0
  for (const p of await sampleCatalog(n, [1, 2, 3])) {
    const sl = slim(p)
    if (sl.price_usd === null || sl.price_usd <= 0) unpriced += 1
    else prices.push(sl.price_usd)
  }
  if (!prices.length) throw new KithError("No priced products found.")
  const a = [...prices].sort((x, y) => x - y)
  const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2
  return pretty({
    store: "KITH", currency: "USD", unpriced, sample: a.length,
    min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
    p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
    note: "Storefront asking prices. Not affiliated with KITH.",
  })
}

export async function findDeals(limit?: string, sample?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 25)
  const per = Math.min(Number(sample ?? 200) || 200, 500)
  const all: Slim[] = []
  for (const p of await sampleCatalog(per, [1, 2, 3])) {
    const sl = slim(p)
    if (sl.price_usd !== null && sl.price_usd > 0 && sl.available) all.push(sl)
  }
  if (!all.length) throw new KithError("No available priced products found.")
  const ps = all.map((s) => s.price_usd as number).sort((a, b) => a - b)
  const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2
  const deals = all
    .filter((s) => (s.price_usd as number) < median)
    .map((s) => ({ ...s, vs_median_usd: Math.round(((s.price_usd as number) - median) * 100) / 100, vs_median_pct: Math.round((((s.price_usd as number) - median) / median) * 1000) / 10 }))
    .sort((a, b) => a.vs_median_pct - b.vs_median_pct)
  return pretty({
    store: "KITH", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
    deals: deals.slice(0, n),
    note: "Below-median asks, not appraisals. Not affiliated with KITH.",
  })
}

export async function listCategories(): Promise<string> {
  const counts: Record<string, number> = {}
  for (const p of await sampleCatalog(500, [1, 2])) {
    const t = p.product_type || "unknown"
    counts[t] = (counts[t] ?? 0) + 1
  }
  return pretty({ store: "KITH", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts })
}


// --- catalog tools: collections + attribute/size filters ---
function collectionsOrigin(): string {
  return new URL(CATALOG).origin
}

export async function listCollections(query?: string): Promise<string> {
  const wanted = query ? query.trim().toLowerCase() : null
  const rows: { title: string; handle: string; store_products: number | null }[] = []
  const data = await getJson(`${collectionsOrigin()}/collections.json?limit=250`)
  const list: unknown[] = Array.isArray(data.collections) ? data.collections : []
  for (const row of list) {
    const c = row as { title?: unknown; handle?: unknown; products_count?: unknown }
    if (typeof c.title !== "string" || typeof c.handle !== "string") continue
    if (wanted && !c.title.toLowerCase().includes(wanted)) continue
    rows.push({ title: c.title, handle: c.handle, store_products: typeof c.products_count === "number" ? c.products_count : null })
  }
  return pretty({
    store: "KITH", query: query ?? null, returned: rows.length,
    note: "Collection handles feed browse_collection.",
    collections: rows.slice(0, 60),
  })
}

export async function browseCollection(handle: string, limit?: string, maxPrice?: string, size?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 25)
  const mp = maxPrice !== undefined ? Number(maxPrice) : undefined
  const wantSize = size ? String(size).trim().toLowerCase() : null
  const out: Slim[] = []
  let seen = 0
  for (const page of [1, 2, 3]) {
    const data = await getJson(`${collectionsOrigin()}/collections/${encodeURIComponent(handle)}/products.json?limit=250&page=${page}`)
    const products: any[] = Array.isArray(data.products) ? data.products : []
    if (!products.length) break
    for (const p of products) {
      seen += 1
      if (wantSize) {
        const variants: any[] = Array.isArray(p.variants) ? p.variants : []
        const hit = variants.some((v) => v.available === true && parseParts(v.title).some((part) => part.toLowerCase() === wantSize))
        if (!hit) continue
      }
      const sl = slim(p)
      if (mp !== undefined && (sl.price_usd === null || sl.price_usd > mp)) continue
      out.push(sl)
    }
  }
  if (!seen) throw new KithError(`Collection '${handle}' returned no products. Check the handle with list_collections.`)
  return pretty({
    store: "KITH", collection: handle, size: wantSize, scanned: seen,
    returned: Math.min(out.length, n), truncated: out.length > n, listings: out.slice(0, n),
  })
}

export async function find_by_size(size: string, limit?: string, maxPrice?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 25)
  const mp = maxPrice !== undefined ? Number(maxPrice) : undefined
  const want = String(size).trim().toLowerCase()
  const sample = await sampleCatalog(300, [1, 2, 3])
  const out: any[] = []
  const sizesSeen = new Set<string>()
  for (const p of sample) {
    const variants: any[] = Array.isArray(p.variants) ? p.variants : []
    for (const v of variants) for (const part of parseParts(v.title)) sizesSeen.add(part)
    const hit = variants.find((v) => v.available === true && (String(v.title ?? "").trim().toLowerCase() === want || parseParts(v.title).some((part) => part.toLowerCase() === want)))
    if (!hit) continue
    const sl: any = slim(p)
    if (mp !== undefined && (sl.price_usd === null || sl.price_usd > mp)) continue
    sl.matched_size = String(hit.title)
    sl.size_price_usd = Number.isFinite(Number(hit.price)) ? Math.round(Number(hit.price) * 100) / 100 : null
    sl.in_stock_sizes = variants.filter((v) => v.available === true).map((v) => String(v.title))
    out.push(sl)
  }
  if (!out.length) {
    const seen = [...sizesSeen].slice(0, 40).join(", ")
    throw new KithError(`No in-stock variant matched size '${size}' in a ${sample.length}-product sample. Sizes seen: ${seen || "none"}.`)
  }
  return pretty({
    store: "KITH", size: want, scanned: sample.length,
    returned: Math.min(out.length, n), listings: out.slice(0, n),
    note: "Availability and size come from the store's own variant stock flags.",
  })
}

// ---- muxG tools:
const KITH_PAGES = [1, 2, 3, 4]

interface KithAxis {
  name: string;
  values: number;
  inStock: number;
  prices: number[];
}

const kithMedian = (values: number[]): number | null => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

/**
 * A size run: for every option axis the store sells on, how many sizes exist, how
 * many are actually buyable right now, and the price each in-stock size carries.
 * The product tools only ever print the first variant.
 */
export async function sizeRunMatrix(args: { sample?: string; limit?: string; axis?: string }): Promise<string> {
  const max = Math.min(Math.max(Number(args.sample ?? 300) || 300, 20), 1500);
  const n = Math.min(Math.max(Number(args.limit ?? 12) || 12, 1), 40);
  const wanted = String(args.axis ?? "").trim().toLowerCase();
  const pages = KITH_PAGES.slice(0, Math.max(1, Math.ceil(max / 250)));
  const products = await sampleCatalog(max, pages);
  if (!products.length) throw new Error("The KITH catalog returned no products.");

  const axes = new Map<string, KithAxis>();
  const typeTotals = new Map<string, { count: number; sizes: number }>();
  let variantsSeen = 0;
  let inStockSeen = 0;

  for (const product of products) {
    const type = String(product.product_type ?? "type not reported") || "type not reported";
    const options = Array.isArray(product.options) ? product.options : [];
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const sizeValues = options.flatMap((option: any) => (Array.isArray(option.values) ? option.values.map(String) : []));
    const entry = typeTotals.get(type) ?? { count: 0, sizes: 0 };
    entry.count += 1;
    entry.sizes += sizeValues.length;
    typeTotals.set(type, entry);

    for (const [position, option] of options.entries()) {
      const name = String(option?.name ?? `option ${position + 1}`);
      const values = Array.isArray(option?.values) ? option.values.map(String) : [];
      const axis = axes.get(name) ?? { name, values: 0, inStock: 0, prices: [] };
      for (const value of values) {
        axis.values += 1;
        for (const variant of variants) {
          const parts = String(variant?.title ?? "").split("/").map((part: string) => part.trim());
          if (parts[position] !== value) continue;
          variantsSeen += 1;
          if (variant?.available === true) {
            axis.inStock += 1;
            inStockSeen += 1;
            const price = Math.round(Number(variant.price));
            if (Number.isFinite(price) && price > 0) axis.prices.push(price);
          }
          break;
        }
      }
      axes.set(name, axis);
    }
  }

  const ordered = Array.from(axes.values()).sort((a, b) => b.values - a.values);
  const chosen = wanted ? ordered.filter((axis) => axis.name.toLowerCase().includes(wanted)) : ordered;
  if (!chosen.length) {
    return `No option axis matches "${args.axis}". This store uses: ${ordered.map((axis) => axis.name).join(", ") || "none"}.`;
  }

  const lines = [
    `Size run across ${products.length} sampled KITH product(s): ${variantsSeen} size variant(s) matched, ${inStockSeen} of them buyable right now`,
    `Product types in the sample: ${Array.from(typeTotals.entries()).sort((a, b) => b[1].sizes - a[1].sizes).slice(0, 8).map(([type, entry]) => `${type} (${entry.count} product(s), ${entry.sizes} size variant(s))`).join(", ")}`,
    "",
  ];
  for (const axis of chosen) {
    const median = kithMedian(axis.prices);
    const coverage = axis.values ? ((axis.inStock / axis.values) * 100).toFixed(1) : "0.0";
    lines.push(
      `${axis.name}: ${axis.values} size variant(s) published, ${axis.inStock} in stock (${coverage}% coverage) · median in-stock price ${median === null ? "not reported" : `$${median.toLocaleString("en-US")}`}`,
    );
  }
  return lines.join("\n");
}

const asText = (value: unknown): string => String(value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** Which collaborations the shop is actually carrying, counted from the live catalog titles. */
export async function collaborationCensus(args: { sample?: string; limit?: string }): Promise<string> {
  const max = Math.min(Math.max(Number(args.sample ?? 300) || 300, 20), 1500);
  const n = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 40);
  const pages = KITH_PAGES.slice(0, Math.max(1, Math.ceil(max / 250)));
  const products = await sampleCatalog(max, pages);
  if (!products.length) throw new Error("The KITH catalog returned no products.");

  // KITH titles follow "Collab for Brand ..." or "Brand for KITH ..."
  const partners = new Map<string, { products: number; sizes: number; prices: number[]; example: string }>();
  let matched = 0;
  for (const product of products) {
    const title = asText(product.title);
    // only look before the first colour dash, so "That's All Tee - Kindling" is not read
    const head = title.split(" - ")[0];
    const match = /^(?:(.+?)\s+for\s+(?:KITH|ASICS)|(.+?)\s+for\s+ASICS)(?:\s|$)/i.exec(head)
      ?? /for\s+([A-Z][A-Za-z0-9&.'-]{1,24})\s/i.exec(head);
    const partner = (match?.[1] ?? match?.[2] ?? "").trim();
    const stop = new Set(["THE", "ALL", "NEW", "RELEASE", "KITH", "ASICS", "US", "AND", "OUR", "IT"]);
    if (!partner || stop.has(partner.toUpperCase())) continue;
    matched += 1;
    const key = partner.toUpperCase();
    const entry = partners.get(key) ?? { products: 0, sizes: 0, prices: [], example: title };
    entry.products += 1;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    entry.sizes += variants.length;
    const price = Math.round(Number(variants[0]?.price));
    if (Number.isFinite(price) && price > 0) entry.prices.push(price);
    partners.set(key, entry);
  }
  if (!partners.size) throw new Error(`No collaboration name could be read out of ${products.length} KITH product titles.`);
  const ranked = [...partners.entries()].sort((a, b) => b[1].products - a[1].products);
  const lines = [
    `Collaboration census from ${products.length} sampled KITH product(s): ${matched} title(s) named a partner, ${partners.size} distinct partner(s)`,
    "",
  ];
  for (const [partner, entry] of ranked.slice(0, n)) {
    const median = kithMedian(entry.prices);
    lines.push(
      `  ${partner}: ${entry.products} product(s), ${entry.sizes} size variant(s) · from ${median === null ? "price not reported" : `$${median.toLocaleString("en-US")}`} · e.g. ${entry.example.slice(0, 70)}`,
    );
  }
  if (ranked.length > n) lines.push(`  ...and ${ranked.length - n} further partner name(s).`);
  lines.push("");
  lines.push("Partner names are read from product titles with a loose pattern; treat a stray word as a false positive.");
  return lines.join("\n");
}
