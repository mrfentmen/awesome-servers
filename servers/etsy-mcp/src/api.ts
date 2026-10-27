/**
 * Etsy Open API v3 client. Requires ETSY_API_KEY.
 * Get a free key at https://www.etsy.com/developers/ (create an app).
 * Docs: https://developers.etsy.com/documentation/reference/
 */
const BASE = "https://openapi.etsy.com/v3/application"

export class EtsyError extends Error {}

function apiKey(): string {
  const k = process.env.ETSY_API_KEY
  if (!k) throw new EtsyError("Set ETSY_API_KEY first (free at etsy.com/developers).")
  return k
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "etsy-mcp/1.0", Accept: "application/json", "x-api-key": apiKey() },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new EtsyError("Etsy rejected the key (401/403). Check ETSY_API_KEY.")
  if (res.status === 404) throw new EtsyError("Not found on Etsy.")
  if (!res.ok) throw new EtsyError(`Etsy error ${res.status}`)
  return (await res.json()) as T
}

export interface Shop {
  shopId: number
  name?: string
  title?: string
  listings?: number
  rating?: number
  url?: string
}

export async function findShop(name: string): Promise<Shop[]> {
  const data = await getJson<Raw>(`/shops?shop_name=${encodeURIComponent(name.trim())}`)
  const rows: Raw[] = Array.isArray(data.results) ? data.results : []
  return rows.slice(0, 5).map(toShop)
}

const toShop = (s: Raw): Shop => ({
  shopId: Number(s.shop_id),
  name: s.shop_name,
  title: s.title,
  listings: s.listing_active_count,
  rating: typeof s.review_average === "number" ? Math.round(s.review_average * 10) / 10 : undefined,
  url: s.url,
});

export interface Listing {
  id: number
  title?: string
  price?: string
  currency?: string
  quantity?: number
  url?: string
  image?: string
}

export async function shopListings(shopId: string, limit = 10): Promise<Listing[]> {
  if (!/^\d+$/.test(shopId.trim())) throw new EtsyError(`Shop id must be numeric, got "${shopId}".`)
  const data = await getJson<Raw>(`/shops/${shopId.trim()}/listings/active?limit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.results) ? data.results : []
  return rows.slice(0, limit).map(toListing)
}

export async function getListing(id: string): Promise<Listing> {
  if (!/^\d+$/.test(id.trim())) throw new EtsyError(`Listing id must be numeric, got "${id}".`)
  const l = await getJson<Raw>(`/listings/${id.trim()}?includes=images`)
  return toListing(l)
}

const toListing = (l: Raw): Listing => ({
  id: Number(l.listing_id),
  title: l.title,
  price: l.price ? `${l.price.amount ?? "?"} ${(l.price.currency_code ?? "").toUpperCase()}` : undefined,
  currency: l.price?.currency_code,
  quantity: l.quantity,
  url: l.url,
  image: (l.images as Raw[] | undefined)?.[0]?.url_fullxfull,
});

export function formatShop(s: Shop, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}[${s.shopId}] ${s.name ?? "(unnamed)"}${s.rating !== undefined ? ` (${s.rating}★)` : ""}`,
    s.title ? `${s.title}` : "",
    s.listings !== undefined ? `${s.listings} active listings` : "",
    s.url ? `${s.url}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatListing(l: Listing, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}[${l.id}] ${l.title ?? "(untitled)"}${l.price ? ` — ${l.price}` : ""}${l.quantity !== undefined ? ` (x${l.quantity})` : ""}`,
    l.url ? `${l.url}` : "",
    l.image ? `${l.image}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}
