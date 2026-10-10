/**
 * Nutritionix API v2 client. Needs NUTRITIONIX_APP_ID + NUTRITIONIX_API_KEY
 * (free at https://developer.nutritionix.com/).
 * Docs: https://developer.nutritionix.com/docs/v2
 */
const BASE = "https://trackapi.nutritionix.com/v2"

export class NutritionixError extends Error {}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const id = process.env.NUTRITIONIX_APP_ID
  const key = process.env.NUTRITIONIX_API_KEY
  if (!id || !key) throw new NutritionixError("Set NUTRITIONIX_APP_ID and NUTRITIONIX_API_KEY first (free at developer.nutritionix.com).")
  return { "User-Agent": "nutritionix-mcp/1.0", Accept: "application/json", "x-app-id": id, "x-app-key": key, ...extra }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new NutritionixError("Nutritionix refused (401/403). Check app id and key.")
  if (res.status === 404) throw new NutritionixError("Not found.")
  if (!res.ok) throw new NutritionixError(`Nutritionix error ${res.status}`)
  return (await res.json()) as T
}

async function postJson<T>(path: string, body: Raw): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new NutritionixError("Nutritionix refused (401/403). Check app id and key.")
  if (!res.ok) throw new NutritionixError(`Nutritionix error ${res.status}`)
  return (await res.json()) as T
}

export interface Food {
  name: string
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
  serving?: string
}

export async function searchFoods(query: string, limit = 5): Promise<Food[]> {
  if (!query.trim()) throw new NutritionixError("Query is empty.")
  const data = await getJson<Raw>(`/search/instant?query=${encodeURIComponent(query.trim())}`)
  const branded: Raw[] = Array.isArray(data.branded) ? data.branded : []
  const common: Raw[] = Array.isArray(data.common) ? data.common : []
  const out: Food[] = []
  for (const f of common.slice(0, limit)) out.push({ name: String(f.food_name ?? "?") })
  for (const f of branded.slice(0, Math.max(limit - out.length, 0))) {
    out.push({
      name: String(f.food_name ?? "?"),
      calories: f.nf_calories,
      protein: f.nf_protein,
      fat: f.nf_total_fat,
      carbs: f.nf_total_carbohydrate,
      serving: f.serving_unit ? `${f.serving_qty ?? 1} ${f.serving_unit}` : undefined,
    })
  }
  return out.slice(0, limit)
}

export async function analyzeMeal(text: string): Promise<Food[]> {
  if (!text.trim()) throw new NutritionixError("Text is empty.")
  const data = await postJson<Raw>("/natural/nutrients", { query: text.trim() })
  const rows: Raw[] = Array.isArray(data.foods) ? data.foods : []
  return rows.slice(0, 10).map((f) => ({
    name: String(f.food_name ?? "?"),
    calories: f.nf_calories,
    protein: f.nf_protein,
    fat: f.nf_total_fat,
    carbs: f.nf_total_carbohydrate,
    serving: f.serving_unit ? `${f.serving_qty ?? 1} ${f.serving_unit}` : undefined,
  }))
}

export function formatFood(f: Food, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const macros = [f.calories !== undefined ? `${f.calories} kcal` : "", f.protein !== undefined ? `P ${f.protein}g` : "", f.fat !== undefined ? `F ${f.fat}g` : "", f.carbs !== undefined ? `C ${f.carbs}g` : ""].filter(Boolean).join(" · ")
  return `${prefix}${f.name}${macros ? ` — ${macros}` : ""}${f.serving ? ` (${f.serving})` : ""}`
}

// ---- muxB tools:

// USDA FoodData Central publishes the official nutrient composition of
// everything America eats. DEMO_KEY is the placeholder the service documents.
const FDC_BASE = "https://api.nal.usda.gov/fdc/v1"
const FDC_DEMO_KEY = "DEMO_KEY"

async function fdcGet<T>(path: string, params: Array<[string, string]> = []): Promise<T> {
  const qs = new URLSearchParams([...params, ["api_key", FDC_DEMO_KEY]])
  const res = await fetch(`${FDC_BASE}${path}?${qs.toString()}`, {
    headers: { "User-Agent": "nutritionix-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 429) throw new NutritionixError("FoodData Central rate limit reached, try again shortly.")
  if (res.status === 404) throw new NutritionixError("Not found in FoodData Central.")
  if (!res.ok) throw new NutritionixError(`FoodData Central error ${res.status}`)
  return (await res.json()) as T
}

// The survey food types spell a few nutrients differently, so each row lists
// every name the service uses for it.
const FDC_KEY_NUTRIENTS: Array<[string[], string]> = [
  [["Energy", "Energy (Atwater General Factors)"], "kcal"],
  [["Protein"], "g protein"],
  [["Total lipid (fat)"], "g fat"],
  [["Carbohydrate, by difference"], "g carbs"],
  [["Fiber, total dietary"], "g fibre"],
  [["Total Sugars", "Sugars, Total"], "g sugars"],
  [["Sodium, Na"], "mg sodium"],
  [["Calcium, Ca"], "mg calcium"],
  [["Iron, Fe"], "mg iron"],
]

const FDC_MICROS: Array<[string[], string]> = [
  [["Vitamin D (D2 + D3)"], "mg vitamin D"],
  [["Vitamin B-12"], "ug B12"],
  [["Potassium, K"], "mg potassium"],
  [["Magnesium, Mg"], "mg magnesium"],
  [["Zinc, Zn"], "mg zinc"],
  [["Vitamin C, total ascorbic acid", "Vitamin C"], "mg vitamin C"],
]

// The search route returns nutrients flat with "value"; the detail route nests
// the name under "nutrient" and calls the number "amount". Both are read here.
function fdcValue(food: Raw, names: string[]): number | undefined {
  const list: Raw[] = Array.isArray(food.foodNutrients) ? food.foodNutrients : []
  for (const wanted of names) {
    for (const n of list) {
      const name = String(n.nutrientName ?? n.nutrient?.name ?? "")
      if (name !== wanted) continue
      const value = n.value ?? n.amount
      if (typeof value === "number" && Number.isFinite(value)) return value
    }
  }
  return undefined
}

function fdcPanel(food: Raw, wanted: Array<[string[], string]>): string {
  const parts: string[] = []
  for (const [names, unit] of wanted) {
    const value = fdcValue(food, names)
    if (value === undefined) continue
    parts.push(`${value} ${unit}`)
  }
  return parts.length ? parts.join(" · ") : "no nutrient values reported"
}

function fdcCategory(food: Raw): string {
  const category = food.foodCategory
  if (typeof category === "string" && category) return category
  if (category && typeof category === "object") return String((category as Raw).description ?? "not reported")
  return "not reported"
}

function fdcTitle(food: Raw): string {
  return `${food.description ?? "(unnamed food)"} [FDC ${food.fdcId ?? "?"}]`
}

function fdcType(food: Raw): string {
  const map: Record<string, string> = { SR: "SR Legacy survey food", Foundation: "Foundation survey food", Branded: "branded packaged food" }
  return map[String(food.dataType ?? "")] ?? "data type not reported"
}

export async function nutrientFoodSearch(args: { query: string; limit?: number; branded?: boolean }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new NutritionixError("Query is empty.")
  const limit = Math.min(Math.max(args.limit ?? 5, 1), 20)
  // Branded entries often carry no nutrient numbers at all, so the survey
  // types are searched by default and branded food is opt-in.
  const dataType = args.branded === true ? "Foundation,SR Legacy,Branded" : "Foundation,SR Legacy"
  const data = await fdcGet<Raw>("/foods/search", [
    ["query", q],
    ["dataType", dataType],
    ["pageSize", String(limit)],
  ])
  const rows: Raw[] = Array.isArray(data.foods) ? data.foods : []
  if (rows.length === 0) return `No FoodData Central foods match "${q}".`
  return [
    `USDA FoodData Central foods for "${q}"${args.branded === true ? "" : " (survey foods only)"} - ${Number(data.totalHits ?? 0).toLocaleString()} match, showing ${rows.length}:`,
    ...rows.map((food, i) => [
      `${i + 1}. ${fdcTitle(food)}`,
      `   ${fdcType(food)}${food.brandOwner ? ` · brand ${food.brandOwner}` : ""} · category ${fdcCategory(food)} · published ${food.publishedDate ?? food.publicationDate ?? "not reported"}`,
      `   per 100 g: ${fdcPanel(food, FDC_KEY_NUTRIENTS)}`,
    ].join("\n")),
  ].join("\n")
}

export async function nutrientFoodProfile(args: { fdcId: string }): Promise<string> {
  const id = (args.fdcId ?? "").trim()
  if (!/^\d+$/.test(id)) throw new NutritionixError(`FDC id must be numeric, e.g. 2257046, got "${args.fdcId ?? ""}".`)
  const payload = await fdcGet<Raw>(`/food/${encodeURIComponent(id)}`)
  const food: Raw = ((payload.food ?? payload.compositeFood ?? payload) as Raw)
  if (Object.keys(food).length === 0) throw new NutritionixError(`No FoodData Central food with FDC id ${id}.`)
  const label = fdcTitle({ ...food, fdcId: food.fdcId ?? id })
  const brand = food.brandOwner ?? food.brandName ?? food.subbrandName
  return [
    label,
    `${fdcType(food)}${brand ? ` · brand ${brand}` : " · unbranded"} · published ${food.publicationDate ?? food.publishedDate ?? "not reported"}`,
    `Category: ${fdcCategory(food)} · gtin/upc ${food.gtinUpc ?? "not reported"}`,
    `Energy and macros per 100 g: ${fdcPanel(food, FDC_KEY_NUTRIENTS)}`,
    `Micronutrients per 100 g: ${fdcPanel(food, FDC_MICROS)}`,
  ].join("\n")
}
