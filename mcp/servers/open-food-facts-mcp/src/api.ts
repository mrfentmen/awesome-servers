const BASE = "https://world.openfoodfacts.org/api/v2"
const H = { "User-Agent": "mrfentmen-open-food-facts-mcp/1.0 (https://github.com/mrfentmen)" }
export class FoodError extends Error {}
async function get(path: string, params: Record<string, string> = {}) { const u = new URL(`${BASE}/${path}`); Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v)); const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new FoodError(`Open Food Facts error ${r.status}`); return r.json() }
export function product(barcode: string) { return get(`product/${encodeURIComponent(barcode)}.json`) }
export function search(query: string, page = "1") { return get("search", { search_terms: query, page, page_size: "10", fields: "code,product_name,brands,ingredients_text,allergens,nutriscore_grade,nutriments" }) }
export function format(x: unknown) { return JSON.stringify(x, null, 2).slice(0, 14000) }

// ---- muxC tools:

const OFF_UA = "mrfentmen-open-food-facts-mcp/1.0 (https://github.com/mrfentmen)"

async function offSearch(params: URLSearchParams, ms = 40000): Promise<any> {
  // The legacy search.pl endpoint is the one that still answers ingredient and tag queries.
  // Spreading a URLSearchParams drops it, so the caller's params are copied in explicitly.
  const p = new URLSearchParams({ action: "process", json: "1" })
  for (const [k, v] of params) p.set(k, v)
  const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${p.toString()}`, {
    headers: { "User-Agent": OFF_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(ms),
  })
  if (res.status === 503) throw new FoodError("Open Food Facts is rate limiting this client; it asks for slow, cached requests")
  if (!res.ok) throw new FoodError(`Open Food Facts returned ${res.status}`)
  return await res.json()
}

function brief(p: any, i: number): string {
  const name = p.product_name || p.product_name_en || p.generic_name || "unnamed product"
  return `${i + 1}. ${name}\n   barcode ${p.code ?? "not reported"} | ${p.brands ?? "brand not reported"} | ${p.quantity ?? "size not reported"}\n   nutriscore ${p.nutriscore_grade ?? "not reported"} | countries ${p.countries_tags?.join(", ")?.replace(/^en:/, "") || "not reported"}`
}

