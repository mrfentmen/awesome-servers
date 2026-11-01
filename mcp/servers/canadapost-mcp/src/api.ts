/**
 * Canada Post client.
 *
 * Canada Post only speaks XML: requests are XML documents and every
 * response is XML unless you ask for a shipping artifact (PDF). There is
 * no JSON API, so this module keeps a couple of tiny tag extractors
 * instead of pulling in an XML parser.
 */
const BASE = "https://ct.soa-gw.canadapost.ca"

const ACCEPT = {
  rate: "application/vnd.cpc.ship.rate-v4+xml",
  track: "application/vnd.cpc.track-v2+xml",
  postOffice: "application/vnd.cpc.postofficefind-v2+xml",
  shipment: "application/vnd.cpc.ncshipment-v4+xml",
  manifest: "application/vnd.cpc.manifest-v8+xml",
  pickup: "application/vnd.cpc.pickuprequest-v3+xml",
} as const

export class CpError extends Error {}

export interface RateQuote {
  serviceCode: string
  serviceName: string
  due: string
  base?: string
  gst?: string
  pst?: string
  hst?: string
  guaranteed?: string
}

export interface TrackingEvent {
  date: string
  time: string
  description: string
  location?: string
}

export interface TrackingResult {
  pin: string
  events: TrackingEvent[]
}

export interface PostOffice {
  id?: string
  name: string
  line1?: string
  city?: string
  province?: string
  postalCode?: string
  distance?: string
}

export interface ShipmentInfo {
  shipmentId?: string
  trackingPin?: string
  status?: string
  serviceCode?: string
  links: Array<{ rel: string; href: string }>
}

export interface ManifestInfo {
  poNumber?: string
  links: Array<{ rel: string; href: string }>
}

export interface Address {
  name: string
  company?: string
  phone?: string
  line1: string
  city: string
  province: string
  postalCode: string
}

export interface ShipmentRequest {
  serviceCode: string
  sender: Address
  destination: Address
  weightKg: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  reference?: string
}

export interface PickupRequest {
  pickupType: "Station" | "OnDemand" | "OnDemandPremium"
  name: string
  company?: string
  phone: string
  line1: string
  city: string
  province: string
  postalCode: string
  pickupDate: string
  readyTime: string
  closeTime: string
  instructions?: string
}

export interface Artifact {
  contentType: string
  bytes: number
}

interface Credentials {
  key: string
  password: string
  customer: string
  mobo: string
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new CpError(`Missing ${name}. Set it in the environment before using Canada Post.`)
  return value
}

function credentials(): Credentials {
  const customer = requireEnv("CANADAPOST_CUSTOMER_NUMBER")
  return {
    key: requireEnv("CANADAPOST_API_KEY"),
    password: requireEnv("CANADAPOST_API_PASSWORD"),
    customer,
    mobo: process.env.CANADAPOST_MOBO ?? customer,
  }
}

/** Collapse CDATA, entities and whitespace out of an XML fragment. */
export function cleanText(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** First value of a tag, tags may carry attributes and namespaces. */
export function pick(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"))
  return match ? cleanText(match[1]) : undefined
}

/** Every value of a repeated tag. */
export function pickAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "gi")
  const out: string[] = []
  let match: RegExpExecArray | null
  while ((match = re.exec(xml)) !== null) out.push(match[1])
  return out
}

/** Self-closing `<link rel="..." href="..." />` elements. */
export function pickLinks(xml: string): Array<{ rel: string; href: string }> {
  const out: Array<{ rel: string; href: string }> = []
  const re = /<link\b([^>]*)\/?>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(xml)) !== null) {
    const rel = match[1].match(/rel="([^"]+)"/i)?.[1]
    const href = match[1].match(/href="([^"]+)"/i)?.[1]
    if (rel && href) out.push({ rel, href })
  }
  return out
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/** Canada Post wants postal codes without spaces. */
function postal(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase()
}

async function call(
  path: string,
  options: { method?: string; accept: string; body?: string; contentType?: string }
): Promise<string> {
  const creds = credentials()
  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(`${creds.key}:${creds.password}`).toString("base64")}`,
    Accept: options.accept,
    "Accept-Language": "en-CA",
  }
  if (options.body) headers["Content-Type"] = options.contentType ?? options.accept

  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body,
    signal: AbortSignal.timeout(25000),
  })
  const text = await res.text()
  if (!res.ok) {
    const detail =
      pick(text, "message") ?? pick(text, "description") ?? pick(text, "reason") ?? text.slice(0, 300)
    throw new CpError(`Canada Post error ${res.status}: ${cleanText(detail)}`)
  }
  return text
}

export async function getRates(input: {
  originPostalCode: string
  destinationPostalCode: string
  weightKg: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
}): Promise<RateQuote[]> {
  const creds = credentials()
  const dimensions =
    input.lengthCm && input.widthCm && input.heightCm
      ? `<dimensions><length>${input.lengthCm}</length><width>${input.widthCm}</width><height>${input.heightCm}</height></dimensions>`
      : ""

  const body =
    `<mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">` +
    `<customer-number>${escapeXml(creds.customer)}</customer-number>` +
    `<parcel-characteristics><weight>${input.weightKg}</weight>${dimensions}</parcel-characteristics>` +
    `<origin-postal-code>${escapeXml(postal(input.originPostalCode))}</origin-postal-code>` +
    `<destination><domestic><postal-code>${escapeXml(postal(input.destinationPostalCode))}</postal-code></domestic></destination>` +
    `</mailing-scenario>`

  const xml = await call("/rs/ship/price", { method: "POST", accept: ACCEPT.rate, body })

  return pickAll(xml, "price-quote").map((quote) => {
    const details = pick(quote, "price-details") ?? ""
    return {
      serviceCode: pick(quote, "service-code") ?? "",
      serviceName: pick(quote, "service-name") ?? "",
      due: pick(details, "due") ?? "",
      base: pick(details, "base"),
      gst: pick(details, "gst"),
      pst: pick(details, "pst"),
      hst: pick(details, "hst"),
      guaranteed: pick(quote, "guaranteed"),
    }
  })
}

export async function trackPackage(pin: string): Promise<TrackingResult> {
  const xml = await call(`/vis/track/pin/${encodeURIComponent(pin)}/detail`, {
    accept: ACCEPT.track,
  })
  const events = pickAll(xml, "occurrence").map((occurrence) => ({
    date: pick(occurrence, "event-date") ?? "",
    time: pick(occurrence, "event-time") ?? "",
    description: pick(occurrence, "event-description") ?? "",
    location: pick(occurrence, "event-location") ?? pick(occurrence, "office-name"),
  }))
  return { pin: pick(xml, "pin") ?? pin, events }
}

export async function findPostOffices(input: {
  postalCode: string
  maxResults?: number
}): Promise<PostOffice[]> {
  const query = `dto=${encodeURIComponent(postal(input.postalCode))}&lang=en&max=${input.maxResults ?? 5}`
  const xml = await call(`/rs/postoffice?${query}`, { accept: ACCEPT.postOffice })

  return pickAll(xml, "post-office-detail").map((office) => {
    const address = pick(office, "address") ?? ""
    return {
      id: pick(office, "post-office-id"),
      name: pick(office, "name") ?? "Post office",
      line1: pick(address, "line-1") ?? pick(address, "line-2"),
      city: pick(address, "city"),
      province: pick(address, "province") ?? pick(address, "prov-state"),
      postalCode: pick(address, "postal-code"),
      distance: pick(office, "distance"),
    }
  })
}

function addressXml(address: Address): string {
  const company = address.company ? `<company>${escapeXml(address.company)}</company>` : ""
  const phone = address.phone ? `<contact-phone>${escapeXml(address.phone)}</contact-phone>` : ""
  return (
    `<name>${escapeXml(address.name)}</name>${company}${phone}` +
    `<address-details>` +
    `<address-line-1>${escapeXml(address.line1)}</address-line-1>` +
    `<city>${escapeXml(address.city)}</city>` +
    `<prov-state>${escapeXml(address.province)}</prov-state>` +
    `<postal-zip-code>${escapeXml(postal(address.postalCode))}</postal-zip-code>` +
    `</address-details>`
  )
}

export async function createShipment(input: ShipmentRequest): Promise<ShipmentInfo> {
  const creds = credentials()
  const dimensions =
    input.lengthCm && input.widthCm && input.heightCm
      ? `<dimensions><length>${input.lengthCm}</length><width>${input.widthCm}</width><height>${input.heightCm}</height></dimensions>`
      : ""
  const reference = input.reference
    ? `<references><customer-ref-1>${escapeXml(input.reference)}</customer-ref-1></references>`
    : ""

  const body =
    `<non-contract-shipment xmlns="http://www.canadapost.ca/ws/ncshipment-v4">` +
    `<delivery-spec>` +
    `<service-code>${escapeXml(input.serviceCode)}</service-code>` +
    reference +
    `<sender>${addressXml(input.sender)}</sender>` +
    `<destination>${addressXml(input.destination)}</destination>` +
    `<parcel-characteristics><weight>${input.weightKg}</weight>${dimensions}</parcel-characteristics>` +
    `<preferences><show-posting-instructions>false</show-posting-instructions></preferences>` +
    `</delivery-spec></non-contract-shipment>`

  const xml = await call(`/rs/${creds.customer}/${creds.mobo}/shipment`, {
    method: "POST",
    accept: ACCEPT.shipment,
    body,
  })

  return {
    shipmentId: pick(xml, "shipment-id"),
    trackingPin: pick(xml, "tracking-pin") ?? pick(xml, "tracking-number"),
    status: pick(xml, "status"),
    serviceCode: pick(xml, "service-code"),
    links: pickLinks(xml),
  }
}

export async function getShipment(shipmentId: string): Promise<ShipmentInfo> {
  const creds = credentials()
  const xml = await call(
    `/rs/${creds.customer}/${creds.mobo}/shipment/${encodeURIComponent(shipmentId)}`,
    { accept: ACCEPT.shipment }
  )
  return {
    shipmentId: pick(xml, "shipment-id") ?? shipmentId,
    trackingPin: pick(xml, "tracking-pin"),
    status: pick(xml, "shipment-status") ?? pick(xml, "status"),
    serviceCode: pick(xml, "service-code"),
    links: pickLinks(xml),
  }
}

export async function getShipmentDetails(shipmentId: string): Promise<ShipmentInfo> {
  const creds = credentials()
  const xml = await call(
    `/rs/${creds.customer}/${creds.mobo}/shipment/${encodeURIComponent(shipmentId)}/details`,
    { accept: ACCEPT.shipment }
  )
  return {
    shipmentId: pick(xml, "shipment-id") ?? shipmentId,
    trackingPin: pick(xml, "tracking-pin"),
    status: pick(xml, "shipment-status") ?? pick(xml, "status"),
    serviceCode: pick(xml, "service-code"),
    links: pickLinks(xml),
  }
}

export async function getShipmentArtifact(
  shipmentId: string,
  artifactType: "label" | "manifest" | "receipt"
): Promise<Artifact> {
  const creds = credentials()
  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(`${creds.key}:${creds.password}`).toString("base64")}`,
    Accept: "application/pdf",
    "Accept-Language": "en-CA",
  }
  const res = await fetch(
    `${BASE}/rs/${creds.customer}/${creds.mobo}/shipment/${encodeURIComponent(shipmentId)}/artifact/${artifactType}`,
    { headers, signal: AbortSignal.timeout(25000) }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new CpError(`Canada Post error ${res.status}: ${cleanText(pick(text, "message") ?? text.slice(0, 200))}`)
  }
  const buffer = await res.arrayBuffer()
  return {
    contentType: res.headers.get("content-type") ?? "application/pdf",
    bytes: buffer.byteLength,
  }
}

export async function getManifest(start: string, end: string): Promise<ManifestInfo> {
  const creds = credentials()
  const xml = await call(
    `/rs/${creds.customer}/${creds.mobo}/manifest?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    { accept: ACCEPT.manifest }
  )
  return { poNumber: pick(xml, "po-number"), links: pickLinks(xml) }
}

export async function requestPickup(input: PickupRequest): Promise<{ pickupId?: string }> {
  const creds = credentials()
  const instructions = input.instructions
    ? `<special-instructions>${escapeXml(input.instructions)}</special-instructions>`
    : ""
  const company = input.company ? `<company>${escapeXml(input.company)}</company>` : ""

  const body =
    `<pickup-request xmlns="http://www.canadapost.ca/ws/pickuprequest">` +
    `<pickup-type>${escapeXml(input.pickupType)}</pickup-type>` +
    `<pickup-location>` +
    `<business-address>` +
    `<business-name>${escapeXml(input.name)}</business-name>` +
    company +
    `<contact-phone>${escapeXml(input.phone)}</contact-phone>` +
    `<address-line-1>${escapeXml(input.line1)}</address-line-1>` +
    `<city>${escapeXml(input.city)}</city>` +
    `<province>${escapeXml(input.province)}</province>` +
    `<postal-code>${escapeXml(postal(input.postalCode))}</postal-code>` +
    `</business-address>` +
    `<pickup-volume>1</pickup-volume>` +
    `<pickup-times>` +
    `<pickup-time>` +
    `<pickup-date>${escapeXml(input.pickupDate)}</pickup-date>` +
    `<ready-time>${escapeXml(input.readyTime)}</ready-time>` +
    `<close-time>${escapeXml(input.closeTime)}</close-time>` +
    `</pickup-time></pickup-times>` +
    instructions +
    `</pickup-location>` +
    `</pickup-request>`

  const xml = await call(`/rs/${creds.customer}/${creds.mobo}/pickuprequest`, {
    method: "POST",
    accept: ACCEPT.pickup,
    body,
  })
  return { pickupId: pick(xml, "pickup-id") }
}

export async function getPickup(pickupId: string): Promise<{ pickupId?: string; status?: string }> {
  const creds = credentials()
  const xml = await call(
    `/rs/${creds.customer}/${creds.mobo}/pickuprequest/${encodeURIComponent(pickupId)}/details`,
    { accept: ACCEPT.pickup }
  )
  return { pickupId: pick(xml, "pickup-id") ?? pickupId, status: pick(xml, "pickup-status") }
}

export function formatRates(quotes: RateQuote[], origin: string, destination: string): string {
  if (quotes.length === 0) return `No rates returned for ${postal(origin)} to ${postal(destination)}.`
  const lines = quotes.map((quote, index) => {
    const taxes = [quote.gst, quote.pst, quote.hst].filter(Boolean).join(" + ")
    return [
      `${index + 1}. ${quote.serviceName || quote.serviceCode} (${quote.serviceCode})`,
      `   Total: ${quote.due}${quote.base ? ` (base ${quote.base})` : ""}`,
      taxes ? `   Taxes: ${taxes}` : "",
      quote.guaranteed ? `   Guaranteed: ${quote.guaranteed}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  })
  return `Rates ${postal(origin)} -> ${postal(destination)}:\n\n${lines.join("\n\n")}`
}

export function formatTracking(result: TrackingResult): string {
  if (result.events.length === 0) return `No tracking events for ${result.pin} yet.`
  const lines = result.events.map((event, index) => {
    const when = [event.date, event.time].filter(Boolean).join(" ")
    const where = event.location ? ` (${event.location})` : ""
    return `${index + 1}. ${when} - ${event.description}${where}`
  })
  return `Tracking ${result.pin}:\n\n${lines.join("\n")}`
}

export function formatPostOffices(offices: PostOffice[]): string {
  if (offices.length === 0) return "No post offices found near that postal code."
  return offices
    .map((office, index) => {
      const address = [office.line1, office.city, office.province, office.postalCode]
        .filter(Boolean)
        .join(", ")
      const distance = office.distance ? ` - ${office.distance}` : ""
      return `${index + 1}. ${office.name}${distance}\n   ${address || "Address not published"}`
    })
    .join("\n\n")
}

export function formatShipment(shipment: ShipmentInfo): string {
  const lines = [
    `Shipment: ${shipment.shipmentId ?? "unknown"}`,
    shipment.trackingPin ? `Tracking pin: ${shipment.trackingPin}` : "",
    shipment.status ? `Status: ${shipment.status}` : "",
    shipment.serviceCode ? `Service: ${shipment.serviceCode}` : "",
  ].filter(Boolean)
  if (shipment.links.length > 0) {
    lines.push(`Links: ${shipment.links.map((link) => `${link.rel} -> ${link.href}`).join("; ")}`)
  }
  return lines.join("\n")
}
