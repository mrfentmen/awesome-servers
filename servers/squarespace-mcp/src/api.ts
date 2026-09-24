/**
 * Squarespace Commerce API client. Needs SQUARESPACE_API_KEY
 * (Settings > Developer Tools > API Keys).
 * Docs: https://developers.squarespace.com/commerce-apis/overview
 */
const BASE = "https://api.squarespace.com/1.0"

export class SquarespaceError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.SQUARESPACE_API_KEY
  if (!key) throw new SquarespaceError("Set SQUARESPACE_API_KEY first (Settings > Developer Tools > API Keys).")
  return { "User-Agent": "squarespace-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${key}` }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new SquarespaceError("Squarespace rejected the key (401/403).")
  if (res.status === 404) throw new SquarespaceError("Not found.")
  if (!res.ok) throw new SquarespaceError(`Squarespace error ${res.status}`)
  return (await res.json()) as T
}

export interface Product {
  id: string
  name?: string
  price?: string
  url?: string
}

export async function listProducts(limit = 10): Promise<Product[]> {
  const data = await getJson<Raw>(`/commerce/products?limit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.result) ? data.result : []
  return rows.slice(0, limit).map((p) => ({
    id: String(p.id),
    name: p.name,
    price: p.variants?.[0]?.pricing?.basePrice?.value,
    url: p.url,
  }))
}

export interface Order {
  id: string
  created?: string
  total?: string
  email?: string
}

export async function listOrders(limit = 10): Promise<Order[]> {
  const data = await getJson<Raw>(`/commerce/orders?limit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.result) ? data.result : []
  return rows.slice(0, limit).map((o) => ({
    id: String(o.id),
    created: o.createdOn ? String(o.createdOn).slice(0, 10) : undefined,
    total: o.grandTotal?.value,
    email: o.customerEmail,
  }))
}

export function formatProduct(p: Product, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${p.id}] ${p.name ?? "(unnamed)"}${p.price ? ` — ${p.price}` : ""}${p.url ? `\n   ${p.url}` : ""}`
}

export function formatOrder(o: Order, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${o.id}]${o.total ? ` ${o.total}` : ""}${o.email ? ` — ${o.email}` : ""}${o.created ? ` (${o.created})` : ""}`
}
