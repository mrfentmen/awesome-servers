const BASE = "https://www.thecocktaildb.com/api/json/v1/1"
const UA = "mrfentmen-cocktaildb-mcp/1.0"

type Row = Record<string, unknown>

export class CocktailError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CocktailError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const clamp = (value: number | undefined, fallback: number, max = 50) =>
  Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max)

const truncate = (value: string, max = 3800) =>
  value.length <= max ? value : `${value.slice(0, max)}\n… (truncated)`

async function getJson(path: string): Promise<Row> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    throw new CocktailError(`Network error: ${errorMessage(e)}`)
  }
  if (!res.ok) throw new CocktailError(`TheCocktailDB returned ${res.status}`)
  // The API answers 200 with {"drinks":"no data found"} for empty results.
  return (await res.json()) as Row
}

const drinksOf = (data: Row): Row[] =>
  Array.isArray(data.drinks) ? (data.drinks as Row[]) : []

const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

/** list.php returns one single-key object per row, e.g. {"strCategory":"Beer"}. */
const pick = (data: Row, field: string): string[] =>
  drinksOf(data).map((d) => str(d[field])).filter(Boolean)

function recipe(d: Row): string {
  const ingredients: string[] = []
  for (let i = 1; i <= 15; i += 1) {
    const name = str(d[`strIngredient${i}`])
    if (!name) continue
    const measure = str(d[`strMeasure${i}`])
    ingredients.push(`  ${ingredients.length + 1}. ${measure ? `${measure} ` : ""}${name}`)
  }
  const lines = [
    `${str(d.strDrink)} (id ${str(d.idDrink)})`,
    `Category: ${str(d.strCategory) || "n/a"} | Glass: ${str(d.strGlass) || "n/a"} | ${str(d.strAlcoholic) || "n/a"}`,
    "Ingredients:",
    ...ingredients,
    "Instructions:",
    str(d.strInstructions) || "n/a",
  ]
  const image = str(d.strDrinkThumb)
  if (image) lines.push(`Image: ${image}`)
  return lines.join("\n")
}

function compact(d: Row): string {
  const bits = [str(d.strCategory), str(d.strGlass), str(d.strAlcoholic)].filter(Boolean)
  return `${str(d.strDrink)} (id ${str(d.idDrink)})${bits.length ? ` — ${bits.join(", ")}` : ""}`
}

export interface SearchArgs {
  query: string
  limit?: number
}

export async function searchCocktails(args: SearchArgs): Promise<string> {
  const limit = clamp(args.limit, 10, 25)
  const found = drinksOf(await getJson(`/search.php?s=${encodeURIComponent(args.query)}`))
  if (!found.length) {
    return `No cocktail matched "${args.query}". Try filter_cocktails (by ingredient or category) or list_ingredients.`
  }
  const shown = found.slice(0, limit)
  return truncate(
    `${found.length} cocktail(s) matching "${args.query}" (showing ${shown.length}):\n` +
      shown.map((d, i) => `${i + 1}. ${compact(d)}`).join("\n") +
      "\nUse get_cocktail with an id for the full recipe and measures."
  )
}

export async function getCocktail(id: string): Promise<string> {
  const found = drinksOf(await getJson(`/lookup.php?i=${encodeURIComponent(id)}`))
  if (!found.length) throw new CocktailError(`No cocktail with id ${id}. Find ids with search_cocktails.`)
  return truncate(found.map(recipe).join("\n\n"))
}

export async function randomCocktail(count?: number): Promise<string> {
  const n = clamp(count, 1, 3)
  const recipes: string[] = []
  for (let i = 0; i < n; i += 1) {
    const found = drinksOf(await getJson("/random.php"))
    if (found.length) recipes.push(recipe(found[0]))
  }
  if (!recipes.length) throw new CocktailError("TheCocktailDB returned no random cocktail")
  return truncate(recipes.join("\n\n"))
}

export interface IngredientListArgs {
  search?: string
  limit?: number
}

export async function listIngredients(args: IngredientListArgs = {}): Promise<string> {
  const names = pick(await getJson("/list.php?i=list"), "strIngredient1")
  const needle = (args.search ?? "").trim().toLowerCase()
  const matched = needle ? names.filter((n) => n.toLowerCase().includes(needle)) : names
  if (!matched.length) return `No ingredient matched "${args.search}".`
  const limit = clamp(args.limit, 40, 200)
  const shown = matched.slice(0, limit)
  return truncate(
    `${matched.length} ingredient(s)${needle ? ` matching "${args.search}"` : ""} (showing ${shown.length}):\n` +
      shown.map((n, i) => `${i + 1}. ${n}`).join("\n") +
      "\nUse ingredient_info for a profile of one ingredient."
  )
}

const FILTERS: Record<string, { param: string; label: string }> = {
  ingredient: { param: "i", label: "ingredient" },
  category: { param: "c", label: "category" },
  glass: { param: "g", label: "glass" },
  alcohol: { param: "a", label: "alcohol" },
}

export interface FilterArgs {
  by: string
  value: string
  limit?: number
}

export async function filterCocktails(args: FilterArgs): Promise<string> {
  const key = args.by.trim().toLowerCase()
  const filter = FILTERS[key]
  if (!filter) throw new CocktailError("by must be ingredient, category, glass, or alcohol")
  const found = drinksOf(
    await getJson(`/filter.php?${filter.param}=${encodeURIComponent(args.value)}`)
  )
  if (!found.length) {
    return `No cocktails found with ${filter.label} "${args.value}". Use list_filters to see valid categories, glasses and alcohol options.`
  }
  const limit = clamp(args.limit, 20, 50)
  const shown = found.slice(0, limit)
  return truncate(
    `${found.length} cocktail(s) with ${filter.label} "${args.value}" (showing ${shown.length}):\n` +
      shown.map((d, i) => `${i + 1}. ${compact(d)}`).join("\n") +
      "\nUse get_cocktail with an id for the full recipe."
  )
}

export async function ingredientInfo(name: string): Promise<string> {
  const data = await getJson(`/search.php?i=${encodeURIComponent(name)}`)
  const found = Array.isArray(data.ingredients) ? (data.ingredients as Row[]) : []
  if (!found.length) {
    return `No ingredient named "${name}". Use list_ingredients to see valid ingredient names.`
  }
  const ing = found[0]
  const description = str(ing.strDescription).replace(/\s+/g, " ")
  const facts = [`Type: ${str(ing.strType) || "n/a"}`, `Alcohol: ${str(ing.strAlcohol) || "n/a"}`]
  const abv = str(ing.strABV)
  if (abv) facts.push(`ABV: ${abv}%`)
  return truncate(
    [
      `${str(ing.strIngredient)} (id ${str(ing.idIngredient)})`,
      facts.join(" | "),
      description || "No description available.",
    ].join("\n")
  )
}

const LISTS: Record<string, { param: string; field: string; label: string }> = {
  categories: { param: "c", field: "strCategory", label: "Categories" },
  glasses: { param: "g", field: "strGlass", label: "Glass types" },
  alcohol: { param: "a", field: "strAlcoholic", label: "Alcohol options" },
}

export async function listFilters(kind?: string): Promise<string> {
  const want = (kind ?? "all").trim().toLowerCase()
  const keys = want === "all" ? Object.keys(LISTS) : [want]
  for (const key of keys) {
    if (!LISTS[key]) throw new CocktailError("kind must be categories, glasses, alcohol, or all")
  }
  const blocks: string[] = []
  for (const key of keys) {
    const { param, field, label } = LISTS[key]
    const values = pick(await getJson(`/list.php?${param}=list`), field)
    blocks.push(`${label} (${values.length}): ${values.join(", ")}`)
  }
  return truncate(`${blocks.join("\n\n")}\n\nUse these values with filter_cocktails.`)
}
// ---- batch-3 tools: browse by letter + multi-ingredient filter (2026-09-27) ----
export async function searchByLetter(letter: string, limit?: number): Promise<string> {
  const wanted = (letter ?? "").trim()
  if (!/^[a-zA-Z]$/.test(wanted)) throw new CocktailError("Provide a single letter a-z.")
  const found = drinksOf(await getJson(`/search.php?f=${encodeURIComponent(wanted.toLowerCase())}`))
  if (!found.length) return `No cocktails start with "${wanted}".`
  const count = clamp(limit, 20, 50)
  const shown = found.slice(0, count)
  return truncate(
    `${found.length} cocktail(s) starting with "${wanted.toUpperCase()}" (showing ${shown.length}):\n` +
      shown.map((d, i) => `${i + 1}. ${compact(d)}`).join("\n") +
      "\nUse get_cocktail with an id for the full recipe."
  )
}

export async function filterMultiIngredient(ingredients: string, limit?: number): Promise<string> {
  const list = (ingredients ?? "").split(",").map((s) => s.trim()).filter(Boolean)
  if (list.length < 2) throw new CocktailError("Provide at least two ingredients, comma separated, e.g. Gin,Tonic water.")
  if (list.length > 6) throw new CocktailError("Provide at most six ingredients.")
  const found = drinksOf(await getJson(`/filter.php?i=${encodeURIComponent(list.join(","))}`))
  if (!found.length) {
    return `No cocktail contains all of: ${list.join(", ")}. Check exact ingredient names with list_ingredients.`
  }
  const count = clamp(limit, 20, 50)
  const shown = found.slice(0, count)
  return truncate(
    `${found.length} cocktail(s) containing all of ${list.join(", ")} (showing ${shown.length}):\n` +
      shown.map((d, i) => `${i + 1}. ${compact(d)}`).join("\n") +
      "\nUse get_cocktail with an id for the full recipe."
  )
}

// ---- muxD tools:

/** The translated instruction fields TheCocktailDB publishes, keyed by its own field suffix. */
const TRANSLATIONS: Array<[string, string]> = [
  ["ES", "strInstructionsES"],
  ["DE", "strInstructionsDE"],
  ["FR", "strInstructionsFR"],
  ["IT", "strInstructionsIT"],
  ["ZH-HANS", "strInstructionsZH-HANS"],
  ["ZH-HANT", "strInstructionsZH-HANT"],
  ["JA", "strInstructionsJA"],
  ["KO", "strInstructionsKO"],
  ["PT", "strInstructionsPT"],
  ["RU", "strInstructionsRU"],
];

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

/**
 * The free tier serves at most 25 drinks per search, and search.php is the only
 * endpoint that returns full records, so the letters together are the widest view
 * of the database. Cached per process so catalogue_index and name_variants do not
 * refetch the same 26 pages.
 */
let letterIndex: Map<string, Row[]> | null = null;

async function drinksByLetter(refresh = false): Promise<Map<string, Row[]>> {
  if (letterIndex && !refresh) return letterIndex;
  const index = new Map<string, Row[]>();
  for (const letter of LETTERS) {
    const found = drinksOf(await getJson(`/search.php?f=${letter}`));
    index.set(letter, found);
  }
  letterIndex = index;
  return index;
}

export interface RecordAuditArgs {
  id: string;
}

export interface CatalogueIndexArgs {
  refresh?: string;
}

/** The A to Z shape of what the free API will actually serve, including which letters are truncated. */
export async function catalogueIndex(args: CatalogueIndexArgs = {}): Promise<string> {
  const refresh = args.refresh === "true" || args.refresh === "1"
  const started = Date.now()
  const index = await drinksByLetter(refresh)
  const rows: Row[] = []
  for (const letter of LETTERS) rows.push(...(index.get(letter) ?? []))
  const unique = new Map(rows.map((r) => [str(r.idDrink), r]))
  const reachable = [...unique.values()]
  // The free API stops at 25 rows per search, so a letter sitting exactly on 25 is
  // not a real count of the database.
  const capped = LETTERS.filter((l) => (index.get(l) ?? []).length >= 25)
  const seen = new Set<number>()

  const lines = [
    `TheCocktailDB catalogue reachable from the free API: ${reachable.length} distinct drink(s) across ${LETTERS.length} letters (${Date.now() - started} ms)`,
    "",
    "The free API serves at most 25 drinks per search and search.php is the only endpoint",
    "returning full records, so a letter showing exactly 25 is truncated, not complete.",
    `${capped.length} letter(s) are at the 25 cap: ${capped.join(", ") || "none"}. Those letters are incomplete.`,
    "",
    `${"letter".padEnd(7)}${"n".padStart(4)}  first / last`,
  ]
  for (const letter of LETTERS) {
    const list = index.get(letter) ?? []
    const uniq = list.filter((r) => {
      const id = Number(str(r.idDrink))
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
    const first = str(uniq[0]?.strDrink) || "-"
    const last = str(uniq[uniq.length - 1]?.strDrink) || "-"
    const mark = list.length >= 25 ? "  <- at the 25 cap, incomplete" : ""
    lines.push(`${letter.toUpperCase().padEnd(7)}${String(list.length).padStart(4)}  ${first} / ${last}${mark}`)
  }
  return truncate(lines.join("\n"))
}

export interface NameVariantsArgs {
  refresh?: string;
  top?: number;
  min_family?: number;
}

