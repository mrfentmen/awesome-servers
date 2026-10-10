/**
 * Spoonacular API client. Needs SPOONACULAR_API_KEY
 * (free at https://spoonacular.com/food-api, 150 calls/day).
 * Docs: https://spoonacular.com/food-api/docs
 */
const BASE = "https://api.spoonacular.com"

export class SpoonacularError extends Error {}

function apiKey(): string {
  const k = process.env.SPOONACULAR_API_KEY
  if (!k) throw new SpoonacularError("Set SPOONACULAR_API_KEY first (free at spoonacular.com/food-api).")
  return k
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string, extra: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ ...extra, apiKey: apiKey() }).toString()
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { "User-Agent": "spoonacular-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new SpoonacularError("Spoonacular refused (401/403). Check API key.")
  if (res.status === 402) throw new SpoonacularError("Spoonacular quota used up (free tier is 150/day).")
  if (res.status === 404) throw new SpoonacularError("Not found.")
  if (!res.ok) throw new SpoonacularError(`Spoonacular error ${res.status}`)
  return (await res.json()) as T
}

export interface Recipe {
  id: number
  title?: string
  minutes?: number
  servings?: number
  image?: string
}

export async function searchRecipes(query: string, limit = 5): Promise<Recipe[]> {
  if (!query.trim()) throw new SpoonacularError("Query is empty.")
  const data = await getJson<Raw>("/recipes/complexSearch", { query: query.trim(), number: String(Math.min(Math.max(limit, 1), 100)), addRecipeInformation: "false" })
  const rows: Raw[] = Array.isArray(data.results) ? data.results : []
  return rows.slice(0, limit).map((r) => ({
    id: Number(r.id),
    title: r.title,
    minutes: r.readyInMinutes,
    servings: r.servings,
    image: r.image,
  }))
}

export async function getRecipe(id: string): Promise<string> {
  if (!/^\d+$/.test(id.trim())) throw new SpoonacularError(`Recipe id must be numeric, got "${id}".`)
  const r = await getJson<Raw>(`/recipes/${id.trim()}/information?includeNutrition=false`)
  const ings: Raw[] = Array.isArray(r.extendedIngredients) ? r.extendedIngredients : []
  const steps: string[] = []
  for (const inst of (r.analyzedInstructions ?? []) as Raw[]) {
    for (const st of ((inst as Raw).steps ?? []) as Raw[]) {
      if (st.step) steps.push(String(st.step))
      if (steps.length >= 8) break
    }
  }
  const lines = [
    `[${r.id ?? id}] ${r.title ?? "(untitled)"}${r.readyInMinutes ? ` — ${r.readyInMinutes} min` : ""}${r.servings ? `, serves ${r.servings}` : ""}`,
    ings.length ? `Ingredients: ${ings.slice(0, 10).map((g) => String(g.original ?? g.name ?? "?")).join("; ")}` : "",
    steps.length ? `Steps:\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : "",
    r.sourceUrl ? `Source: ${r.sourceUrl}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export async function guessNutrition(text: string): Promise<string> {
  if (!text.trim()) throw new SpoonacularError("Text is empty.")
  const data = await getJson<Raw>(`/recipes/guessNutrition?title=${encodeURIComponent(text.trim())}`)
  const cal = (data.calories ?? {}) as Raw
  const fat = (data.fat ?? {}) as Raw
  const protein = (data.protein ?? {}) as Raw
  const carbs = (data.carbs ?? {}) as Raw
  return [
    `Guess for "${text.trim().slice(0, 60)}"`,
    `Calories: ${cal.value ?? "?"}${cal.unit ?? ""}`,
    `Fat: ${fat.value ?? "?"}${fat.unit ?? ""} · Protein: ${protein.value ?? "?"}${protein.unit ?? ""} · Carbs: ${carbs.value ?? "?"}${carbs.unit ?? ""}`,
  ].join("\n")
}

export function formatRecipe(r: Recipe, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${r.id}] ${r.title ?? "(untitled)"}${r.minutes !== undefined ? ` — ${r.minutes} min` : ""}${r.servings !== undefined ? `, serves ${r.servings}` : ""}${r.image ? `\n   ${r.image}` : ""}`
}

// ---- muxB tools:

// Open Food Facts is an open, keyless database of packaged food products.
const OFF_BASE = "https://world.openfoodfacts.org"
const OFF_UA = "spoonacular-mcp/1.0 (openfoodfacts public API)"

async function offGet<T>(path: string): Promise<T> {
  // The search route answers 503 from a "page temporarily unavailable" front
  // page fairly often, so a short bounded retry is the difference between a
  // flaky tool and a usable one.
  let last = 0
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${OFF_BASE}${path}`, {
      headers: { "User-Agent": OFF_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    })
    if (res.status === 429) throw new SpoonacularError("Open Food Facts rate limit reached, try again shortly.")
    if (res.status === 404) throw new SpoonacularError("Not found in Open Food Facts.")
    if (res.ok) return (await res.json()) as T
    last = res.status
    if (res.status !== 503) break
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)))
  }
  throw new SpoonacularError(`Open Food Facts error ${last}`)
}

function offNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function offPer100g(nutriments: Raw | undefined): string {
  const n: Raw = nutriments ?? {}
  const parts = [
    offNumber(n["energy-kcal_100g"]) !== undefined ? `${offNumber(n["energy-kcal_100g"])} kcal` : "",
    offNumber(n.proteins_100g) !== undefined ? `P ${offNumber(n.proteins_100g)}g` : "",
    offNumber(n.fat_100g) !== undefined ? `F ${offNumber(n.fat_100g)}g` : "",
    offNumber(n["carbohydrates_100g"]) !== undefined ? `C ${offNumber(n["carbohydrates_100g"])}g` : "",
    offNumber(n.sugars_100g) !== undefined ? `sugars ${offNumber(n.sugars_100g)}g` : "",
    offNumber(n.fiber_100g) !== undefined ? `fibre ${offNumber(n.fiber_100g)}g` : "",
    offNumber(n.salt_100g) !== undefined ? `salt ${offNumber(n.salt_100g)}g` : "",
  ].filter(Boolean)
  return parts.length ? parts.join(" · ") : "nutrient values not reported"
}

function offGrade(grade: unknown): string {
  const g = typeof grade === "string" ? grade.trim().toLowerCase() : ""
  if (g === "a" || g === "b" || g === "c" || g === "d" || g === "e") return g.toUpperCase()
  return "not graded"
}

function offCategories(tags: unknown): string {
  const list: string[] = Array.isArray(tags) ? tags.map((t) => String(t).replace(/^en:/, "")) : []
  if (list.length === 0) return "categories not reported"
  return list.slice(0, 3).join(", ") + (list.length > 3 ? `, +${list.length - 3} more` : "")
}

export async function productSearch(args: { query: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new SpoonacularError("Query is empty.")
  const limit = Math.min(Math.max(args.limit ?? 5, 1), 20)
  const fields = "product_name,brands,code,nutriscore_grade,nutriments,serving_size,categories_tags,quantity"
  const params = new URLSearchParams({ search_terms: q, json: "1", page_size: String(limit), fields })
  const data = await offGet<Raw>(`/cgi/search.pl?${params.toString()}`)
  const rows: Raw[] = Array.isArray(data.products) ? data.products : []
  if (rows.length === 0) return `No packaged products match "${q}".`
  return [
    `Open Food Facts products for "${q}" - ${Number(data.count ?? 0).toLocaleString()} indexed, showing ${rows.length}:`,
    ...rows.map((r, i) => {
      const name = String(r.product_name ?? "").trim() || "(unnamed product)"
      const brand = String(r.brands ?? "").trim()
      const portion = String(r.serving_size ?? "").trim() || String(r.quantity ?? "").trim()
      return [
        `${i + 1}. ${name}${brand ? ` - ${brand}` : ""}`,
        `   barcode ${r.code ?? "not reported"} · Nutri-Score ${offGrade(r.nutriscore_grade)}${portion ? ` · serving ${portion}` : ""}`,
        `   per 100 g: ${offPer100g(r.nutriments)}`,
        `   ${offCategories(r.categories_tags)}`,
      ].join("\n")
    }),
  ].join("\n")
}

export async function barcodeLookup(args: { barcode: string }): Promise<string> {
  const code = (args.barcode ?? "").replace(/[\s-]/g, "")
  if (!/^\d{8,14}$/.test(code)) throw new SpoonacularError(`Barcode must be 8-14 digits, got "${args.barcode ?? ""}".`)
  const fields = "product_name,generic_name,brands,code,quantity,product_quantity,product_quantity_unit,nutriscore_grade,nutriments,serving_size,ingredients_text,allergens_tags,categories_tags,countries,nutrition_data_per"
  const data = await offGet<Raw>(`/api/v2/product/${encodeURIComponent(code)}.json?fields=${encodeURIComponent(fields)}`)
  const p: Raw = (data.product ?? {}) as Raw
  if (Object.keys(p).length === 0 || Number(data.status ?? 0) === 0) {
    return `Barcode ${code} is not in Open Food Facts.`
  }
  const ingredients = String(p.ingredients_text ?? "").replace(/\s+/g, " ").trim()
  const allergens: string[] = Array.isArray(p.allergens_tags) ? p.allergens_tags.map((t) => String(t).replace(/^en:/, "")) : []
  const name = String(p.product_name ?? "").trim() || "(unnamed product)"
  const generic = String(p.generic_name ?? "").replace(/\s+/g, " ").trim()
  return [
    `${name}${generic ? ` (${generic})` : ""}`,
    `Brand: ${String(p.brands ?? "").trim() || "not reported"} · barcode ${p.code ?? code}`,
    `Quantity: ${String(p.serving_size ?? "").trim() || "not reported"}${p.product_quantity ? ` (${p.product_quantity}${p.product_quantity_unit ? ` ${p.product_quantity_unit}` : ""})` : ""}`,
    `Nutri-Score: ${offGrade(p.nutriscore_grade)} · nutrition basis: ${String(p.nutrition_data_per ?? "").trim() || "not reported"}`,
    `Per 100 g: ${offPer100g(p.nutriments)}`,
    `Countries: ${String(p.countries ?? "").trim() || "not reported"}`,
    `Categories: ${offCategories(p.categories_tags)}`,
    allergens.length ? `Allergens: ${allergens.slice(0, 8).join(", ")}` : "Allergens: none listed",
    ingredients ? `Ingredients: ${ingredients.slice(0, 400)}` : "Ingredients: not reported",
  ].join("\n")
}
