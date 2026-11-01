export class BillbeeError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = "BillbeeError"
  }
}

const DEFAULT_BASE = "https://app.billbee.io"

interface Config {
  base: string
  auth: string
  apiKey: string
}

function config(): Config {
  const email = process.env.BILLBEE_EMAIL
  const password = process.env.BILLBEE_API_PASSWORD
  const apiKey = process.env.BILLBEE_API_KEY
  const missing: string[] = []
  if (!email) missing.push("BILLBEE_EMAIL")
  if (!password) missing.push("BILLBEE_API_PASSWORD")
  if (!apiKey) missing.push("BILLBEE_API_KEY")
  if (missing.length > 0) {
    throw new BillbeeError(
      `Missing required environment variable${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. ` +
        "Billbee needs the account email and API password for HTTP Basic auth plus the API key header."
    )
  }
  return {
    base: (process.env.BILLBEE_BASE_URL ?? DEFAULT_BASE).replace(/\/+$/, ""),
    auth: Buffer.from(`${email ?? ""}:${password ?? ""}`).toString("base64"),
    apiKey: apiKey ?? "",
  }
}

/* ------------------------------------------------------------------ */
/* defensive narrowing                                                 */
/* ------------------------------------------------------------------ */

function asObj(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null
}

function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function pick(o: Record<string, unknown> | null, ...keys: string[]): unknown {
  if (!o) return undefined
  for (const k of keys) {
    if (o[k] !== undefined && o[k] !== null) return o[k]
  }
  return undefined
}

function str(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v
  if (typeof v === "number" && Number.isFinite(v)) return String(v)
  if (typeof v === "boolean") return v ? "true" : "false"
  return fallback
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function bool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v
  if (typeof v === "string") {
    if (v.toLowerCase() === "true") return true
    if (v.toLowerCase() === "false") return false
  }
  return undefined
}

/* ------------------------------------------------------------------ */
/* transport                                                           */
/* ------------------------------------------------------------------ */

type Query = Record<string, string | number | boolean | undefined>

function buildUrl(base: string, path: string, query?: Query): string {
  const url = new URL(base + path)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

async function request(path: string, init: RequestInit = {}, query?: Query): Promise<unknown> {
  const cfg = config()
  const res = await fetch(buildUrl(cfg.base, path, query), {
    ...init,
    headers: {
      Authorization: `Basic ${cfg.auth}`,
      "X-Billbee-Api-Key": cfg.apiKey,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
    signal: AbortSignal.timeout(25000),
  })

  const text = await res.text()
  let payload: unknown = null
  if (text.trim() !== "") {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  const body = asObj(payload)
  const message =
    str(pick(body, "ErrorMessage", "errorMessage", "Message", "message")) ||
    (typeof payload === "string" ? payload.slice(0, 200) : "")

  if (!res.ok) {
    throw new BillbeeError(
      `Billbee API ${res.status} ${res.statusText}${message ? `: ${message}` : ""}`,
      res.status
    )
  }
  if (bool(pick(body, "Success", "success")) === false) {
    throw new BillbeeError(message || "Billbee reported Success=false", res.status)
  }

  if (body && "Data" in body) return body.Data
  if (body && "data" in body) return body.data
  return payload
}

function get(path: string, query?: Query): Promise<unknown> {
  return request(path, { method: "GET" }, query)
}

function send(method: "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown, query?: Query): Promise<unknown> {
  return request(
    path,
    body === undefined ? { method } : { method, body: JSON.stringify(body) },
    query
  )
}

export type JsonBody = Record<string, unknown>

/* ------------------------------------------------------------------ */
/* models                                                              */
/* ------------------------------------------------------------------ */

export interface Order {
  id: number
  orderNumber: string
  state: string
  stateId?: number
  shopName: string
  orderDate: string
  total?: number
  currency: string
  customerName: string
}

export interface Customer {
  id: number
  name: string
  email: string
  phone: string
  city: string
  country: string
}

export interface Address {
  id: number
  firstName: string
  lastName: string
  line1: string
  line2: string
  city: string
  zip: string
  country: string
}

export interface Product {
  id: number
  sku: string
  title: string
  price?: number
  stock?: number
  active?: boolean
}

export interface ShippingCarrier {
  id: number
  name: string
}

export interface Webhook {
  id: number
  type: string
  targetUrl: string
  active?: boolean
}

export interface EnumEntry {
  id: number
  name: string
}

function parseOrder(v: unknown): Order | null {
  const o = asObj(v)
  if (!o) return null
  const customer = asObj(pick(o, "Customer", "customer"))
  return {
    id: num(pick(o, "Id", "id")) ?? 0,
    orderNumber: str(pick(o, "OrderNumber", "orderNumber")),
    state: str(pick(o, "StateDisplayName", "stateDisplayName", "State", "state")),
    stateId: num(pick(o, "State", "state")),
    shopName: str(pick(o, "ShopName", "shopName")),
    orderDate: str(pick(o, "OrderDate", "orderDate")),
    total: num(pick(o, "Total", "total")),
    currency: str(pick(o, "CurrencyCode", "currencyCode", "Currency", "currency"), "EUR"),
    customerName: str(
      pick(customer, "Name", "name", "FullName", "fullName") ??
        `${str(pick(o, "CustomerName", "customerName"))}`
    ),
  }
}

function parseCustomer(v: unknown): Customer | null {
  const o = asObj(v)
  if (!o) return null
  const address = asObj(pick(o, "Address", "address", "DefaultAddress", "defaultAddress"))
  return {
    id: num(pick(o, "Id", "id")) ?? 0,
    name: str(
      pick(o, "Name", "name", "FullName", "fullName") ??
        `${str(pick(o, "FirstName", "firstName"))} ${str(pick(o, "LastName", "lastName"))}`.trim()
    ),
    email: str(pick(o, "Email", "email", "EmailAddress", "emailAddress")),
    phone: str(pick(o, "Tel1", "tel1", "Phone", "phone")),
    city: str(pick(address, "City", "city") ?? pick(o, "City", "city")),
    country: str(pick(address, "Country", "country") ?? pick(o, "Country", "country")),
  }
}

function parseAddress(v: unknown): Address | null {
  const o = asObj(v)
  if (!o) return null
  return {
    id: num(pick(o, "Id", "id")) ?? 0,
    firstName: str(pick(o, "FirstName", "firstName")),
    lastName: str(pick(o, "LastName", "lastName")),
    line1: str(pick(o, "Street", "street", "Line1", "line1")),
    line2: str(pick(o, "HouseNumber", "houseNumber", "Line2", "line2")),
    city: str(pick(o, "City", "city")),
    zip: str(pick(o, "Zip", "zip", "ZipCode", "zipCode")),
    country: str(pick(o, "Country", "country", "CountryIso2", "countryIso2")),
  }
}

function parseProduct(v: unknown): Product | null {
  const o = asObj(v)
  if (!o) return null
  const stock = asObj(pick(o, "Stockcurrent", "StockCurrent", "stockcurrent"))
  return {
    id: num(pick(o, "Id", "id")) ?? 0,
    sku: str(pick(o, "SKU", "Sku", "sku")),
    title: str(pick(o, "Title", "title")),
    price: num(pick(o, "Price", "price")),
    stock: num(pick(o, "Stock", "stock")) ?? num(pick(stock, "Value", "value")),
    active: bool(pick(o, "IsActive", "isActive", "Active", "active")),
  }
}

function itemList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  const o = asObj(payload)
  if (!o) return []
  for (const key of ["Data", "data", "Items", "items", "List", "list"]) {
    const v = o[key]
    if (Array.isArray(v)) return v
  }
  return []
}

function pagedTotal(payload: unknown): number | undefined {
  const o = asObj(payload)
  if (!o) return undefined
  const paging = asObj(pick(o, "Paging", "paging"))
  return num(pick(paging, "Total", "total")) ?? num(pick(o, "Count", "count"))
}

function mapList<T>(payload: unknown, parse: (v: unknown) => T | null): T[] {
  const out: T[] = []
  for (const raw of itemList(payload)) {
    const parsed = parse(raw)
    if (parsed) out.push(parsed)
  }
  return out
}

/* ------------------------------------------------------------------ */
/* formatters                                                          */
/* ------------------------------------------------------------------ */

function money(v: number | undefined, currency: string): string {
  if (v === undefined) return "—"
  return `${v.toFixed(2)} ${currency}`
}

export function formatOrder(o: Order, index?: number): string {
  const head = index === undefined ? `#${o.id}` : `${index + 1}. #${o.id}`
  return `${head} · ${o.orderNumber || "(no number)"} · ${o.state || "unknown state"} · ${money(o.total, o.currency)} · ${o.customerName || "(no customer)"} · ${o.orderDate || "no date"}`
}

export function formatOrders(orders: Order[], total?: number): string {
  if (orders.length === 0) return "No orders found."
  const lines = orders.map((o, i) => formatOrder(o, i))
  return [`${orders.length} order(s)${total !== undefined ? ` of ${total}` : ""}:`, ...lines].join("\n")
}

export function formatCustomer(c: Customer, index?: number): string {
  const head = index === undefined ? `#${c.id}` : `${index + 1}. #${c.id}`
  const where = [c.city, c.country].filter((x) => x !== "").join(", ")
  return `${head} · ${c.name || "(no name)"} · ${c.email || "no email"} · ${c.phone || "no phone"}${where ? ` · ${where}` : ""}`
}

export function formatCustomers(customers: Customer[], total?: number): string {
  if (customers.length === 0) return "No customers found."
  const lines = customers.map((c, i) => formatCustomer(c, i))
  return [`${customers.length} customer(s)${total !== undefined ? ` of ${total}` : ""}:`, ...lines].join("\n")
}

export function formatAddress(a: Address, index?: number): string {
  const head = index === undefined ? `#${a.id}` : `${index + 1}. #${a.id}`
  const street = [a.line1, a.line2].filter((x) => x !== "").join(" ")
  const tail = [a.zip, a.city].filter((x) => x !== "").join(" ")
  return `${head} · ${`${a.firstName} ${a.lastName}`.trim() || "(no name)"} · ${street || "no street"} · ${tail || "no city"} · ${a.country || "no country"}`
}

export function formatAddresses(addresses: Address[]): string {
  if (addresses.length === 0) return "No addresses found."
  return [`${addresses.length} address(es):`, ...addresses.map((a, i) => formatAddress(a, i))].join("\n")
}

export function formatProduct(p: Product, index?: number): string {
  const head = index === undefined ? `#${p.id}` : `${index + 1}. #${p.id}`
  const price = p.price === undefined ? "—" : p.price.toFixed(2)
  const stock = p.stock === undefined ? "—" : String(p.stock)
  const state = p.active === undefined ? "" : p.active ? " · active" : " · inactive"
  return `${head} · ${p.sku || "no SKU"} · ${p.title || "(no title)"} · ${price} · stock ${stock}${state}`
}

export function formatProducts(products: Product[], total?: number): string {
  if (products.length === 0) return "No products found."
  const lines = products.map((p, i) => formatProduct(p, i))
  return [`${products.length} product(s)${total !== undefined ? ` of ${total}` : ""}:`, ...lines].join("\n")
}

export function formatCarriers(carriers: ShippingCarrier[]): string {
  if (carriers.length === 0) return "No shipping carriers returned."
  return [`${carriers.length} carrier(s):`, ...carriers.map((c, i) => `${i + 1}. #${c.id} · ${c.name}`)].join("\n")
}

export function formatWebhooks(hooks: Webhook[]): string {
  if (hooks.length === 0) return "No webhooks configured."
  return [
    `${hooks.length} webhook(s):`,
    ...hooks.map((h, i) => `${i + 1}. #${h.id} · ${h.type} → ${h.targetUrl}${h.active === false ? " · inactive" : ""}`),
  ].join("\n")
}

export function formatEnums(label: string, entries: EnumEntry[]): string {
  if (entries.length === 0) return `No ${label} returned.`
  return [`${entries.length} ${label}:`, ...entries.map((e) => `- ${e.id} · ${e.name}`)].join("\n")
}

export function formatInvoice(v: unknown, index: number): string {
  const o = asObj(v)
  const id = str(pick(o, "Id", "id"))
  const number = str(pick(o, "InvoiceNumber", "invoiceNumber", "Number", "number"))
  const pdf = str(pick(o, "PdfData", "pdfData", "PdfUrl", "pdfUrl"))
  const date = str(pick(o, "InvoiceDate", "invoiceDate", "Created", "created"))
  return `${index + 1}. #${id || "?"} · ${number || "(no number)"} · ${money(num(pick(o, "Total", "total", "Gross", "gross")), "")} · ${date || "no date"}${pdf ? ` · PDF ${pdf}` : ""}`
}

export function formatInvoices(payload: unknown): string {
  const rows = itemList(payload)
  if (rows.length === 0) return "No invoices found."
  return [`${rows.length} invoice(s):`, ...rows.map((r, i) => formatInvoice(r, i))].join("\n")
}

export function formatStockRows(payload: unknown): string {
  const rows = itemList(payload)
  if (rows.length === 0) return "No stock rows returned."
  return [
    `${rows.length} stock row(s):`,
    ...rows.map((r, i) => {
      const o = asObj(r)
      return `${i + 1}. #${str(pick(o, "Id", "id", "ProductId", "productId"))} · ${str(pick(o, "SKU", "Sku", "sku"))} · stock ${str(pick(o, "Stock", "stock", "StockCurrent", "stockCurrent"))}`
    }),
  ].join("\n")
}

export function formatRaw(payload: unknown): string {
  if (payload === null || payload === undefined) return "Done."
  if (typeof payload === "string") return payload
  return JSON.stringify(payload, null, 2)
}

/* ------------------------------------------------------------------ */
/* endpoints                                                           */
/* ------------------------------------------------------------------ */

function pageQuery(page?: number, pageSize?: number, extra: Query = {}): Query {
  return { ...extra, page, pageSize }
}

export async function listOrders(opts: {
  page?: number
  pageSize?: number
  minOrderDate?: string
  maxOrderDate?: string
  shopId?: number
  orderStateId?: number
}): Promise<string> {
  const payload = await get(
    "/api/v1/orders",
    pageQuery(opts.page, opts.pageSize, {
      minOrderDate: opts.minOrderDate,
      maxOrderDate: opts.maxOrderDate,
      shopId: opts.shopId,
      orderStateId: opts.orderStateId,
    })
  )
  return formatOrders(mapList(payload, parseOrder), pagedTotal(payload))
}

export async function createOrder(body: JsonBody): Promise<string> {
  const payload = await send("POST", "/api/v1/orders", body)
  const order = parseOrder(payload)
  return order ? `Order created.\n${formatOrder(order)}` : `Order created.\n${formatRaw(payload)}`
}

export async function getOrder(id: number): Promise<string> {
  const payload = await get(`/api/v1/orders/${id}`)
  const order = parseOrder(payload)
  return order ? formatOrder(order) : formatRaw(payload)
}

export async function patchOrder(id: number, patch: JsonBody): Promise<string> {
  const payload = await send("PATCH", `/api/v1/orders/${id}`, patch)
  return `Order #${id} patched.\n${formatRaw(payload)}`
}

export async function setOrderState(
  id: number,
  orderStateId: number,
  comment?: string,
  sendMail?: boolean,
  sendMessage?: boolean
): Promise<string> {
  const body: JsonBody = { Id: id, OrderStateId: orderStateId }
  if (comment !== undefined) body.Comment = comment
  if (sendMail !== undefined) body.SendMail = sendMail
  if (sendMessage !== undefined) body.SendMessage = sendMessage
  await send("PUT", `/api/v1/orders/${id}/orderstate`, body)
  return `Order #${id} moved to state ${orderStateId}.`
}

export async function addOrderShipment(id: number, shipment: JsonBody): Promise<string> {
  const payload = await send("POST", `/api/v1/orders/${id}/shipment`, shipment)
  return `Shipment added to order #${id}.\n${formatRaw(payload)}`
}

export async function addOrderTags(id: number, tags: string[]): Promise<string> {
  const payload = await send("POST", `/api/v1/orders/${id}/tags`, { Tags: tags })
  return `Tags set on order #${id}: ${tags.join(", ")}.\n${formatRaw(payload)}`
}

export async function sendOrderMessage(id: number, message: JsonBody): Promise<string> {
  const payload = await send("POST", `/api/v1/orders/${id}/send-message`, message)
  return `Message sent for order #${id}.\n${formatRaw(payload)}`
}

export async function listInvoices(page?: number, pageSize?: number): Promise<string> {
  const payload = await get("/api/v1/orders/invoices", pageQuery(page, pageSize))
  return formatInvoices(payload)
}

export async function findOrderByExtRef(extRef: string): Promise<string> {
  const payload = await get(`/api/v1/orders/findbyextref/${encodeURIComponent(extRef)}`)
  const order = parseOrder(payload)
  return order ? formatOrder(order) : formatRaw(payload)
}

export async function listCustomers(page?: number, pageSize?: number): Promise<string> {
  const payload = await get("/api/v1/customers", pageQuery(page, pageSize))
  return formatCustomers(mapList(payload, parseCustomer), pagedTotal(payload))
}

export async function createCustomer(body: JsonBody): Promise<string> {
  const payload = await send("POST", "/api/v1/customers", body)
  const customer = parseCustomer(payload)
  return customer ? `Customer created.\n${formatCustomer(customer)}` : `Customer created.\n${formatRaw(payload)}`
}

export async function getCustomer(id: number): Promise<string> {
  const payload = await get(`/api/v1/customers/${id}`)
  const customer = parseCustomer(payload)
  return customer ? formatCustomer(customer) : formatRaw(payload)
}

export async function listCustomerOrders(id: number, page?: number, pageSize?: number): Promise<string> {
  const payload = await get(`/api/v1/customers/${id}/orders`, pageQuery(page, pageSize))
  return formatOrders(mapList(payload, parseOrder), pagedTotal(payload))
}

export async function listCustomerAddresses(id: number): Promise<string> {
  const payload = await get(`/api/v1/customers/${id}/addresses`)
  return formatAddresses(mapList(payload, parseAddress))
}

export async function listProducts(page?: number, pageSize?: number): Promise<string> {
  const payload = await get("/api/v1/products", pageQuery(page, pageSize))
  return formatProducts(mapList(payload, parseProduct), pagedTotal(payload))
}

export async function getProduct(id: number): Promise<string> {
  const payload = await get(`/api/v1/products/${id}`)
  const product = parseProduct(payload)
  const parsed = product ? formatProduct(product) : formatRaw(payload)
  const raw = asObj(payload)
  const description = str(pick(raw, "Description", "description"))
  return description ? `${parsed}\n\n${description}` : parsed
}

export async function patchProduct(id: number, patch: JsonBody): Promise<string> {
  const payload = await send("PATCH", `/api/v1/products/${id}`, patch)
  return `Product #${id} patched.\n${formatRaw(payload)}`
}

export async function listProductStocks(page?: number, pageSize?: number): Promise<string> {
  const payload = await get("/api/v1/products/stocks", pageQuery(page, pageSize))
  return formatStockRows(payload)
}

export async function updateProductStock(productId: number, stock: number, extra?: JsonBody): Promise<string> {
  const payload = await send("POST", "/api/v1/products/updatestock", {
    Id: productId,
    StockCurrent: stock,
    ...(extra ?? {}),
  })
  return `Stock for product #${productId} set to ${stock}.\n${formatRaw(payload)}`
}

export async function listShippingCarriers(): Promise<string> {
  const payload = await get("/api/v1/shipment/shippingcarriers")
  return formatCarriers(
    mapList(payload, (v) => {
      const o = asObj(v)
      if (!o) return null
      return { id: num(pick(o, "Id", "id")) ?? 0, name: str(pick(o, "Name", "name")) }
    })
  )
}

export async function listShippingProviders(): Promise<string> {
  const payload = await get("/api/v1/shipment/shippingproviders")
  const rows = itemList(payload)
  if (rows.length === 0) return "No shipping providers returned."
  return [
    `${rows.length} provider(s):`,
    ...rows.map((r, i) => {
      const o = asObj(r)
      return `${i + 1}. #${str(pick(o, "Id", "id"))} · ${str(pick(o, "Name", "name", "DisplayName", "displayName"))}`
    }),
  ].join("\n")
}

export async function createShipmentWithLabel(body: JsonBody): Promise<string> {
  const payload = await send("POST", "/api/v1/shipment/shipwithlabel", body)
  return `Shipment with label created.\n${formatRaw(payload)}`
}

export async function listWebhooks(): Promise<string> {
  const payload = await get("/api/v1/webhooks")
  return formatWebhooks(
    mapList(payload, (v) => {
      const o = asObj(v)
      if (!o) return null
      return {
        id: num(pick(o, "Id", "id")) ?? 0,
        type: str(pick(o, "Type", "type", "HookType", "hookType")),
        targetUrl: str(pick(o, "TargetUrl", "targetUrl", "Url", "url")),
        active: bool(pick(o, "Active", "active", "IsActive", "isActive")),
      }
    })
  )
}

export async function createWebhook(body: JsonBody): Promise<string> {
  const payload = await send("POST", "/api/v1/webhooks", body)
  return `Webhook created.\n${formatRaw(payload)}`
}

export async function deleteWebhook(id: number): Promise<string> {
  await send("DELETE", `/api/v1/webhooks/${id}`)
  return `Webhook #${id} deleted.`
}

async function enumList(path: string): Promise<EnumEntry[]> {
  const payload = await get(path)
  const entries: EnumEntry[] = []
  for (const raw of itemList(payload)) {
    const o = asObj(raw)
    if (!o) continue
    entries.push({
      id: num(pick(o, "Id", "id", "Value", "value")) ?? 0,
      name: str(pick(o, "Name", "name", "DisplayName", "displayName", "Text", "text")),
    })
  }
  return entries
}

export async function listOrderStates(): Promise<string> {
  return formatEnums("order states", await enumList("/api/v1/enums/orderstates"))
}

export async function listPaymentTypes(): Promise<string> {
  return formatEnums("payment types", await enumList("/api/v1/enums/paymenttypes"))
}

export async function listShippingCarrierEnums(): Promise<string> {
  return formatEnums("shipping carriers", await enumList("/api/v1/enums/shippingcarriers"))
}
