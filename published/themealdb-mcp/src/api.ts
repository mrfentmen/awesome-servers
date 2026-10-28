/**
 * TheMealDB v1 test key ("1") is free and documented.
 * Endpoints: search.php, lookup.php, random.php, randomselection.php, filter.php, list.php.
 */
const BASE = "https://www.themealdb.com/api/json/v1/1"

export class MealError extends Error {}

async function getJson(path: string, timeoutMs = 20000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "themealdb-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new MealError("Not found in TheMealDB")
    if (!res.ok) throw new MealError(`TheMealDB responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof MealError) throw e
    if ((e as Error).name === "AbortError") throw new MealError("TheMealDB request timed out")
    if (e instanceof SyntaxError) throw new MealError("TheMealDB returned a non-JSON response")
    throw new MealError(`TheMealDB request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

interface Meal {
  idMeal: string
  strMeal: string
  strCategory?: string
  strArea?: string
  strTags?: string
  strInstructions?: string
  strMealThumb?: string
  strSource?: string
  strYoutube?: string
  [key: string]: unknown
}

function ingredients(m: Meal): string[] {
  const out: string[] = []
  for (let i = 1; i <= 20; i++) {
    const name = m[`strIngredient${i}`] as string | null
    const measure = m[`strMeasure${i}`] as string | null
    if (name && String(name).trim()) out.push(`${String(measure ?? "").trim()} ${String(name).trim()}`.trim())
  }
  return out
}

function line(m: Meal, i?: number): string {
  const prefix = typeof i === "number" ? `${i + 1}. ` : "• "
  // filter.php returns names only, so category and area are often absent.
  const meta = [m.strCategory, m.strArea].filter(Boolean).join(" · ")
  return `${prefix}${m.strMeal} (${m.idMeal})${meta ? ` — ${meta}` : ""}`
}

function detail(m: Meal): string {
  const ings = ingredients(m)
  const steps = String(m.strInstructions ?? "")
    .split(/\r?\n+/)
    .map((s) => s.replace(/^STEP\s*\d+\s*/i, "").trim())
    .filter((s) => s.length > 2)
  return [
    `${m.strMeal} (${m.idMeal})`,
    `${m.strCategory ?? "uncategorised"} · ${m.strArea ?? "unknown origin"}${m.strTags ? ` · ${m.strTags}` : ""}`,
    "",
    `Ingredients (${ings.length}):`,
    ...ings.map((x) => `   • ${x}`),
    "",
    "Steps:",
    ...steps.map((s, i) => `   ${i + 1}. ${s}`),
    "",
    m.strSource ? `Source: ${m.strSource}` : "",
    m.strYoutube ? `Video: ${m.strYoutube}` : "",
    m.strMealThumb ? `Image: ${m.strMealThumb}` : "",
  ]
    .filter((l) => l !== "")
    .join("\n")
}

const meals = (d: any): Meal[] => (Array.isArray(d?.meals) ? d.meals : [])

export async function searchMeals(name: string, limit: number): Promise<string> {
  const rows = meals(await getJson(`/search.php?s=${encodeURIComponent(name.trim())}`))
  if (rows.length === 0) return `No meals match "${name}".`
  return [`Meals matching "${name}" (${rows.length}):`, "", ...rows.slice(0, limit).map(line)].join("\n")
}

export async function mealDetail(id: string): Promise<string> {
  const clean = id.trim()
  if (!/^\d{4,6}$/.test(clean)) throw new MealError(`"${id}" is not a numeric meal id`)
  const rows = meals(await getJson(`/lookup.php?i=${clean}`))
  if (rows.length === 0) throw new MealError(`No meal with id ${clean}`)
  return detail(rows[0])
}

export async function randomMeal(): Promise<string> {
  const rows = meals(await getJson("/random.php"))
  if (rows.length === 0) throw new MealError("TheMealDB returned no random meal")
  return detail(rows[0])
}

export async function byCategory(category: string, limit: number): Promise<string> {
  const rows = meals(await getJson(`/filter.php?c=${encodeURIComponent(category.trim())}`))
  if (rows.length === 0) return `No meals in category "${category}".`
  return [`Meals in "${category}" (${rows.length}):`, "", ...rows.slice(0, limit).map(line)].join("\n")
}

export async function byArea(area: string, limit: number): Promise<string> {
  const rows = meals(await getJson(`/filter.php?a=${encodeURIComponent(area.trim())}`))
  if (rows.length === 0) return `No meals from "${area}".`
  return [`Meals from ${area} (${rows.length}):`, "", ...rows.slice(0, limit).map(line)].join("\n")
}

export async function byMainIngredient(ingredient: string, limit: number): Promise<string> {
  const rows = meals(await getJson(`/filter.php?i=${encodeURIComponent(ingredient.trim())}`))
  if (rows.length === 0) return `No meals use "${ingredient}".`
  return [`Meals using "${ingredient}" (${rows.length}):`, "", ...rows.slice(0, limit).map(line)].join("\n")
}

export async function listOptions(): Promise<string> {
  const [cats, areaRows, ings] = await Promise.all([
    getJson("/list.php?c=list"),
    getJson("/list.php?a=list"),
    getJson("/list.php?i=list"),
  ])
  const col = (d: any, key: string) => (Array.isArray(d?.meals) ? d.meals.map((x: any) => x[key]).filter(Boolean) : [])
  const categories = col(cats, "strCategory")
  const areaNames = col(areaRows, "strArea")
  const ingredients = col(ings, "strIngredient")
  return [
    `Categories (${categories.length}): ${categories.join(", ")}`,
    "",
    `Areas (${areaNames.length}): ${areaNames.join(", ")}`,
    "",
    `Ingredients (${ingredients.length}, first 60): ${ingredients.slice(0, 60).join(", ")}`,
  ].join("\n")
}
