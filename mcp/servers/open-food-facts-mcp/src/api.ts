const BASE = "https://world.openfoodfacts.org/api/v2"
const H = { "User-Agent": "mrfentmen-open-food-facts-mcp/1.0 (https://github.com/mrfentmen)" }
export class FoodError extends Error {}
async function get(path: string, params: Record<string, string> = {}) { const u = new URL(`${BASE}/${path}`); Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v)); const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new FoodError(`Open Food Facts error ${r.status}`); return r.json() }
export function product(barcode: string) { return get(`product/${encodeURIComponent(barcode)}.json`) }
export function search(query: string, page = "1") { return get("search", { search_terms: query, page, page_size: "10", fields: "code,product_name,brands,ingredients_text,allergens,nutriscore_grade,nutriments" }) }
export function format(x: unknown) { return JSON.stringify(x, null, 2).slice(0, 14000) }
