/**
 * BigCommerce API client. Needs BC_STORE_HASH + BC_ACCESS_TOKEN
 * (store Settings > API > Create API Account).
 * Docs: https://developer.bigcommerce.com/docs/rest-catalog/products/products-list
 */
function base(): string {
  const hash = process.env.BC_STORE_HASH
  if (!hash) throw new BigCommerceError("Set BC_STORE_HASH first (your store hash).")
  return `https://api.bigcommerce.com/stores/${hash}`
}

export class BigCommerceError extends Error {}

function headers(): Record<string, string> {
  const token = process.env.BC_ACCESS_TOKEN
  if (!token) throw new BigCommerceError("Set BC_ACCESS_TOKEN first (store API account token).")
  return { "User-Agent": "bigcommerce-mcp/1.0", Accept: "application/json", "X-Auth-Token": token }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new BigCommerceError("BigCommerce refused (401/403). Check store hash and token.")
  if (res.status === 404) throw new BigCommerceError("Not found.")
  if (!res.ok) throw new BigCommerceError(`BigCommerce error ${res.status}`)
  return (await res.json()) as T
}

export interface Product {
  id: number
  name?: string
  price?: number
  sku?: string
  availability?: string
}

export async function listProducts(keyword = "", limit = 10): Promise<Product[]> {
  const qs = new URLSearchParams({ limit: String(Math.min(Math.max(limit, 1), 250)) })
  if (keyword.trim()) qs.set("keyword", keyword.trim())
  const data = await getJson<Raw>(`/v3/catalog/products?${qs}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.slice(0, limit).map((p) => ({
    id: Number(p.id),
    name: p.name,
    price: typeof p.price === "number" ? p.price : undefined,
    sku: p.sku || undefined,
    availability: p.availability,
  }))
}

export async function getProduct(id: string): Promise<Product> {
  if (!/^\d+$/.test(id.trim())) throw new BigCommerceError(`Product id must be numeric, got "${id}".`)
  const data = await getJson<Raw>(`/v3/catalog/products/${id.trim()}?include_fields=id,name,price,sku,availability,weight`)
  const p: Raw = data.data ?? {}
  return {
    id: Number(p.id ?? id),
    name: p.name,
    price: typeof p.price === "number" ? p.price : undefined,
    sku: p.sku || undefined,
    availability: p.availability,
  }
}

export interface Order {
  id: number
  status?: string
  total?: string
  date?: string
  customer?: string
}

export async function listOrders(limit = 10): Promise<Order[]> {
  const data = await getJson<Raw>(`/v2/orders?limit=${Math.min(Math.max(limit, 1), 250)}`)
  const rows: Raw[] = Array.isArray(data) ? data : []
  return rows.slice(0, limit).map((o) => ({
    id: Number(o.id),
    status: o.status,
    total: o.total_inc_tax,
    date: o.date_created ? String(o.date_created).slice(0, 10) : undefined,
    customer: [o.billing_address?.first_name, o.billing_address?.last_name].filter(Boolean).join(" ") || undefined,
  }))
}

export function formatProduct(p: Product, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${p.id}] ${p.name ?? "(unnamed)"}${p.price !== undefined ? ` — $${p.price}` : ""}${p.sku ? ` (SKU ${p.sku})` : ""}${p.availability ? ` [${p.availability}]` : ""}`
}

export function formatOrder(o: Order, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}#${o.id}${o.status ? ` [${o.status}]` : ""}${o.total ? ` — ${o.total}` : ""}${o.customer ? ` — ${o.customer}` : ""}${o.date ? ` (${o.date})` : ""}`
}
