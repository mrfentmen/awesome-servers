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

// ---- muxD tools:

export interface BrandsArgs {
  limit?: number
  page?: number
  name_like?: string
}

/**
 * GET /v3/catalog/brands
 * data[].{id, name, page_title, meta_description, image_url,
 *          custom_url.{url, is_customized}}
 * meta.pagination.{total, count, per_page, current_page, total_pages}
 */
export async function listBrands(args: BrandsArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 25, 250))
  const page = Math.max(1, Math.min(args.page ?? 1, 10000))
  const qs = new URLSearchParams({ limit: String(limit), page: String(page) })
  const needle = (args.name_like ?? "").trim()
  if (needle) qs.set("name:like", needle)
  const data = await getJson<Raw>(`/v3/catalog/brands?${qs.toString()}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  const pag: Raw = data.meta?.pagination ?? {}
  if (!rows.length) {
    return `No BigCommerce brands matched${needle ? ` "${needle}"` : ""} on page ${page}.`
  }
  const lines = rows.map((b, i) => {
    const url = b.custom_url?.url
    return `${i + 1}. ${b.name ?? "(unnamed)"} [${b.id}]` +
      (b.page_title ? ` | page title "${String(b.page_title).slice(0, 60)}"` : "") +
      (b.meta_description ? ` | ${String(b.meta_description).slice(0, 80)}` : "") +
      (b.image_url ? ` | image yes` : "") +
      (url ? `\n   ${url}` : "")
  })
  const footer = typeof pag.total === "number"
    ? `Page ${pag.current_page ?? page} of ${pag.total_pages ?? "?"} — ${pag.total} brand(s) in the store.`
    : `Page ${page}.`
  return `BigCommerce brands (${rows.length} shown):\n${lines.join("\n")}\n${footer}`
}

export interface CategoriesArgs {
  limit?: number
  page?: number
  parent_id?: number
}

/**
 * GET /v3/catalog/categories
 * data[].{id, parent_id, name, description, views, sort_order, is_active}
 */
export async function listCategories(args: CategoriesArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 25, 250))
  const page = Math.max(1, Math.min(args.page ?? 1, 10000))
  const qs = new URLSearchParams({ limit: String(limit), page: String(page) })
  if (args.parent_id !== undefined) qs.set("parent_id", String(args.parent_id))
  const data = await getJson<Raw>(`/v3/catalog/categories?${qs.toString()}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  const pag: Raw = data.meta?.pagination ?? {}
  if (!rows.length) {
    return args.parent_id !== undefined
      ? `No BigCommerce categories under parent ${args.parent_id} on page ${page}.`
      : `No BigCommerce categories on page ${page}.`
  }
  const lines = rows.map((c, i) => {
    const bits = [`${i + 1}. ${c.name ?? "(unnamed)"} [${c.id}]`]
    bits.push(` | parent ${c.parent_id ?? 0}${c.is_active === false ? " (inactive)" : ""}`)
    if (typeof c.views === "number") bits.push(` | ${c.views} storefront view(s)`)
    if (c.description) bits.push(` | ${String(c.description).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80)}`)
    return bits.join("")
  })
  const footer = typeof pag.total === "number"
    ? `Page ${pag.current_page ?? page} of ${pag.total_pages ?? "?"} — ${pag.total} categor${pag.total === 1 ? "y" : "ies"} in the store.`
    : `Page ${page}.`
  return `BigCommerce categories (${rows.length} shown):\n${lines.join("\n")}\n${footer}`
}

export interface OrderArgs {
  id: string
}

/**
 * GET /v2/orders/{order_id}
 * Order fields: id, customer_id, status_id, status, date_created, date_shipped,
 * subtotal_inc_tax, shipping_cost_inc_tax, discount_amount, total_inc_tax,
 * billing_address, shipping_addresses, products (line items).
 */
export async function orderDetail(args: OrderArgs): Promise<string> {
  if (!/^\d+$/.test((args.id ?? "").trim())) throw new BigCommerceError(`Order id must be numeric, got "${args.id}".`)
  const id = args.id.trim()
  const data = await getJson<Raw>(`/v2/orders/${id}`)
  const o: Raw = data ?? {}
  if (o.id === undefined) throw new BigCommerceError(`BigCommerce returned no order for id ${id}.`)

  const lines = [`Order #${o.id} [${o.status ?? "status not reported"}]`, ""]
  lines.push(`Placed: ${o.date_created ? String(o.date_created).slice(0, 16) : "not reported"}`)
  if (o.date_shipped) lines.push(`Shipped: ${String(o.date_shipped).slice(0, 16)}`)
  lines.push(`Customer id: ${o.customer_id ?? "not reported"}`)
  const bill: Raw = o.billing_address ?? {}
  const customer = [bill.first_name, bill.last_name].filter(Boolean).join(" ")
  if (customer || bill.email) {
    lines.push(`Bill to: ${customer || "(name not reported)"}${bill.email ? ` <${bill.email}>` : ""}`)
  }
  const addrs: Raw[] = Array.isArray(o.shipping_addresses) ? o.shipping_addresses : []
  for (const a of addrs) {
    const where = [a.first_name, a.last_name, a.city, a.state, a.postal_code, a.country].filter(Boolean).join(", ")
    lines.push(`Ship to: ${where || "not reported"}${typeof a.items_shipped === "number" ? ` (${a.items_shipped}/${a.items_total} item(s) shipped)` : ""}`)
  }

  const money = (label: string, v: unknown) => {
    if (v === undefined || v === null || v === "") lines.push(`${label}: not reported`)
    else lines.push(`${label}: $${v}`)
  }
  money("Subtotal inc tax", o.subtotal_inc_tax)
  money("Shipping inc tax", o.shipping_cost_inc_tax)
  money("Discount", o.discount_amount)
  money("Total inc tax", o.total_inc_tax)

  const items: Raw[] = Array.isArray(o.products) ? o.products : []
  lines.push("")
  if (!items.length) {
    lines.push("No line items reported on this order.")
  } else {
    lines.push(`Line items (${items.length}):`)
    for (const p of items) {
      lines.push(
        `  ${p.quantity ?? 1} x ${p.name ?? "(unnamed item)"}` +
        `${p.sku ? ` [SKU ${p.sku}]` : ""}` +
        `${p.price_inc_tax !== undefined ? ` — $${p.price_inc_tax} each` : ""}` +
        `${p.product_id !== undefined ? ` (product ${p.product_id})` : ""}`,
      )
    }
  }
  return lines.join("\n")
}
