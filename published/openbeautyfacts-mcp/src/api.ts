/**
 * Open Beauty Facts — keyless public API client.
 */
const BASE = "https://world.openbeautyfacts.org"
const SOURCE = "Open Beauty Facts"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "openbeautyfacts-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

const FIELDS = "code,product_name,brands,quantity,categories,ingredients_text,labels_countries"

function productLine(p: any): string {
  return `- ${clean(p.product_name) || "(no name)"} (${clean(p.code)}) · ${clean(p.brands) || "brand unknown"}${clean(p.quantity) ? ` · ${clean(p.quantity)}` : ""}`
}

function fullProduct(p: any): string {
  const ingredients = clean(p.ingredients_text)
  return [
    `${clean(p.product_name) || "(no name)"} by ${clean(p.brands) || "unknown brand"}`,
    `Barcode ${clean(p.code)}${clean(p.quantity) ? ` · size ${clean(p.quantity)}` : ""}`,
    clean(p.categories) ? `Categories: ${clean(p.categories)}` : "",
    clean(p.labels) ? `Labels: ${clean(p.labels)}` : "",
    ingredients ? `\nIngredients: ${ingredients.slice(0, 1200)}` : "\nNo ingredient list recorded.",
    `\nRecord: https://world.openbeautyfacts.org/product/${clean(p.code)}`,
  ].filter(Boolean).join("\n")
}

export async function productByBarcode(a: { barcode: string }): Promise<string> {
  const code = clean(a.barcode)
  if (!/^\d{6,14}$/.test(code)) throw new SourceError("barcode must be 6 to 14 digits")
  const d = await getJson(`/api/v2/product/${code}.json?fields=${FIELDS},ingredients_text`)
  if (!d || Number(d.status) !== 1 || !d.product) {
    return `Open Beauty Facts has no product with barcode ${code}.`
  }
  return fullProduct(d.product)
}

export async function searchProducts(a: { term: string; limit?: number }): Promise<string> {
  const term = clean(a.term)
  if (term.length < 2) throw new SourceError("term must be at least 2 characters")
  const limit = a.limit ?? 5
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new SourceError("limit must be between 1 and 20")
  const d = await getJson(`/api/v2/search?search_terms=${encodeURIComponent(term)}&fields=${FIELDS}&page_size=${limit}`)
  const rows: any[] = Array.isArray(d?.products) ? d.products : []
  if (!rows.length) return `No Open Beauty Facts product matches "${term}".`
  return [
    `${d.count ?? rows.length} product(s) match "${term}", showing ${rows.length}:`,
    "",
    ...rows.map(productLine),
  ].join("\n")
}

export async function searchByBrand(a: { brand: string; limit?: number }): Promise<string> {
  const brand = clean(a.brand).toLowerCase()
  if (brand.length < 2) throw new SourceError("brand must be at least 2 characters")
  if (!/^[a-z0-9 .&'-]{2,40}$/.test(brand)) throw new SourceError("brand must be letters, digits or simple punctuation")
  const limit = a.limit ?? 5
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new SourceError("limit must be between 1 and 20")
  const d = await getJson(`/api/v2/search?brands_tags=${encodeURIComponent(brand)}&fields=${FIELDS}&page_size=${limit}`)
  const rows: any[] = Array.isArray(d?.products) ? d.products : []
  if (!rows.length) return `No Open Beauty Facts product is tagged with brand "${brand}".`
  return [
    `${d.count ?? rows.length} product(s) from brand "${brand}", showing ${rows.length}:`,
    "",
    ...rows.map(productLine),
  ].join("\n")
}
