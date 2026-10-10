
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
const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1';
const FDC_UA = 'mrfentmen-usda-food-mcp/1.0';

interface FdcNutrient {
  nutrient?: { name?: string; unitName?: string; number?: string };
  amount?: number;
}

export interface FoodDetailsArgs {
  fdc_id: string;
}

export async function foodDetails(args: FoodDetailsArgs): Promise<string> {
  const fdcId = String(args.fdc_id ?? '').trim();
  if (!/^\d+$/.test(fdcId)) return 'Provide a numeric FDC id, e.g. 173944 for raw bananas.';
  const res = await fetch(`${FDC_BASE}/food/${encodeURIComponent(fdcId)}?api_key=DEMO_KEY`, {
    headers: { 'User-Agent': FDC_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (res.status === 401 || res.status === 403) throw new Error('USDA rejected the request key.');
  if (res.status === 404) return `USDA FoodData Central has no food with FDC id ${fdcId}.`;
  if (!res.ok) throw new Error(`USDA returned ${res.status}`);
  const d = (await res.json()) as {
    description?: string;
    dataType?: string;
    publicationDate?: string;
    brandOwner?: string;
    gtinUpc?: string;
    foodCategory?: { description?: string } | string;
    servingSize?: number;
    servingSizeUnit?: string;
    foodNutrients?: FdcNutrient[];
  };
  const category = typeof d.foodCategory === 'string' ? d.foodCategory : d.foodCategory?.description;
  const wanted = ['Energy', 'Protein', 'Total lipid (fat)', 'Carbohydrate', 'Fiber, total dietary', 'Sugars, total including NLEA', 'Sodium, Na', 'Calcium, Ca', 'Iron, Fe'];
  const rows = (d.foodNutrients ?? []).filter((n) => {
    const name = String(n.nutrient?.name ?? '');
    return wanted.some((w) => name.toLowerCase().startsWith(w.toLowerCase()));
  });
  const line = (prefix: string) => {
    const hit = rows.find((n) => String(n.nutrient?.name ?? '').toLowerCase().startsWith(prefix.toLowerCase()));
    if (!hit || hit.amount === undefined) return null;
    return `${hit.amount} ${hit.nutrient?.unitName ?? ''}`.trim();
  };
  const per = (label: string, prefix: string) => {
    const value = line(prefix);
    return value ? `   ${label}: ${value}` : `   ${label}: not reported`;
  };
  return [
    `USDA food ${fdcId}: ${d.description ?? 'not reported'}`,
    `Data type: ${d.dataType ?? 'not reported'} | published: ${d.publicationDate ?? 'not reported'}`,
    `Brand: ${d.brandOwner ?? 'not reported'} | category: ${category || 'not reported'} | GTIN: ${d.gtinUpc ?? 'not reported'}`,
    `Serving size: ${d.servingSize ?? 'not reported'} ${d.servingSizeUnit ?? ''}`.trim(),
    'Nutrients as published:',
    per('Energy', 'Energy'),
    per('Protein', 'Protein'),
    per('Total fat', 'Total lipid (fat)'),
    per('Carbohydrate', 'Carbohydrate'),
    per('Total fibre', 'Fiber, total dietary'),
    per('Total sugars', 'Sugars, total including NLEA'),
    per('Sodium', 'Sodium, Na'),
    per('Calcium', 'Calcium, Ca'),
    per('Iron', 'Iron, Fe'),
  ].join('\n');
}
