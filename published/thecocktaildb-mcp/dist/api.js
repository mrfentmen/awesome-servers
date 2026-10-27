/**
 * TheCocktailDB v1 with the free test key ("1").
 *
 * Verified behaviour of the free key: search.php (name and first-letter),
 * lookup.php, random.php and list.php answer fully, but filter.php returns at
 * most one drink, so this server does not offer filter tools — it browses by
 * first letter instead, which the free key serves up to 25 at a time.
 */
const BASE = "https://www.thecocktaildb.com/api/json/v1/1";
export class CocktailError extends Error {
}
async function getJson(path, timeoutMs = 20000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(`${BASE}${path}`, {
            signal: ctrl.signal,
            headers: { "user-agent": "thecocktaildb-mcp", accept: "application/json" },
        });
        if (res.status === 404)
            throw new CocktailError("Not found in TheCocktailDB");
        if (!res.ok)
            throw new CocktailError(`TheCocktailDB responded ${res.status}`);
        return await res.json();
    }
    catch (e) {
        if (e instanceof CocktailError)
            throw e;
        if (e.name === "AbortError")
            throw new CocktailError("TheCocktailDB request timed out");
        if (e instanceof SyntaxError)
            throw new CocktailError("TheCocktailDB returned a non-JSON response");
        throw new CocktailError(`TheCocktailDB request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
function ingredients(d) {
    const out = [];
    for (let i = 1; i <= 15; i++) {
        const name = d[`strIngredient${i}`];
        const measure = d[`strMeasure${i}`];
        if (name && String(name).trim())
            out.push(`${String(measure ?? "").trim()} ${String(name).trim()}`.trim());
    }
    return out;
}
function line(d, i) {
    const prefix = typeof i === "number" ? `${i + 1}. ` : "• ";
    const tags = [d.strCategory, d.strAlcoholic, d.strGlass].filter(Boolean).join(" · ");
    const extra = [d.strIBA ? "IBA" : "", d.strTags ?? ""].filter(Boolean).join(", ");
    return [
        `${prefix}${d.strDrink} (${d.idDrink})`,
        tags || extra ? `   ${[tags, extra].filter(Boolean).join(" · ")}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
function detail(d) {
    const ings = ingredients(d);
    return [
        `${d.strDrink} (${d.idDrink})`,
        `${[d.strCategory, d.strAlcoholic, d.strGlass].filter(Boolean).join(" · ")}${d.strIBA ? " · IBA official" : ""}`,
        d.strTags ? `Tags: ${d.strTags}` : "",
        "",
        `Ingredients (${ings.length}):`,
        ...ings.map((x) => `   • ${x}`),
        "",
        "Instructions:",
        `   ${String(d.strInstructions ?? "not given").replace(/\s+/g, " ").trim()}`,
        "",
        d.strDrinkThumb ? `Image: ${d.strDrinkThumb}` : "",
        d.strSource ? `Source: ${d.strSource}` : "",
    ]
        .filter((l) => l !== "")
        .join("\n");
}
const drinks = (d) => (Array.isArray(d?.drinks) ? d.drinks : []);
export async function searchCocktails(name, limit) {
    const rows = drinks(await getJson(`/search.php?s=${encodeURIComponent(name.trim())}`));
    if (rows.length === 0)
        return `No cocktails match "${name}".`;
    return [
        `Cocktails matching "${name}" (${rows.length}):`,
        "",
        ...rows.slice(0, limit).map(line),
        "",
        "Use cocktail_detail for ingredients and instructions.",
    ].join("\n");
}
export async function cocktailDetail(id) {
    const clean = id.trim();
    if (!/^\d{3,6}$/.test(clean))
        throw new CocktailError(`"${id}" is not a numeric cocktail id`);
    const rows = drinks(await getJson(`/lookup.php?i=${clean}`));
    if (rows.length === 0)
        throw new CocktailError(`No cocktail with id ${clean}`);
    return detail(rows[0]);
}
export async function randomCocktail() {
    const rows = drinks(await getJson("/random.php"));
    if (rows.length === 0)
        throw new CocktailError("TheCocktailDB returned no random drink");
    return detail(rows[0]);
}
export async function browseByLetter(letter, limit) {
    const l = letter.trim().toLowerCase();
    if (!/^[a-z]$/.test(l))
        throw new CocktailError("Pass a single letter a-z");
    const rows = drinks(await getJson(`/search.php?f=${l}`));
    if (rows.length === 0)
        return `No cocktails start with "${l}".`;
    return [
        `Cocktails starting with "${l.toUpperCase()}" (${rows.length} returned by the free key):`,
        "",
        ...rows.slice(0, limit).map(line),
    ].join("\n");
}
export async function listIngredients(limit) {
    const rows = drinks(await getJson("/list.php?i=list"));
    const names = rows.map((r) => String(r.strIngredient1 ?? "")).filter(Boolean);
    if (names.length === 0)
        return "TheCocktailDB returned no ingredients.";
    return [
        `Ingredients the free key exposes (${names.length}):`,
        "",
        names.slice(0, limit).join(", "),
        "",
        "Search a cocktail by name to find drinks using one of these.",
    ].join("\n");
}
export async function listFilters() {
    const [cats, glasses, alcohol] = await Promise.all([
        getJson("/list.php?c=list"),
        getJson("/list.php?g=list"),
        getJson("/list.php?a=list"),
    ]);
    const names = (d, key) => Array.isArray(d?.drinks) ? d.drinks.map((x) => x[key]).filter(Boolean) : [];
    const categories = names(cats, "strCategory");
    const glassList = names(glasses, "strGlass");
    const strength = names(alcohol, "strAlcoholic");
    return [
        `Categories (${categories.length}): ${categories.join(", ")}`,
        "",
        `Glasses (${glassList.length}): ${glassList.join(", ")}`,
        "",
        `Strength (${strength.length}): ${strength.join(", ")}`,
    ].join("\n");
}
