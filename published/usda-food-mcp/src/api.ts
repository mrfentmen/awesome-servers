
export interface m0_SearchArgs {
  query: string;
  limit?: number;
}

const m0 = (() => {
const BASE = 'https://api.nal.usda.gov/fdc/v1/foods/search';

async function search(args: m0_SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide a food search query.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const url = `${BASE}?query=${encodeURIComponent(q)}&pageSize=${limit}&api_key=DEMO_KEY`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-usda-food-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`USDA returned ${res.status}`);
  const data = (await res.json()) as {
    totalHits?: number;
    foods?: Array<{ description?: string; brandOwner?: string; fdcId?: number }>;
  };
  const foods = data.foods ?? [];
  if (!foods.length) return `No USDA foods found for "${q}".`;
  return `USDA foods for "${q}" (${data.totalHits ?? foods.length} total, ${foods.length} shown):\n` +
    foods
      .map((f, i) => `${i + 1}. ${f.description ?? 'untitled'}${f.brandOwner ? ` | ${f.brandOwner}` : ''}${f.fdcId ? ` | fdc ${f.fdcId}` : ''}`)
      .join('\n');
}

return { search };
})();

const m1 = (() => {
const KEY = process.env.USDA_API_KEY ?? ""
const BASE = "https://api.nal.usda.gov/fdc/v1"
const UA = "mrfentmen-nutrition-mcp/1.0 (https://github.com/mrfentmen)"
class NutritionError extends Error {}

async function searchFood(args: { query?: string; limit?: number }): Promise<string> {
  if (!KEY) throw new NutritionError("Set the USDA_API_KEY environment variable to your free USDA FoodData Central key")
  const q = (args.query ?? "").trim()
  if (!q) throw new NutritionError("Provide a food name")
  const limit = Math.min(args.limit ?? 5, 20)
  const res = await fetch(`${BASE}/foods/search?api_key=${KEY}&query=${encodeURIComponent(q)}&pageSize=${limit}&dataType=Foundation,SR Legacy`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 401 || res.status === 403) throw new NutritionError("USDA rejected the key. Check USDA_API_KEY.")
  if (!res.ok) throw new NutritionError(`USDA error ${res.status}`)
  const d = await res.json()
  const foods = d.foods ?? []
  return foods.map((f: any) => {
    const n = (f.foodNutrients ?? []).filter((x: any) => x.value != null)
    const cal = n.find((x: any) => x.nutrientName?.includes("Energy"))?.value
    const protein = n.find((x: any) => x.nutrientName?.includes("Protein"))?.value
    const carbs = n.find((x: any) => x.nutrientName?.includes("Carbohydrate"))?.value
    const fat = n.find((x: any) => x.nutrientName?.includes("Total lipid"))?.value
    return `${f.description ?? ""}\n  Per 100g: ${cal ? `${cal} kcal` : "energy n/a"}${protein ? ` | protein ${protein}g` : ""}${carbs ? ` | carbs ${carbs}g` : ""}${fat ? ` | fat ${fat}g` : ""}`
  }).join("\n\n") || "No foods found"
}

return { NutritionError, searchFood };
})();

export const NutritionError = m1.NutritionError;
export const search = m0.search;
export const searchFood = m1.searchFood;
export const m0_search = m0.search;
export const m1_searchFood = m1.searchFood;
export const m1_NutritionError = m1.NutritionError;

// ---- muxB tools:

// FoodData Central's shared DEMO_KEY is what the existing search tool already
// uses, so the detail route sticks to the same key rather than inventing one.

interface FdcNutrient {
  nutrient?: { name?: string; unitName?: string; number?: string };
  amount?: number;
}

export interface FoodDetailsArgs {
  fdc_id: string;
}

