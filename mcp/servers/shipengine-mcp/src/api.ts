const BASE = "https://api.shipengine.com"

export class ShipEngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ShipEngineError"
  }
}

function apiKey(): string {
  const key = process.env.SHIPENGINE_API_KEY
  if (!key || key.trim() === "") {
    throw new ShipEngineError(
      "SHIPENGINE_API_KEY is not set. Create an API key at https://dashboard.shipengine.com and export it as SHIPENGINE_API_KEY.",
    )
  }
  return key.trim()
}

function asObj(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function str(v: unknown): string | undefined {
  if (typeof v === "string") return v
  if (typeof v === "number") return String(v)
  return undefined
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v)
  return undefined
}

function list(payload: unknown, key: string): unknown[] {
  if (Array.isArray(payload)) return payload
  const obj = asObj(payload)
  const fromKey = obj[key]
  return Array.isArray(fromKey) ? fromKey : []
}

function errorText(payload: unknown, status: number): string {
  const obj = asObj(payload)
  const errors = asArr(obj["errors"])
  const messages = errors
    .map((e) => {
      const item = asObj(e)
      const msg = str(item["message"])
      const code = str(item["error_code"])
      return msg ? (code ? `${code}: ${msg}` : msg) : undefined
    })
    .filter((m): m is string => typeof m === "string" && m.length > 0)
  if (messages.length > 0) return messages.join("; ")
  return str(obj["message"]) ?? str(obj["error"]) ?? `ShipEngine request failed with HTTP ${status}`
}

export async function request<T>(path: string, init: { method?: string; body?: unknown; query?: Record<string, string | number | undefined> } = {}): Promise<T> {
  const url = new URL(BASE + path)
  for (const [k, v] of Object.entries(init.query ?? {})) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v))
  }

  let res: Response
  try {
    res = await fetch(url, {
      method: init.method ?? "GET",
      headers: {
        "API-Key": apiKey(),
        Accept: "application/json",
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e)
    throw new ShipEngineError(`Could not reach ShipEngine: ${reason}`)
  }

  const raw = await res.text()
  let parsed: unknown = null
  if (raw.trim() !== "") {
    try {
      parsed = JSON.parse(raw) as unknown
    } catch {
      throw new ShipEngineError(`ShipEngine returned a non-JSON response (HTTP ${res.status}): ${raw.slice(0, 200)}`)
    }
  }

  if (!res.ok) throw new ShipEngineError(errorText(parsed, res.status))
  return parsed as T
}

// ---------- models ----------

export interface Carrier {
  carrierId?: string
  friendlyName?: string
  nickname?: string
  accountNumber?: string
  requiresFundedAccount?: boolean
  balance?: number
  primary?: boolean
}

export interface CarrierService {
  serviceCode?: string
  name?: string
  domestic?: boolean
  international?: boolean
  isMultiPackageSupported?: boolean
}

export interface PackageType {
  packageCode?: string
  name?: string
  description?: string
}

export interface AddressRecord {
  address?: {
    name?: string
    companyName?: string
    addressLine1?: string
    addressLine2?: string
    cityLocality?: string
    stateProvince?: string
    postalCode?: string
    countryCode?: string
  }
  status?: string
  originalAddress?: Record<string, unknown>
  messages?: unknown[]
}

export interface Rate {
  rateId?: string
  rateType?: string
  carrierId?: string
  carrierFriendlyName?: string
  serviceCode?: string
  serviceType?: string
  shippingAmount?: { currency?: string; amount?: number }
  deliveryDays?: number
  estimatedDeliveryDate?: string
  carrierDeliveryDays?: string
}

export interface Shipment {
  shipmentId?: string
  carrierId?: string
  serviceCode?: string
  shipmentStatus?: string
  createdAt?: string
  modifiedAt?: string
  tags?: unknown[]
  shipTo?: Record<string, unknown>
  packages?: unknown[]
}

export interface Label {
  labelId?: string
  status?: string
  shipmentId?: string
  carrierId?: string
  serviceCode?: string
  trackingNumber?: string
  shipDate?: string
  voided?: boolean
  voidedAt?: string
  labelDownload?: { href?: string; pdf?: string; png?: string; zpl?: string }
}

export interface TrackingEvent {
  occurredAt?: string
  carrierOccurredAt?: string
  description?: string
  cityLocality?: string
  stateProvince?: string
  postalCode?: string
  countryCode?: string
  statusCode?: string
  carrierStatusCode?: string
}

export interface TrackingInfo {
  trackingNumber?: string
  statusCode?: string
  statusDescription?: string
  carrierStatusCode?: string
  carrierStatusDescription?: string
  estimatedDeliveryDate?: string
  actualDeliveryDate?: string
  exceptionDescription?: string
  events?: TrackingEvent[]
}

export interface Warehouse {
  warehouseId?: string
  name?: string
  originAddress?: Record<string, unknown>
  returnAddress?: Record<string, unknown>
  isDefault?: boolean
  createdAt?: string
}

export interface Batch {
  batchId?: string
  batchNumber?: string
  labelLayout?: string
  status?: string
  createdAt?: string
  processedAt?: string
  errors?: unknown[]
  batchShipmentCount?: number
}

// ---------- parsers ----------

function parseCarrier(v: unknown): Carrier {
  const o = asObj(v)
  return {
    carrierId: str(o["carrier_id"]),
    friendlyName: str(o["friendly_name"]),
    nickname: str(o["nickname"]),
    accountNumber: str(o["account_number"]),
    requiresFundedAccount: typeof o["requires_funded_account"] === "boolean" ? o["requires_funded_account"] : undefined,
    balance: num(o["balance"]),
    primary: typeof o["primary"] === "boolean" ? o["primary"] : undefined,
  }
}

function parseCarrierService(v: unknown): CarrierService {
  const o = asObj(v)
  return {
    serviceCode: str(o["service_code"]),
    name: str(o["name"]),
    domestic: typeof o["domestic"] === "boolean" ? o["domestic"] : undefined,
    international: typeof o["international"] === "boolean" ? o["international"] : undefined,
    isMultiPackageSupported: typeof o["is_multi_package_supported"] === "boolean" ? o["is_multi_package_supported"] : undefined,
  }
}

function parsePackageType(v: unknown): PackageType {
  const o = asObj(v)
  return {
    packageCode: str(o["package_code"]),
    name: str(o["name"]),
    description: str(o["description"]),
  }
}

function parseAddressRecord(v: unknown): AddressRecord {
  const o = asObj(v)
  const address = asObj(o["address"])
  return {
    address: {
      name: str(address["name"]),
      companyName: str(address["company_name"]),
      addressLine1: str(address["address_line1"]),
      addressLine2: str(address["address_line2"]),
      cityLocality: str(address["city_locality"]),
      stateProvince: str(address["state_province"]),
      postalCode: str(address["postal_code"]),
      countryCode: str(address["country_code"]),
    },
    status: str(o["status"]),
    originalAddress: asObj(o["original_address"]),
    messages: asArr(o["messages"]),
  }
}

function parseAmount(v: unknown): { currency?: string; amount?: number } {
  const o = asObj(v)
  return { currency: str(o["currency"]), amount: num(o["amount"]) }
}

function parseRate(v: unknown): Rate {
  const o = asObj(v)
  return {
    rateId: str(o["rate_id"]),
    rateType: str(o["rate_type"]),
    carrierId: str(o["carrier_id"]),
    carrierFriendlyName: str(o["carrier_friendly_name"]),
    serviceCode: str(o["service_code"]),
    serviceType: str(o["service_type"]),
    shippingAmount: o["shipping_amount"] !== undefined ? parseAmount(o["shipping_amount"]) : undefined,
    deliveryDays: num(o["delivery_days"]),
    estimatedDeliveryDate: str(o["estimated_delivery_date"]),
    carrierDeliveryDays: str(o["carrier_delivery_days"]),
  }
}

function parseShipment(v: unknown): Shipment {
  const o = asObj(v)
  return {
    shipmentId: str(o["shipment_id"]),
    carrierId: str(o["carrier_id"]),
    serviceCode: str(o["service_code"]),
    shipmentStatus: str(o["shipment_status"]),
    createdAt: str(o["created_at"]),
    modifiedAt: str(o["modified_at"]),
    tags: asArr(o["tags"]),
    shipTo: asObj(o["ship_to"]),
    packages: asArr(o["packages"]),
  }
}

function parseLabel(v: unknown): Label {
  const o = asObj(v)
  const download = asObj(o["label_download"])
  return {
    labelId: str(o["label_id"]),
    status: str(o["status"]),
    shipmentId: str(o["shipment_id"]),
    carrierId: str(o["carrier_id"]),
    serviceCode: str(o["service_code"]),
    trackingNumber: str(o["tracking_number"]),
    shipDate: str(o["ship_date"]),
    voided: typeof o["voided"] === "boolean" ? o["voided"] : undefined,
    voidedAt: str(o["voided_at"]),
    labelDownload: {
      href: str(download["href"]),
      pdf: str(download["pdf"]),
      png: str(download["png"]),
      zpl: str(download["zpl"]),
    },
  }
}

function parseTrackingEvent(v: unknown): TrackingEvent {
  const o = asObj(v)
  return {
    occurredAt: str(o["occurred_at"]),
    carrierOccurredAt: str(o["carrier_occurred_at"]),
    description: str(o["description"]),
    cityLocality: str(o["city_locality"]),
    stateProvince: str(o["state_province"]),
    postalCode: str(o["postal_code"]),
    countryCode: str(o["country_code"]),
    statusCode: str(o["status_code"]),
    carrierStatusCode: str(o["carrier_status_code"]),
  }
}

function parseTracking(v: unknown): TrackingInfo {
  const o = asObj(v)
  return {
    trackingNumber: str(o["tracking_number"]),
    statusCode: str(o["status_code"]),
    statusDescription: str(o["status_description"]),
    carrierStatusCode: str(o["carrier_status_code"]),
    carrierStatusDescription: str(o["carrier_status_description"]),
    estimatedDeliveryDate: str(o["estimated_delivery_date"]),
    actualDeliveryDate: str(o["actual_delivery_date"]),
    exceptionDescription: str(o["exception_description"]),
    events: asArr(o["events"]).map(parseTrackingEvent),
  }
}

function parseWarehouse(v: unknown): Warehouse {
  const o = asObj(v)
  return {
    warehouseId: str(o["warehouse_id"]),
    name: str(o["name"]),
    originAddress: asObj(o["origin_address"]),
    returnAddress: asObj(o["return_address"]),
    isDefault: typeof o["is_default"] === "boolean" ? o["is_default"] : undefined,
    createdAt: str(o["created_at"]),
  }
}

function parseBatch(v: unknown): Batch {
  const o = asObj(v)
  return {
    batchId: str(o["batch_id"]),
    batchNumber: str(o["batch_number"]),
    labelLayout: str(o["label_layout"]),
    status: str(o["status"]),
    createdAt: str(o["created_at"]),
    processedAt: str(o["processed_at"]),
    errors: asArr(o["errors"]),
    batchShipmentCount: num(o["batch_shipment_count"]),
  }
}

// ---------- endpoints ----------

export async function listCarriers(): Promise<Carrier[]> {
  const payload = await request<unknown>("/v1/carriers")
  return list(payload, "carriers").map(parseCarrier)
}

export async function getCarrier(carrierId: string): Promise<Carrier> {
  const payload = await request<unknown>(`/v1/carriers/${encodeURIComponent(carrierId)}`)
  return parseCarrier(payload)
}

export async function listCarrierServices(carrierId: string): Promise<CarrierService[]> {
  const payload = await request<unknown>(`/v1/carriers/${encodeURIComponent(carrierId)}/services`)
  return list(payload, "services").map(parseCarrierService)
}

export async function listCarrierPackages(carrierId: string): Promise<PackageType[]> {
  const payload = await request<unknown>(`/v1/carriers/${encodeURIComponent(carrierId)}/packages`)
  return list(payload, "packages").map(parsePackageType)
}

export async function validateAddress(body: unknown): Promise<AddressRecord[]> {
  const payload = await request<unknown>("/v1/addresses/validate", { method: "POST", body })
  return list(payload, "addresses").map(parseAddressRecord)
}

export async function recognizeAddress(body: unknown): Promise<AddressRecord> {
  const payload = await request<unknown>("/v1/addresses/recognize", { method: "PUT", body })
  return parseAddressRecord(payload)
}

export async function getRates(body: unknown): Promise<Rate[]> {
  const payload = await request<unknown>("/v1/rates", { method: "POST", body })
  return list(payload, "rates").map(parseRate)
}

export async function estimateRates(body: unknown): Promise<Rate[]> {
  const payload = await request<unknown>("/v1/rates/estimate", { method: "POST", body })
  return list(payload, "rates").map(parseRate)
}

export async function getRate(rateId: string): Promise<Rate> {
  const payload = await request<unknown>(`/v1/rates/${encodeURIComponent(rateId)}`)
  return parseRate(payload)
}

export async function listShipments(page?: number, pageSize?: number): Promise<Shipment[]> {
  const payload = await request<unknown>("/v1/shipments", { query: { page, page_size: pageSize } })
  return list(payload, "shipments").map(parseShipment)
}

export async function createShipment(body: unknown): Promise<Shipment> {
  const payload = await request<unknown>("/v1/shipments", { method: "POST", body })
  return parseShipment(payload)
}

export async function getShipment(shipmentId: string): Promise<Shipment> {
  const payload = await request<unknown>(`/v1/shipments/${encodeURIComponent(shipmentId)}`)
  return parseShipment(payload)
}

export async function cancelShipment(shipmentId: string): Promise<Shipment> {
  const payload = await request<unknown>(`/v1/shipments/${encodeURIComponent(shipmentId)}/cancel`, { method: "PUT", body: {} })
  return parseShipment(payload)
}

export async function getShipmentRates(shipmentId: string): Promise<Rate[]> {
  const payload = await request<unknown>(`/v1/shipments/${encodeURIComponent(shipmentId)}/rates`)
  return list(payload, "rates").map(parseRate)
}

export async function listLabels(page?: number, pageSize?: number): Promise<Label[]> {
  const payload = await request<unknown>("/v1/labels", { query: { page, page_size: pageSize } })
  return list(payload, "labels").map(parseLabel)
}

export async function createLabel(body: unknown): Promise<Label> {
  const payload = await request<unknown>("/v1/labels", { method: "POST", body })
  return parseLabel(payload)
}

export async function trackLabel(labelId: string): Promise<TrackingInfo> {
  const payload = await request<unknown>(`/v1/labels/${encodeURIComponent(labelId)}/track`)
  return parseTracking(payload)
}

export async function voidLabel(labelId: string): Promise<Label> {
  const payload = await request<unknown>(`/v1/labels/${encodeURIComponent(labelId)}/void`, { method: "PUT", body: {} })
  return parseLabel(payload)
}

export async function trackPackage(carrierCode: string, trackingNumber: string): Promise<TrackingInfo> {
  const payload = await request<unknown>("/v1/tracking", { query: { carrier_code: carrierCode, tracking_number: trackingNumber } })
  return parseTracking(payload)
}

export async function listWarehouses(): Promise<Warehouse[]> {
  const payload = await request<unknown>("/v1/warehouses")
  return list(payload, "warehouses").map(parseWarehouse)
}

export async function listBatches(page?: number, pageSize?: number): Promise<Batch[]> {
  const payload = await request<unknown>("/v1/batches", { query: { page, page_size: pageSize } })
  return list(payload, "batches").map(parseBatch)
}

export async function getBatch(batchId: string): Promise<Batch> {
  const payload = await request<unknown>(`/v1/batches/${encodeURIComponent(batchId)}`)
  return parseBatch(payload)
}

// ---------- formatters ----------

function money(v: { currency?: string; amount?: number } | undefined): string {
  if (!v || v.amount === undefined) return "n/a"
  return `${v.amount.toFixed(2)} ${v.currency ?? ""}`.trim()
}

export function formatCarrier(c: Carrier): string {
  const parts = [c.friendlyName ?? c.carrierId ?? "unknown carrier"]
  if (c.carrierId) parts.push(`(${c.carrierId})`)
  if (c.nickname) parts.push(`nickname: ${c.nickname}`)
  if (c.accountNumber) parts.push(`account: ${c.accountNumber}`)
  if (c.balance !== undefined) parts.push(`balance: ${c.balance.toFixed(2)}`)
  if (c.primary) parts.push("primary")
  return parts.join(" · ")
}

export function formatCarrierService(s: CarrierService): string {
  const parts = [s.name ?? s.serviceCode ?? "unknown service"]
  if (s.serviceCode) parts.push(`code: ${s.serviceCode}`)
  const scope = [s.domestic ? "domestic" : undefined, s.international ? "international" : undefined].filter(Boolean).join("+")
  if (scope) parts.push(scope)
  if (s.isMultiPackageSupported) parts.push("multi-package")
  return parts.join(" · ")
}

export function formatPackageType(p: PackageType): string {
  const parts = [p.name ?? p.packageCode ?? "unknown package"]
  if (p.packageCode) parts.push(`code: ${p.packageCode}`)
  if (p.description) parts.push(p.description)
  return parts.join(" · ")
}

export function formatAddress(a: AddressRecord): string {
  const addr = a.address ?? {}
  const line = [addr.addressLine1, addr.addressLine2, addr.cityLocality, addr.stateProvince, addr.postalCode, addr.countryCode]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(", ")
  const parts = [addr.name ?? "address"]
  if (a.status) parts.push(`status: ${a.status}`)
  if (line) parts.push(line)
  const messages = (a.messages ?? []).length
  if (messages > 0) parts.push(`${messages} message(s)`)
  return parts.join(" · ")
}

export function formatRate(r: Rate): string {
  const parts = [`${r.carrierFriendlyName ?? r.carrierId ?? "carrier"} ${r.serviceType ?? r.serviceCode ?? ""}`.trim()]
  parts.push(`total: ${money(r.shippingAmount)}`)
  if (r.deliveryDays !== undefined) parts.push(`${r.deliveryDays} day(s)`)
  if (r.estimatedDeliveryDate) parts.push(`eta: ${r.estimatedDeliveryDate}`)
  if (r.rateId) parts.push(`rate_id: ${r.rateId}`)
  return parts.join(" · ")
}

export function formatShipment(s: Shipment): string {
  const parts = [`shipment ${s.shipmentId ?? "unknown"}`]
  if (s.shipmentStatus) parts.push(`status: ${s.shipmentStatus}`)
  if (s.carrierId) parts.push(`carrier: ${s.carrierId}`)
  if (s.serviceCode) parts.push(`service: ${s.serviceCode}`)
  const pkgCount = (s.packages ?? []).length
  if (pkgCount > 0) parts.push(`${pkgCount} package(s)`)
  if (s.createdAt) parts.push(`created: ${s.createdAt}`)
  return parts.join(" · ")
}

export function formatLabel(l: Label): string {
  const parts = [`label ${l.labelId ?? "unknown"}`]
  if (l.status) parts.push(`status: ${l.status}`)
  if (l.trackingNumber) parts.push(`tracking: ${l.trackingNumber}`)
  if (l.carrierId) parts.push(`carrier: ${l.carrierId}`)
  if (l.voided) parts.push("voided")
  if (l.labelDownload?.pdf) parts.push(`pdf: ${l.labelDownload.pdf}`)
  return parts.join(" · ")
}

export function formatTracking(t: TrackingInfo): string {
  const lines: string[] = []
  const head = [`tracking ${t.trackingNumber ?? "unknown"}`]
  if (t.statusDescription ?? t.statusCode) head.push(`status: ${t.statusDescription ?? t.statusCode}`)
  if (t.carrierStatusDescription) head.push(`carrier: ${t.carrierStatusDescription}`)
  if (t.estimatedDeliveryDate) head.push(`eta: ${t.estimatedDeliveryDate}`)
  if (t.actualDeliveryDate) head.push(`delivered: ${t.actualDeliveryDate}`)
  if (t.exceptionDescription) head.push(`exception: ${t.exceptionDescription}`)
  lines.push(head.join(" · "))
  for (const e of t.events ?? []) {
    const when = e.occurredAt ?? e.carrierOccurredAt ?? "time unknown"
    const where = [e.cityLocality, e.stateProvince, e.countryCode].filter((v): v is string => typeof v === "string" && v.length > 0).join(", ")
    lines.push(`  - ${when} ${e.description ?? e.statusCode ?? "event"}${where ? ` (${where})` : ""}`)
  }
  return lines.join("\n")
}

export function formatWarehouse(w: Warehouse): string {
  const parts = [w.name ?? w.warehouseId ?? "warehouse"]
  if (w.warehouseId) parts.push(`id: ${w.warehouseId}`)
  if (w.isDefault) parts.push("default")
  const city = str(w.originAddress?.["city_locality"])
  if (city) parts.push(city)
  return parts.join(" · ")
}

export function formatBatch(b: Batch): string {
  const parts = [`batch ${b.batchId ?? "unknown"}`]
  if (b.status) parts.push(`status: ${b.status}`)
  if (b.batchShipmentCount !== undefined) parts.push(`${b.batchShipmentCount} shipment(s)`)
  if (b.labelLayout) parts.push(`layout: ${b.labelLayout}`)
  const errors = (b.errors ?? []).length
  if (errors > 0) parts.push(`${errors} error(s)`)
  return parts.join(" · ")
}
