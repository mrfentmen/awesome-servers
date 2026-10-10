const BASE = "https://www.thecocktaildb.com/api/json/v1/1"
const UA = "mrfentmen-cocktails-mcp/1.0 (https://github.com/mrfentmen)"
export class CocktailsError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new CocktailsError("TheCocktailDB rate limit hit, wait and retry")
  if (!res.ok) throw new CocktailsError(`TheCocktailDB error ${res.status}`)
  return (await res.json()) as T
}

function ingredients(c: any): string[] {
  const out: string[] = []
  for (let i = 1; i <= 15; i++) {
    const ing = c?.[`strIngredient${i}`]
    const meas = c?.[`strMeasure${i}`]
    if (ing && ing.trim()) out.push(`${meas ? meas.trim() + " " : ""}${ing.trim()}`)
  }
  return out
}

export async function searchCocktails(args: { query?: string }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new CocktailsError("Provide a cocktail name")
  const d = await get<any>(`${BASE}/search.php?s=${encodeURIComponent(q)}`)
  const drinks = d?.drinks ?? []
  if (!drinks.length) return "No cocktails found"
  return drinks.map((c: any) => `${c.strDrink} (id ${c.idDrink})\n   ${c.strCategory ?? ""} | ${c.strAlcoholic ?? ""} | ${c.strGlass ?? ""}`).join("\n\n")
}

export async function byIngredient(args: { ingredient?: string }): Promise<string> {
  const ing = (args.ingredient ?? "").trim()
  if (!ing) throw new CocktailsError("Provide an ingredient")
  const d = await get<any>(`${BASE}/filter.php?i=${encodeURIComponent(ing)}`)
  const drinks = d?.drinks ?? []
  if (!drinks.length) return `No cocktails with ${ing}`
  return drinks.slice(0, 15).map((c: any, i: number) => `${i + 1}. ${c.strDrink} (id ${c.idDrink})`).join("\n")
}

export async function cocktailDetails(args: { cocktailId?: string }): Promise<string> {
  const id = (args.cocktailId ?? "").trim()
  if (!id) throw new CocktailsError("Provide a cocktail ID")
  const d = await get<any>(`${BASE}/lookup.php?i=${encodeURIComponent(id)}`)
  const c = d?.drinks?.[0]
  if (!c) return "No cocktail found"
  const ings = ingredients(c)
  return `# ${c.strDrink}\n${c.strAlcoholic ?? ""} | ${c.strGlass ?? ""}\n\nIngredients:\n${ings.map((i) => `- ${i}`).join("\n")}\n\nInstructions:\n${c.strInstructions ?? ""}`
}

// ---- muxA tools:
// The free public key caps every list at 100 rows and answers an unknown
// ingredient filter with a single drink, so these tools browse the facets the
// existing three cannot reach and say how many rows the key actually gave back.
type CocktailFacet = "category" | "glass" | "strength"

const COCKTAIL_PARAM: Record<CocktailFacet, string> = { category: "c", glass: "g", strength: "a" }
const COCKTAIL_LIST_KEY: Record<CocktailFacet, string> = {
  category: "strCategory",
  glass: "strGlass",
  strength: "strAlcoholic",
}
const COCKTAIL_FACETS: CocktailFacet[] = ["category", "glass", "strength"]

// filter.php answers an unknown value with the string "no data found" instead
// of an empty list, so the shape has to be checked rather than trusted.
function cocktailRows(payload: { drinks?: unknown }): Array<{ idDrink?: string; strDrink?: string }> | null {
  return Array.isArray(payload?.drinks) ? (payload.drinks as Array<{ idDrink?: string; strDrink?: string }>) : null
}

async function cocktailFacetValues(facet: CocktailFacet): Promise<string[]> {
  const d = await get<{ drinks?: unknown }>(`${BASE}/list.php?${COCKTAIL_PARAM[facet]}=list`)
  const rows = Array.isArray(d?.drinks) ? (d.drinks as Array<Record<string, unknown>>) : []
  const key = COCKTAIL_LIST_KEY[facet]
  return rows
    .map((row) => row?.[key])
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
}

function cocktailFacet(facet: string): CocktailFacet | null {
  return COCKTAIL_FACETS.includes(facet as CocktailFacet) ? (facet as CocktailFacet) : null
}

function cocktailPairs(drink: any): Array<{ name: string; measure: string }> {
  const pairs: Array<{ name: string; measure: string }> = []
  for (let i = 1; i <= 15; i++) {
    const name = drink?.[`strIngredient${i}`]
    if (typeof name !== "string" || !name.trim()) continue
    const measure = drink?.[`strMeasure${i}`]
    pairs.push({ name: name.trim(), measure: typeof measure === "string" ? measure.trim() : "" })
  }
  return pairs
}

function cocktailSummary(drink: any): string {
  const parts = [drink?.strCategory, drink?.strAlcoholic, drink?.strGlass].filter(
    (value) => typeof value === "string" && value.trim(),
  )
  return parts.length ? parts.join(" | ") : "no classification published"
}

export async function randomCocktail(_args: Record<string, never>): Promise<string> {
  const d = await get<{ drinks?: unknown }>(`${BASE}/random.php`)
  const drink = Array.isArray(d?.drinks) ? (d.drinks as any[])[0] : null
  if (!drink) throw new CocktailsError("TheCocktailDB returned no random cocktail")
  const ings = ingredients(drink)
  return [
    `# ${drink.strDrink ?? "Unknown"} (id ${drink.idDrink ?? "?"})`,
    `  ${cocktailSummary(drink)}`,
    drink.strIBA ? `  IBA official cocktail: ${drink.strIBA}` : "",
    drink.strTags ? `  Tags: ${drink.strTags}` : "",
    "",
    "Ingredients:",
    ...(ings.length ? ings.map((entry) => `- ${entry}`) : ["- none published"]),
    "",
    "Instructions:",
    drink.strInstructions ?? "not published",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
