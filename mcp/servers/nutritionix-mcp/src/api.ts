/**
 * Nutritionix API v2 client. Needs NUTRITIONIX_APP_ID + NUTRITIONIX_API_KEY
 * (free at https://developer.nutritionix.com/).
 * Docs: https://developer.nutritionix.com/docs/v2
 *
 * The USDA FoodData Central premium tools moved to the licence gateway
 * (src/gateway.ts); what remains here is the free Nutritionix client.
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

