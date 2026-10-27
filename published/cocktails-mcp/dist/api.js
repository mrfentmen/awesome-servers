const BASE = "https://www.thecocktaildb.com/api/json/v1/1";
const UA = "mrfentmen-cocktails-mcp/1.0 (https://github.com/mrfentmen)";
export class CocktailsError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    if (res.status === 429)
        throw new CocktailsError("TheCocktailDB rate limit hit, wait and retry");
    if (!res.ok)
        throw new CocktailsError(`TheCocktailDB error ${res.status}`);
    return (await res.json());
}
function ingredients(c) {
    const out = [];
    for (let i = 1; i <= 15; i++) {
        const ing = c?.[`strIngredient${i}`];
        const meas = c?.[`strMeasure${i}`];
        if (ing && ing.trim())
            out.push(`${meas ? meas.trim() + " " : ""}${ing.trim()}`);
    }
    return out;
}
export async function searchCocktails(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new CocktailsError("Provide a cocktail name");
    const d = await get(`${BASE}/search.php?s=${encodeURIComponent(q)}`);
    const drinks = d?.drinks ?? [];
    if (!drinks.length)
        return "No cocktails found";
    return drinks.map((c) => `${c.strDrink} (id ${c.idDrink})\n   ${c.strCategory ?? ""} | ${c.strAlcoholic ?? ""} | ${c.strGlass ?? ""}`).join("\n\n");
}
export async function byIngredient(args) {
    const ing = (args.ingredient ?? "").trim();
    if (!ing)
        throw new CocktailsError("Provide an ingredient");
    const d = await get(`${BASE}/filter.php?i=${encodeURIComponent(ing)}`);
    const drinks = d?.drinks ?? [];
    if (!drinks.length)
        return `No cocktails with ${ing}`;
    return drinks.slice(0, 15).map((c, i) => `${i + 1}. ${c.strDrink} (id ${c.idDrink})`).join("\n");
}
export async function cocktailDetails(args) {
    const id = (args.cocktailId ?? "").trim();
    if (!id)
        throw new CocktailsError("Provide a cocktail ID");
    const d = await get(`${BASE}/lookup.php?i=${encodeURIComponent(id)}`);
    const c = d?.drinks?.[0];
    if (!c)
        return "No cocktail found";
    const ings = ingredients(c);
    return `# ${c.strDrink}\n${c.strAlcoholic ?? ""} | ${c.strGlass ?? ""}\n\nIngredients:\n${ings.map((i) => `- ${i}`).join("\n")}\n\nInstructions:\n${c.strInstructions ?? ""}`;
}
const COCKTAIL_PARAM = { category: "c", glass: "g", strength: "a" };
const COCKTAIL_LIST_KEY = {
    category: "strCategory",
    glass: "strGlass",
    strength: "strAlcoholic",
};
const COCKTAIL_FACETS = ["category", "glass", "strength"];
// filter.php answers an unknown value with the string "no data found" instead
// of an empty list, so the shape has to be checked rather than trusted.
function cocktailRows(payload) {
    return Array.isArray(payload?.drinks) ? payload.drinks : null;
}
async function cocktailFacetValues(facet) {
    const d = await get(`${BASE}/list.php?${COCKTAIL_PARAM[facet]}=list`);
    const rows = Array.isArray(d?.drinks) ? d.drinks : [];
    const key = COCKTAIL_LIST_KEY[facet];
    return rows
        .map((row) => row?.[key])
        .filter((value) => typeof value === "string" && value.trim().length > 0);
}
function cocktailFacet(facet) {
    return COCKTAIL_FACETS.includes(facet) ? facet : null;
}
function cocktailPairs(drink) {
    const pairs = [];
    for (let i = 1; i <= 15; i++) {
        const name = drink?.[`strIngredient${i}`];
        if (typeof name !== "string" || !name.trim())
            continue;
        const measure = drink?.[`strMeasure${i}`];
        pairs.push({ name: name.trim(), measure: typeof measure === "string" ? measure.trim() : "" });
    }
    return pairs;
}
function cocktailSummary(drink) {
    const parts = [drink?.strCategory, drink?.strAlcoholic, drink?.strGlass].filter((value) => typeof value === "string" && value.trim());
    return parts.length ? parts.join(" | ") : "no classification published";
}
export async function randomCocktail(_args) {
    const d = await get(`${BASE}/random.php`);
    const drink = Array.isArray(d?.drinks) ? d.drinks[0] : null;
    if (!drink)
        throw new CocktailsError("TheCocktailDB returned no random cocktail");
    const ings = ingredients(drink);
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
        .join("\n");
}
