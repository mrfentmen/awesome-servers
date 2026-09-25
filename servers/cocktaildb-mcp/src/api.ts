export class CocktailError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CocktailError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://www.thecocktaildb.com/api/json/v1/1";

async function req(path: string, params: Record<string, string | number | undefined>): Promise<string> {
  void params;
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new CocktailError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CocktailError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

async function get(path: string): Promise<string> {
  return req(path, {});
}

function slimDrink(d: Record<string, unknown>): Record<string, unknown> {
  const ingredients: { ingredient: unknown; measure: unknown }[] = [];
  for (let i = 1; i <= 15; i++) {
    const ing = d[`strIngredient${i}`];
    if (ing) ingredients.push({ ingredient: ing, measure: d[`strMeasure${i}`] ?? null });
  }
  return { id: d.idDrink, name: d.strDrink, category: d.strCategory, glass: d.strGlass,
           instructions: d.strInstructions, image: d.strDrinkThumb, ingredients };
}

function slim(text: string): string {
  try {
    const d = JSON.parse(text) as Record<string, unknown>;
    const drinks = (d.drinks as Record<string, unknown>[] | null) ?? [];
    return JSON.stringify({ drinks: drinks.map(slimDrink) }, null, 2);
  } catch {
    return text.slice(0, 4000);
  }
}

export function searchCocktails(query: string): Promise<string> {
  return get(`/search.php?s=${encodeURIComponent(query)}`).then(slim);
}

export function getCocktail(id: string): Promise<string> {
  return get(`/lookup.php?i=${encodeURIComponent(id)}`).then(slim);
}

export function randomCocktail(): Promise<string> {
  return get("/random.php").then(slim);
}

export function listIngredients(): Promise<string> {
  return get("/list.php?i=list");
}

