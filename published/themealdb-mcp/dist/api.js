const m0 = (() => {
    const UA = 'mrfentmen-themealdb-mcp/1.0';
    const BASE = 'https://www.themealdb.com/api/json/v1/1';
    function describeMeal(m) {
        const ings = [];
        for (let i = 1; i <= 5; i++) {
            const name = m[`strIngredient${i}`];
            const measure = m[`strMeasure${i}`];
            if (name && name.trim())
                ings.push(`${measure?.trim() ?? ''} ${name.trim()}`.trim());
        }
        return `* ${m.strMeal ?? '?'} (${m.strArea ?? '?'} | ${m.strCategory ?? '?'})\n  Ingredients: ${ings.join(', ') || '?'}\n  ${(m.strInstructions ?? '').slice(0, 180)}${(m.strInstructions ?? '').length > 180 ? '...' : ''}`;
    }
    async function search(args) {
        const res = await fetch(`${BASE}/search.php?s=${encodeURIComponent(args.query)}`, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`TheMealDB returned ${res.status}`);
        const d = (await res.json());
        const meals = d.meals ?? [];
        if (!meals.length)
            return `No meals found for "${args.query}".`;
        return `Meals matching "${args.query}" (${meals.length}):\n` + meals.slice(0, 8).map(describeMeal).join('\n');
    }
    async function random(_args) {
        const res = await fetch(`${BASE}/random.php`, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`TheMealDB returned ${res.status}`);
        const d = (await res.json());
        const meal = d.meals?.[0];
        if (!meal)
            return 'No random meal returned.';
        return `Random meal:\n${describeMeal(meal)}`;
    }
    async function categories(_args) {
        const res = await fetch(`${BASE}/categories.php`, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`TheMealDB returned ${res.status}`);
        const d = (await res.json());
        const cats = d.categories ?? [];
        if (!cats.length)
            return 'No categories returned.';
        return `m0_Meal categories (${cats.length}):\n` + cats.map((c) => `* ${c.strCategory ?? '?'} - ${(c.strCategoryDescription ?? '').slice(0, 90)}`).join('\n');
    }
    async function filterByIngredient(args) {
        const res = await fetch(`${BASE}/filter.php?i=${encodeURIComponent(args.ingredient)}`, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`TheMealDB returned ${res.status}`);
        const d = (await res.json());
        const meals = d.meals ?? [];
        if (!meals.length)
            return `No meals with "${args.ingredient}".`;
        return `Meals with ${args.ingredient} (${meals.length}):\n` + meals.slice(0, 15).map((m, i) => `${i + 1}. ${m.strMeal ?? '?'}`).join('\n');
    }
    return { categories, filterByIngredient, random, search };
})();
const m1 = (() => {
    const BASE = "https://www.themealdb.com/api/json/v1/1";
    const UA = "mrfentmen-recipes-mcp/1.0 (https://github.com/mrfentmen)";
    class RecipesError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
        if (res.status === 429)
            throw new RecipesError("TheMealDB rate limit hit, wait and retry");
        if (!res.ok)
            throw new RecipesError(`TheMealDB error ${res.status}`);
        return (await res.json());
    }
    function ingredients(m) {
        const out = [];
        for (let i = 1; i <= 20; i++) {
            const ing = m?.[`strIngredient${i}`];
            const meas = m?.[`strMeasure${i}`];
            if (ing && ing.trim())
                out.push(`${meas ? meas.trim() + " " : ""}${ing.trim()}`);
        }
        return out;
    }
    async function searchRecipes(args) {
        const q = (args.query ?? "").trim();
        if (!q)
            throw new RecipesError("Provide a recipe name");
        const d = await get(`${BASE}/search.php?s=${encodeURIComponent(q)}`);
        const meals = d?.meals ?? [];
        if (!meals.length)
            return "No recipes found";
        return meals.map((m) => `${m.strMeal} (id ${m.idMeal})\n   ${m.strArea ?? ""} ${m.strCategory ?? ""} | ${m.strTags ?? ""}`).join("\n\n");
    }
    async function byIngredient(args) {
        const ing = (args.ingredient ?? "").trim();
        if (!ing)
            throw new RecipesError("Provide an ingredient");
        const d = await get(`${BASE}/filter.php?i=${encodeURIComponent(ing)}`);
        const meals = d?.meals ?? [];
        if (!meals.length)
            return `No recipes with ${ing}`;
        return meals.slice(0, 15).map((m, i) => `${i + 1}. ${m.strMeal} (id ${m.idMeal})`).join("\n");
    }
    async function recipeDetails(args) {
        const id = (args.mealId ?? "").trim();
        if (!id)
            throw new RecipesError("Provide a meal ID");
        const d = await get(`${BASE}/lookup.php?i=${encodeURIComponent(id)}`);
        const m = d?.meals?.[0];
        if (!m)
            return "No recipe found";
        const ings = ingredients(m);
        return `# ${m.strMeal}\n${m.strArea ?? ""} ${m.strCategory ?? ""}\n\nIngredients:\n${ings.map((i) => `- ${i}`).join("\n")}\n\nInstructions:\n${m.strInstructions ?? ""}${m.strYoutube ? `\n\nVideo: ${m.strYoutube}` : ""}`;
    }
    return { RecipesError, byIngredient, recipeDetails, searchRecipes };
})();
export const RecipesError = m1.RecipesError;
export const byIngredient = m1.byIngredient;
export const categories = m0.categories;
export const filterByIngredient = m0.filterByIngredient;
export const random = m0.random;
export const recipeDetails = m1.recipeDetails;
export const search = m0.search;
export const searchRecipes = m1.searchRecipes;
export const m0_random = m0.random;
export const m0_search = m0.search;
export const m0_categories = m0.categories;
export const m0_filterByIngredient = m0.filterByIngredient;
export const m1_recipeDetails = m1.recipeDetails;
export const m1_byIngredient = m1.byIngredient;
export const m1_RecipesError = m1.RecipesError;
export const m1_searchRecipes = m1.searchRecipes;
// ---- muxC tools:
const MEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";
const MEALDB_UA = { "User-Agent": "mrfentmen-themealdb-mcp/1.0", Accept: "application/json" };
async function mealdbGet(path) {
    const res = await fetch(`${MEALDB_BASE}${path}`, {
        headers: MEALDB_UA,
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`TheMealDB returned ${res.status}`);
    return (await res.json());
}
export async function filterByCategory(args) {
    const category = (args.category ?? "").trim();
    if (!category)
        throw new RecipesError("Provide a category, e.g. Seafood or Dessert");
    const limit = Math.max(1, Math.min(args.limit ?? 15, 30));
    const d = await mealdbGet(`/filter.php?c=${encodeURIComponent(category)}`);
    const meals = d.meals ?? [];
    if (!meals.length)
        return `No meals in category "${category}".`;
    return `Meals in category "${category}" (${meals.length}):\n` +
        meals.slice(0, limit).map((m, i) => `${i + 1}. ${m.strMeal ?? "?"} (id ${m.idMeal ?? "?"})${m.strArea ? ` - ${m.strArea}` : ""}`).join("\n");
}
export async function filterByArea(args) {
    const area = (args.area ?? "").trim();
    if (!area)
        throw new RecipesError("Provide an area, e.g. Canadian or Italian");
    const limit = Math.max(1, Math.min(args.limit ?? 15, 30));
    const d = await mealdbGet(`/filter.php?a=${encodeURIComponent(area)}`);
    const meals = d.meals ?? [];
    if (!meals.length)
        return `No meals from area "${area}".`;
    return `Meals from area "${area}" (${meals.length}):\n` +
        meals.slice(0, limit).map((m, i) => `${i + 1}. ${m.strMeal ?? "?"} (id ${m.idMeal ?? "?"})${m.strCountry ? ` - ${m.strCountry}` : ""}`).join("\n");
}
export async function listIngredients(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 40, 100));
    const d = await mealdbGet("/list.php?i=list");
    const names = (d.meals ?? []).map((m) => m.strIngredient ?? "?").filter(Boolean);
    if (!names.length)
        return "No ingredients returned.";
    return `TheMealDB ingredients (${names.length} total), first ${Math.min(limit, names.length)}:\n` +
        names.slice(0, limit).map((n, i) => `${i + 1}. ${n}`).join("\n");
}
