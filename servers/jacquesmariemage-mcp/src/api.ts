export class StoreError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StoreError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const CATALOG = "https://jacquesmariemage.com/products.json";
const SUGGEST = "https://jacquesmariemage.com/search/suggest.json";
const PRODUCT_BASE = "https://jacquesmariemage.com/products";

interface Slim {
  id: number; title: string; handle: string; vendor: string; product_type: string;
  price_usd: number | null; available: boolean; url: string; image: string | null;
  published_at: string | null;
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function getJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA } });
  } catch (e) {
    throw new StoreError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) throw new StoreError(`HTTP ${res.status} for ${new URL(url).hostname}`);
  return res.json();
}

function slim(p: Record<string, unknown>, cents = false): Slim {
  const variants = (Array.isArray(p.variants) ? p.variants : []) as Record<string, unknown>[];
  const varPrices = variants.map((v) => Number(v.price)).filter((n) => Number.isFinite(n));
  const topPrice = Number((p as Record<string, unknown>).price ?? (p as Record<string, unknown>).price_min);
  const raw = varPrices.length ? varPrices : (Number.isFinite(topPrice) ? [topPrice] : []);
  const prices = cents ? raw.map((x) => Math.round(x) / 100) : raw;
  const images = (Array.isArray(p.images) ? p.images : []) as Record<string, unknown>[];
  const img0 = images.length ? images[0] : null;
  const imgSrc = typeof img0 === "string" ? img0 : ((img0 as Record<string, unknown> | null)?.src as string | undefined ?? null);
  return {
    id: p.id as number,
    title: String(p.title ?? ""),
    handle: String(p.handle ?? ""),
    vendor: String(p.vendor ?? ""),
    product_type: String(p.product_type ?? ""),
    price_usd: prices.length ? Math.min(...prices) : null,
    available: variants.some((v) => v.available) || p.available === true,
    url: `${PRODUCT_BASE}/${String(p.handle ?? "")}`,
    image: imgSrc,
    published_at: (p.published_at as string | undefined) ?? null,
  };
}

function passes(s: Slim, maxPrice?: number, productType?: string): boolean {
  if (maxPrice !== undefined && (s.price_usd === null || s.price_usd > maxPrice)) return false;
  if (productType && !s.product_type.toLowerCase().includes(productType.toLowerCase())) return false;
  return true;
}

async function catalogPage(page: number): Promise<Record<string, unknown>[]> {
  const data = await getJson(`${CATALOG}?limit=250&page=${page}`) as { products?: Record<string, unknown>[] };
  return Array.isArray(data.products) ? data.products : [];
}

async function sampleCatalog(maxItems: number, pages: number[]): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  for (const pg of pages) {
    if (out.length >= maxItems) break;
    try {
      for (const p of await catalogPage(pg)) {
        out.push(p);
        if (out.length >= maxItems) break;
      }
    } catch { /* page failed */
    }
  }
  return out;
}

function parseParts(title: unknown): string[] {
  return String(title ?? "").split("/").map((s) => s.trim()).filter(Boolean);
}

export function searchProducts(query: string, limit?: string, maxPrice?: string, productType?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 25);
  const mp = maxPrice !== undefined ? Number(maxPrice) : undefined;
  return getJson(`${SUGGEST}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=${n}`).then((data: unknown) => {
    const d = data as { resources?: { results?: { products?: Record<string, unknown>[] } } };
    const products = d?.resources?.results?.products ?? [];
    const out: Slim[] = [];
    for (const p of products) {
      const sl = slim(p);
      if (passes(sl, mp, productType)) out.push(sl);
      if (out.length >= n) break;
    }
    return pretty({ store: "Jacques Marie Mage", query, returned: out.length, truncated: out.length >= n, listings: out });
  });
}

export function listNewest(limit?: string, page?: string, productType?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 50);
  const pg = Math.max(Number(page ?? 1) || 1, 1);
  return catalogPage(pg).then((products) => {
    const out: Slim[] = [];
    for (const p of products) {
      const sl = slim(p);
      if (sl.product_type && (!productType || sl.product_type.toLowerCase().includes(productType.toLowerCase()))) out.push(sl);
    }
    out.sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")));
    return pretty({ store: "Jacques Marie Mage", page: pg, matched_on_page: out.length, returned: Math.min(out.length, n), listings: out.slice(0, n) });
  });
}

export function getProduct(handle: string): Promise<string> {
  return getJson(`${PRODUCT_BASE}/${encodeURIComponent(handle)}.js`).then((p: unknown) => {
    const prod = p as Record<string, unknown>;
    const sl = slim(prod, true);
    const variants = ((Array.isArray(prod.variants) ? prod.variants : []) as Record<string, unknown>[]).map((v) => ({
      title: v.title, parts: parseParts(v.title),
      price_usd: Math.round(Number(v.price)) / 100,
      compare_at_usd: v.compare_at_price !== null && v.compare_at_price !== undefined ? Math.round(Number(v.compare_at_price)) / 100 : null,
      available: v.available,
    }));
    const images = ((Array.isArray(prod.images) ? prod.images : []) as Record<string, unknown>[]).map((i) => typeof i === "string" ? i : i.src).filter(Boolean);
    const html = typeof prod.body_html === "string" ? prod.body_html : (typeof prod.description === "string" ? prod.description : "");
    const dollar = variants.length && Number.isFinite(variants[0].price_usd) ? variants[0].price_usd : (sl.price_usd !== null ? Math.round(sl.price_usd) / 100 : null);
    return pretty({
      store: "Jacques Marie Mage", ...sl, price_usd: dollar, variants, images,
      description: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500) || null,
      tags: prod.tags,
    });
  });
}

export function priceOverview(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 200) || 200, 500);
  return sampleCatalog(n, [1, 2, 3]).then((products) => {
    const prices: number[] = [];
    let unpriced = 0;
    for (const p of products) {
      const sl = slim(p);
      if (sl.price_usd === null || sl.price_usd <= 0) unpriced += 1;
      else prices.push(sl.price_usd);
    }
    if (!prices.length) throw new StoreError("No priced products found.");
    const a = [...prices].sort((x, y) => x - y);
    const mid = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
    return pretty({
      store: "Jacques Marie Mage", currency: "USD", unpriced, sample: a.length,
      min: a[0], p25: a[Math.floor(a.length * 0.25)], median: mid,
      p75: a[Math.floor(a.length * 0.75)], max: a[a.length - 1],
      note: "Storefront asking prices. Not affiliated with Jacques Marie Mage.",
    });
  });
}

export function findDeals(limit?: string, sample?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 25);
  const per = Math.min(Number(sample ?? 200) || 200, 500);
  return sampleCatalog(per, [1, 2, 3]).then((products) => {
    const all: Slim[] = [];
    for (const p of products) {
      const sl = slim(p);
      if (sl.price_usd !== null && sl.price_usd > 0 && sl.available) all.push(sl);
    }
    if (!all.length) throw new StoreError("No available priced products found.");
    const ps = all.map((s) => s.price_usd as number).sort((a, b) => a - b);
    const median = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
    const JUNK = /protection plan|warranty|gift card|shipping|handling fee|service plan/i;
    const deals = all
      .filter((s) => (s.price_usd as number) < median && !JUNK.test(s.title))
      .map((s) => ({ ...s, vs_median_usd: Math.round(((s.price_usd as number) - median) * 100) / 100, vs_median_pct: Math.round((((s.price_usd as number) - median) / median) * 1000) / 10 }))
      .sort((a, b) => a.vs_median_pct - b.vs_median_pct);
    return pretty({
      store: "Jacques Marie Mage", sample: all.length, median_usd: median, matched: deals.length, returned: Math.min(deals.length, n),
      deals: deals.slice(0, n),
      note: "Below-median asks, not appraisals. Not affiliated with Jacques Marie Mage.",
    });
  });
}

export function listCategories(): Promise<string> {
  return sampleCatalog(500, [1, 2]).then((products) => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      const t = String((p as Record<string, unknown>).product_type || "unknown");
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return pretty({ store: "Jacques Marie Mage", sample: Object.values(counts).reduce((a, b) => a + b, 0), categories: counts });
  });
}
