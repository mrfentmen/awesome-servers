/**
 * Digi-Key API v4 client.
 *
 * Auth is OAuth2 client-credentials. The bearer token is fetched once and
 * cached in memory until shortly before it expires. Product calls need both
 * the bearer token and the X-DIGIKEY-Client-Id header.
 *
 * Pricing comes back in the account's customer currency, so numbers are not
 * necessarily USD.
 */
const BASE = "https://api.digikey.com"
const TOKEN_URL = `${BASE}/v1/oauth2/token`

export class DigiKeyError extends Error {}

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

let cached: { token: string; expiresAt: number } | null = null

function credentials(): { id: string; secret: string } {
  const id = process.env.DIGIKEY_CLIENT_ID
  const secret = process.env.DIGIKEY_CLIENT_SECRET
  if (!id) throw new DigiKeyError("Missing DIGIKEY_CLIENT_ID environment variable")
  if (!secret) throw new DigiKeyError("Missing DIGIKEY_CLIENT_SECRET environment variable")
  return { id, secret }
}

export async function getToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now()) return cached.token

  const { id, secret } = credentials()
  const form = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: id,
    client_secret: secret,
  })

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: form.toString(),
    signal: AbortSignal.timeout(25000),
  })

  const text = await res.text()
  let data: TokenResponse = {}
  try {
    data = JSON.parse(text) as TokenResponse
  } catch {
    throw new DigiKeyError(`Digi-Key token endpoint returned ${res.status} and no JSON`)
  }

  if (!res.ok || !data.access_token) {
    const reason = data.error_description ?? data.error ?? "no access_token in response"
    throw new DigiKeyError(`Digi-Key auth failed (${res.status}): ${reason}`)
  }

  const ttlMs = (data.expires_in ?? 600) * 1000
  const usableMs = Math.max(ttlMs - 60000, 30000)
  cached = { token: data.access_token, expiresAt: Date.now() + usableMs }
  return cached.token
}

async function call<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  const { id } = credentials()
  const token = await getToken()

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "X-DIGIKEY-Client-Id": id,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  })

  const text = await res.text()

  if (!res.ok) {
    let detail = text.slice(0, 300)
    try {
      const parsed = JSON.parse(text) as { Errors?: { Message?: string }[] }
      const messages = (parsed.Errors ?? []).map((e) => e.Message).filter((m): m is string => !!m)
      if (messages.length > 0) detail = messages.join("; ")
    } catch {
      // keep raw text
    }
    throw new DigiKeyError(`Digi-Key error ${res.status}: ${detail}`)
  }

  if (!text.trim()) return {} as T
  return JSON.parse(text) as T
}

interface ProductDescription {
  ProductDescription?: string
  DetailedDescription?: string
}

interface Manufacturer {
  Name?: string
}

interface StandardPrice {
  BreakQuantity?: number
  UnitPrice?: number
  TotalPrice?: number
}

interface ProductVariation {
  DigiKeyProductNumber?: string
  PackageType?: { Name?: string }
  QuantityAvailableforPackageType?: number
  MinimumOrderQuantity?: number
  StandardPricing?: StandardPrice[]
}

interface Product {
  ManufacturerProductNumber?: string
  Manufacturer?: Manufacturer
  Description?: ProductDescription
  Category?: { Name?: string }
  ProductVariations?: ProductVariation[]
  DatasheetUrl?: string
  ProductUrl?: string
  Status?: { Status?: string }
}

interface PricingProduct extends Product {
  QuantityAvailable?: number
  ManufacturerPublicQuantity?: number
  ManufacturerLeadWeeks?: string
}

export interface KeywordSearchResponse {
  Products?: Product[]
  ProductsCount?: number
  ExactManufacturerProductsCount?: number
}

export interface ProductDetailsResponse {
  Product?: Product
}

export interface PricingResponse {
  ProductPricings?: PricingProduct[]
}

export interface AssociatedProductsResponse {
  Products?: Product[]
  ProductCount?: number
}

export interface MediaResponse {
  ProductMedia?: { Title?: string; MediaType?: string; Url?: string; ThumbnailUrl?: string }[]
}

export interface CategoriesResponse {
  Categories?: { CategoryId?: number; Name?: string; ProductCount?: number; ChildCategories?: { CategoryId?: number; Name?: string }[] }[]
}

export async function searchKeywords(keywords: string, limit = 10, offset = 0): Promise<KeywordSearchResponse> {
  return call<KeywordSearchResponse>("/products/v4/search/keyword", "POST", {
    Keywords: keywords,
    RecordCount: Math.min(Math.max(limit, 1), 50),
    RecordStartPosition: Math.max(offset, 0),
  })
}

export async function getProductDetails(productNumber: string): Promise<ProductDetailsResponse> {
  return call<ProductDetailsResponse>(
    `/products/v4/search/${encodeURIComponent(productNumber)}/productdetails`,
    "POST",
    {}
  )
}

export async function getPricing(productNumber: string, quantity?: number): Promise<PricingResponse> {
  const body: { Quantity?: number } = {}
  if (quantity !== undefined) body.Quantity = quantity
  return call<PricingResponse>(
    `/products/v4/search/${encodeURIComponent(productNumber)}/pricing`,
    "POST",
    body
  )
}

export async function getAssociatedProducts(productNumber: string): Promise<AssociatedProductsResponse> {
  return call<AssociatedProductsResponse>(
    `/products/v4/search/${encodeURIComponent(productNumber)}/associatedproducts`,
    "POST",
    {}
  )
}

export async function getMedia(productNumber: string): Promise<MediaResponse> {
  return call<MediaResponse>(`/products/v4/search/${encodeURIComponent(productNumber)}/media`, "POST", {})
}

export async function getCategories(): Promise<CategoriesResponse> {
  return call<CategoriesResponse>("/products/v4/categories", "GET")
}

export function formatProduct(p: Product, index?: number): string {
  const lines: string[] = []
  const head = p.ManufacturerProductNumber ?? "(unknown part)"
  const maker = p.Manufacturer?.Name ? ` — ${p.Manufacturer.Name}` : ""
  lines.push(`${index !== undefined ? `${index + 1}. ` : ""}${head}${maker}`)
  if (p.Description?.ProductDescription) lines.push(p.Description.ProductDescription)
  else if (p.Description?.DetailedDescription) lines.push(p.Description.DetailedDescription)
  if (p.Category?.Name) lines.push(`Category: ${p.Category.Name}`)
  if (p.Status?.Status) lines.push(`Status: ${p.Status.Status}`)

  for (const v of p.ProductVariations ?? []) {
    const dk = v.DigiKeyProductNumber ?? "?"
    const pkg = v.PackageType?.Name ? ` (${v.PackageType.Name})` : ""
    const stock = v.QuantityAvailableforPackageType
    const moq = v.MinimumOrderQuantity
    const prices = (v.StandardPricing ?? [])
      .slice(0, 3)
      .map((s) => `${s.BreakQuantity ?? "?"}+ @ ${s.UnitPrice ?? "?"}`)
      .join(", ")
    lines.push(
      `  ${dk}${pkg}${stock !== undefined ? ` | stock ${stock}` : ""}${moq !== undefined ? ` | MOQ ${moq}` : ""}${
        prices ? ` | ${prices}` : ""
      }`
    )
  }

  if (p.DatasheetUrl) lines.push(`Datasheet: ${p.DatasheetUrl}`)
  return lines.join("\n")
}

export function formatPricing(p: PricingProduct): string {
  const lines: string[] = []
  lines.push(`${p.ManufacturerProductNumber ?? "(unknown part)"}${p.Manufacturer?.Name ? ` — ${p.Manufacturer.Name}` : ""}`)

  if (p.QuantityAvailable !== undefined) lines.push(`Total available: ${p.QuantityAvailable}`)
  if (p.ManufacturerLeadWeeks) lines.push(`Manufacturer lead time: ${p.ManufacturerLeadWeeks} weeks`)

  for (const v of p.ProductVariations ?? []) {
    lines.push(`  ${v.DigiKeyProductNumber ?? "?"} ${v.PackageType?.Name ? `(${v.PackageType.Name})` : ""}`)
    lines.push(`    available: ${v.QuantityAvailableforPackageType ?? "?"}, MOQ: ${v.MinimumOrderQuantity ?? "?"}`)
    for (const tier of v.StandardPricing ?? []) {
      lines.push(`    ${tier.BreakQuantity ?? "?"}+  ${tier.UnitPrice ?? "?"} each`)
    }
  }

  return lines.join("\n")
}

export function formatMedia(m: MediaResponse): string {
  const items = m.ProductMedia ?? []
  if (items.length === 0) return "No media for this part."
  return items
    .map((i, n) => `${n + 1}. ${i.Title ?? i.MediaType ?? "media"} — ${i.Url ?? i.ThumbnailUrl ?? "no url"}`)
    .join("\n")
}

export function formatCategories(c: CategoriesResponse): string {
  const items = c.Categories ?? []
  if (items.length === 0) return "No categories returned."
  return items
    .map((cat) => {
      const kids = (cat.ChildCategories ?? []).map((k) => k.Name).filter(Boolean)
      const count = cat.ProductCount !== undefined ? ` (${cat.ProductCount} products)` : ""
      return `• ${cat.Name ?? cat.CategoryId ?? "category"}${count}${kids.length ? `\n    ${kids.join(", ")}` : ""}`
    })
    .join("\n")
}
