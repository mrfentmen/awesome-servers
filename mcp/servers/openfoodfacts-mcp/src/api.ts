/**
 * Open Food Facts — Food product ingredients, nutrition and Nutri-Score by barcode. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against world.openfoodfacts.org.
 */
const API = "https://world.openfoodfacts.org"

export class OpenFoodFactsError extends Error {}

type Row = Record<string, unknown>

const val = (v: unknown): string => {
  if (typeof v === "string") return v
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : ""
  if (Array.isArray(v)) return v.length > 0 ? val(v[0]) : ""
  if (v && typeof v === "object") {
    const o = v as Row
    if ("en" in o) return val(o.en)
    const first = Object.values(o)[0]
    return first === undefined ? "" : val(first)
  }
  return ""
}

const at = (o: unknown, path: string): unknown =>
  path === "" ? o : path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Row)[k] : undefined), o)

const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : [])

async function get<T>(url: string, init?: RequestInit, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "user-agent": "openfoodfacts-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new OpenFoodFactsError(`Open Food Facts returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof OpenFoodFactsError) throw e
    if ((e as Error).name === "AbortError") throw new OpenFoodFactsError("Open Food Facts request timed out")
    throw new OpenFoodFactsError(`Open Food Facts request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function getProduct(barcode: string): Promise<string> {
  const code = barcode.trim()
  if (!/^\d{6,14}$/.test(code)) throw new OpenFoodFactsError("barcode must be 6 to 14 digits")
  const body = await get<unknown>(`${API}/api/v2/product/${code}.json`)
  if (val(at(body, "status")) === "0") return `Open Food Facts has no product for barcode ${code}.`
  const p = at(body, "product")
  const kcal = val(at(p, "nutriments.energy-kcal_100g"))
  return [
    `${val(at(p, "product_name"))} — ${val(at(p, "brands"))}`,
    "",
    `Barcode: ${code}`,
    `Nutri-Score: ${val(at(p, "nutriscore_grade"))}`,
    `Nova group: ${val(at(p, "nova_group"))}`,
    `Energy: ${kcal === "" ? "n/a" : kcal + " kcal/100g"}`,
    `Ingredients: ${val(at(p, "ingredients_text")).slice(0, 300)}`,
  ].join("\n")
}

export async function searchProducts(query: string, limit = 5): Promise<string> {
  const q = query.trim()
  if (q === "") throw new OpenFoodFactsError("query must not be empty")
  const size = Math.min(20, Math.max(1, limit))
  const body = await get<unknown>(`${API}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=${size}`)
  const items = rows(at(body, "products"))
  if (items.length === 0) return `Open Food Facts found nothing for "${q}".`
  const lines = items.map((r, i) => `${i + 1}. ${val(at(r, "product_name"))} — ${val(at(r, "brands"))} (${val(at(r, "code"))})`)
  return [`Open Food Facts for "${q}" — ${items.length} shown`, "", ...lines].join("\n")
}
