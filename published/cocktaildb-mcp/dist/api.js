const BASE = "https://www.thecocktaildb.com/api/json/v1/1";
const UA = "mrfentmen-cocktaildb-mcp/1.0";
export class CocktailError extends Error {
    constructor(message) {
        super(message);
        this.name = "CocktailError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const clamp = (value, fallback, max = 50) => Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);
const truncate = (value, max = 3800) => value.length <= max ? value : `${value.slice(0, max)}\n… (truncated)`;
async function getJson(path) {
    let res;
    try {
        res = await fetch(`${BASE}${path}`, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new CocktailError(`Network error: ${errorMessage(e)}`);
    }
    if (!res.ok)
        throw new CocktailError(`TheCocktailDB returned ${res.status}`);
    // The API answers 200 with {"drinks":"no data found"} for empty results.
    return (await res.json());
}
const drinksOf = (data) => Array.isArray(data.drinks) ? data.drinks : [];
const str = (value) => (typeof value === "string" ? value.trim() : "");
/** list.php returns one single-key object per row, e.g. {"strCategory":"Beer"}. */
const pick = (data, field) => drinksOf(data).map((d) => str(d[field])).filter(Boolean);
function recipe(d) {
    const ingredients = [];
    for (let i = 1; i <= 15; i += 1) {
        const name = str(d[`strIngredient${i}`]);
        if (!name)
            continue;
        const measure = str(d[`strMeasure${i}`]);
        ingredients.push(`  ${ingredients.length + 1}. ${measure ? `${measure} ` : ""}${name}`);
    }
    const lines = [
        `${str(d.strDrink)} (id ${str(d.idDrink)})`,
        `Category: ${str(d.strCategory) || "n/a"} | Glass: ${str(d.strGlass) || "n/a"} | ${str(d.strAlcoholic) || "n/a"}`,
        "Ingredients:",
        ...ingredients,
        "Instructions:",
        str(d.strInstructions) || "n/a",
    ];
    const image = str(d.strDrinkThumb);
    if (image)
        lines.push(`Image: ${image}`);
    return lines.join("\n");
}
function compact(d) {
    const bits = [str(d.strCategory), str(d.strGlass), str(d.strAlcoholic)].filter(Boolean);
    return `${str(d.strDrink)} (id ${str(d.idDrink)})${bits.length ? ` — ${bits.join(", ")}` : ""}`;
}
export async function searchCocktails(args) {
    const limit = clamp(args.limit, 10, 25);
    const found = drinksOf(await getJson(`/search.php?s=${encodeURIComponent(args.query)}`));
    if (!found.length) {
        return `No cocktail matched "${args.query}". Try filter_cocktails (by ingredient or category) or list_ingredients.`;
    }
    const shown = found.slice(0, limit);
    return truncate(`${found.length} cocktail(s) matching "${args.query}" (showing ${shown.length}):\n` +
        shown.map((d, i) => `${i + 1}. ${compact(d)}`).join("\n") +
        "\nUse get_cocktail with an id for the full recipe and measures.");
}
export async function getCocktail(id) {
    const found = drinksOf(await getJson(`/lookup.php?i=${encodeURIComponent(id)}`));
    if (!found.length)
        throw new CocktailError(`No cocktail with id ${id}. Find ids with search_cocktails.`);
    return truncate(found.map(recipe).join("\n\n"));
}
export async function randomCocktail(count) {
    const n = clamp(count, 1, 3);
    const recipes = [];
    for (let i = 0; i < n; i += 1) {
        const found = drinksOf(await getJson("/random.php"));
        if (found.length)
            recipes.push(recipe(found[0]));
    }
    if (!recipes.length)
        throw new CocktailError("TheCocktailDB returned no random cocktail");
    return truncate(recipes.join("\n\n"));
}
export async function listIngredients(args = {}) {
    const names = pick(await getJson("/list.php?i=list"), "strIngredient1");
    const needle = (args.search ?? "").trim().toLowerCase();
    const matched = needle ? names.filter((n) => n.toLowerCase().includes(needle)) : names;
    if (!matched.length)
        return `No ingredient matched "${args.search}".`;
    const limit = clamp(args.limit, 40, 200);
    const shown = matched.slice(0, limit);
    return truncate(`${matched.length} ingredient(s)${needle ? ` matching "${args.search}"` : ""} (showing ${shown.length}):\n` +
        shown.map((n, i) => `${i + 1}. ${n}`).join("\n") +
        "\nUse ingredient_info for a profile of one ingredient.");
}
const FILTERS = {
    ingredient: { param: "i", label: "ingredient" },
    category: { param: "c", label: "category" },
    glass: { param: "g", label: "glass" },
    alcohol: { param: "a", label: "alcohol" },
};
export async function filterCocktails(args) {
    const key = args.by.trim().toLowerCase();
    const filter = FILTERS[key];
    if (!filter)
        throw new CocktailError("by must be ingredient, category, glass, or alcohol");
    const found = drinksOf(await getJson(`/filter.php?${filter.param}=${encodeURIComponent(args.value)}`));
    if (!found.length) {
        return `No cocktails found with ${filter.label} "${args.value}". Use list_filters to see valid categories, glasses and alcohol options.`;
    }
    const limit = clamp(args.limit, 20, 50);
    const shown = found.slice(0, limit);
    return truncate(`${found.length} cocktail(s) with ${filter.label} "${args.value}" (showing ${shown.length}):\n` +
        shown.map((d, i) => `${i + 1}. ${compact(d)}`).join("\n") +
        "\nUse get_cocktail with an id for the full recipe.");
}
export async function ingredientInfo(name) {
    const data = await getJson(`/search.php?i=${encodeURIComponent(name)}`);
    const found = Array.isArray(data.ingredients) ? data.ingredients : [];
    if (!found.length) {
        return `No ingredient named "${name}". Use list_ingredients to see valid ingredient names.`;
    }
    const ing = found[0];
    const description = str(ing.strDescription).replace(/\s+/g, " ");
    const facts = [`Type: ${str(ing.strType) || "n/a"}`, `Alcohol: ${str(ing.strAlcohol) || "n/a"}`];
    const abv = str(ing.strABV);
    if (abv)
        facts.push(`ABV: ${abv}%`);
    return truncate([
        `${str(ing.strIngredient)} (id ${str(ing.idIngredient)})`,
        facts.join(" | "),
        description || "No description available.",
    ].join("\n"));
}
const LISTS = {
    categories: { param: "c", field: "strCategory", label: "Categories" },
    glasses: { param: "g", field: "strGlass", label: "Glass types" },
    alcohol: { param: "a", field: "strAlcoholic", label: "Alcohol options" },
};
export async function listFilters(kind) {
    const want = (kind ?? "all").trim().toLowerCase();
    const keys = want === "all" ? Object.keys(LISTS) : [want];
    for (const key of keys) {
        if (!LISTS[key])
            throw new CocktailError("kind must be categories, glasses, alcohol, or all");
    }
    const blocks = [];
    for (const key of keys) {
        const { param, field, label } = LISTS[key];
        const values = pick(await getJson(`/list.php?${param}=list`), field);
        blocks.push(`${label} (${values.length}): ${values.join(", ")}`);
    }
    return truncate(`${blocks.join("\n\n")}\n\nUse these values with filter_cocktails.`);
}
// ---- batch-3 tools: browse by letter + multi-ingredient filter (2026-09-27) ----
export async function searchByLetter(letter, limit) {
    const wanted = (letter ?? "").trim();
    if (!/^[a-zA-Z]$/.test(wanted))
        throw new CocktailError("Provide a single letter a-z.");
    const found = drinksOf(await getJson(`/search.php?f=${encodeURIComponent(wanted.toLowerCase())}`));
    if (!found.length)
        return `No cocktails start with "${wanted}".`;
    const count = clamp(limit, 20, 50);
    const shown = found.slice(0, count);
    return truncate(`${found.length} cocktail(s) starting with "${wanted.toUpperCase()}" (showing ${shown.length}):\n` +
        shown.map((d, i) => `${i + 1}. ${compact(d)}`).join("\n") +
        "\nUse get_cocktail with an id for the full recipe.");
}
export async function filterMultiIngredient(ingredients, limit) {
    const list = (ingredients ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length < 2)
        throw new CocktailError("Provide at least two ingredients, comma separated, e.g. Gin,Tonic water.");
    if (list.length > 6)
        throw new CocktailError("Provide at most six ingredients.");
    const found = drinksOf(await getJson(`/filter.php?i=${encodeURIComponent(list.join(","))}`));
    if (!found.length) {
        return `No cocktail contains all of: ${list.join(", ")}. Check exact ingredient names with list_ingredients.`;
    }
    const count = clamp(limit, 20, 50);
    const shown = found.slice(0, count);
    return truncate(`${found.length} cocktail(s) containing all of ${list.join(", ")} (showing ${shown.length}):\n` +
        shown.map((d, i) => `${i + 1}. ${compact(d)}`).join("\n") +
        "\nUse get_cocktail with an id for the full recipe.");
}
// ---- muxD tools:
/** The translated instruction fields TheCocktailDB publishes, keyed by its own field suffix. */
const TRANSLATIONS = [
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
let letterIndex = null;
async function drinksByLetter(refresh = false) {
    if (letterIndex && !refresh)
        return letterIndex;
    const index = new Map();
    for (const letter of LETTERS) {
        const found = drinksOf(await getJson(`/search.php?f=${letter}`));
        index.set(letter, found);
    }
    letterIndex = index;
    return index;
}
/** The A to Z shape of what the free API will actually serve, including which letters are truncated. */
export async function catalogueIndex(args = {}) {
    const refresh = args.refresh === "true" || args.refresh === "1";
    const started = Date.now();
    const index = await drinksByLetter(refresh);
    const rows = [];
    for (const letter of LETTERS)
        rows.push(...(index.get(letter) ?? []));
    const unique = new Map(rows.map((r) => [str(r.idDrink), r]));
    const reachable = [...unique.values()];
    // The free API stops at 25 rows per search, so a letter sitting exactly on 25 is
    // not a real count of the database.
    const capped = LETTERS.filter((l) => (index.get(l) ?? []).length >= 25);
    const seen = new Set();
    const lines = [
        `TheCocktailDB catalogue reachable from the free API: ${reachable.length} distinct drink(s) across ${LETTERS.length} letters (${Date.now() - started} ms)`,
        "",
        "The free API serves at most 25 drinks per search and search.php is the only endpoint",
        "returning full records, so a letter showing exactly 25 is truncated, not complete.",
        `${capped.length} letter(s) are at the 25 cap: ${capped.join(", ") || "none"}. Those letters are incomplete.`,
        "",
        `${"letter".padEnd(7)}${"n".padStart(4)}  first / last`,
    ];
    for (const letter of LETTERS) {
        const list = index.get(letter) ?? [];
        const uniq = list.filter((r) => {
            const id = Number(str(r.idDrink));
            if (seen.has(id))
                return false;
            seen.add(id);
            return true;
        });
        const first = str(uniq[0]?.strDrink) || "-";
        const last = str(uniq[uniq.length - 1]?.strDrink) || "-";
        const mark = list.length >= 25 ? "  <- at the 25 cap, incomplete" : "";
        lines.push(`${letter.toUpperCase().padEnd(7)}${String(list.length).padStart(4)}  ${first} / ${last}${mark}`);
    }
    return truncate(lines.join("\n"));
}
// ---- muxF tools:
/** The full record for one drink, including the fields the recipe view drops, plus data-quality flags. */
export async function drinkRecordAudit(id) {
    const wanted = String(id ?? "").trim();
    if (!/^\d+$/.test(wanted))
        throw new CocktailError("Give a numeric drink id, e.g. 11007 for a Margarita.");
    const found = drinksOf(await getJson(`/lookup.php?i=${encodeURIComponent(wanted)}`));
    if (!found.length)
        throw new CocktailError(`No drink with id ${wanted}. Find ids with search_cocktails.`);
    const d = found[0];
    const ingredients = [];
    const holes = [];
    let lastFilled = 0;
    for (let i = 1; i <= 15; i += 1) {
        const name = str(d[`strIngredient${i}`]);
        if (!name) {
            holes.push(i);
            continue;
        }
        lastFilled = i;
        const measure = str(d[`strMeasure${i}`]);
        ingredients.push({ slot: i, ingredient: name, measure: measure || null, has_measure: Boolean(measure) });
    }
    const emptySlots = holes.filter((i) => i < lastFilled);
    const translations = TRANSLATIONS.map(([language, field]) => ({ language, instructions: str(d[field]) || null })).filter((t) => t.instructions);
    const cc = str(d.strCreativeCommonsConfirmed).toLowerCase();
    const documented = ["strDrinkAlternate", "strTags", "strIBA", "strVideo", "strImageSource"];
    return truncate(JSON.stringify({
        id: str(d.idDrink),
        name: str(d.strDrink),
        alternate_name: str(d.strDrinkAlternate) || null,
        iba: str(d.strIBA) || null,
        category: str(d.strCategory) || null,
        alcoholic: str(d.strAlcoholic) || null,
        glass: str(d.strGlass) || null,
        tags: str(d.strTags) ? str(d.strTags).split(",").map((t) => t.trim()).filter(Boolean) : [],
        instructions: str(d.strInstructions) || null,
        translations_held: translations.length,
        translations,
        video: str(d.strVideo) || null,
        image: str(d.strDrinkThumb) || null,
        image_source: str(d.strImageSource) || null,
        image_attribution: str(d.strImageAttribution) || null,
        creative_commons_confirmed: cc === "yes" ? true : cc === "no" ? false : null,
        last_modified: str(d.dateModified) || null,
        ingredients,
        quality: {
            ingredients_listed: ingredients.length,
            empty_ingredient_slots: emptySlots.length,
            empty_slot_positions: emptySlots,
            ingredients_without_measure: ingredients.filter((i) => !i.has_measure).length,
            image_licence_confirmed: cc === "yes",
            missing_documented_fields: documented.filter((f) => !str(d[f])),
            has_translations: translations.length > 0,
        },
        note: "Read straight from TheCocktailDB's lookup record; an unconfirmed Creative Commons flag is the site's silence, not a denial.",
    }, null, 2), 9000);
}
/** Name families: a drink joins the longest other drink name it actually contains. */
export async function nameVariants(args = {}) {
    const refresh = args.refresh === "true" || args.refresh === "1";
    const top = Math.min(Math.max(Math.trunc(Number(args.top ?? 15)) || 15, 1), 40);
    const minFamily = Math.min(Math.max(Math.trunc(Number(args.min_family ?? 2)) || 2, 2), 20);
    const index = await drinksByLetter(refresh);
    const unique = new Map();
    for (const list of index.values())
        for (const row of list)
            unique.set(str(row.idDrink), row);
    const drinks = [...unique.values()].filter((d) => str(d.strDrink));
    if (!drinks.length)
        throw new CocktailError("The catalogue index came back empty; retry with refresh=true.");
    const byName = new Map();
    for (const d of drinks) {
        const key = str(d.strDrink).toLowerCase();
        if (!byName.has(key))
            byName.set(key, d);
    }
    const candidates = [...byName.keys()].sort((a, b) => b.length - a.length);
    const families = new Map();
    let standalone = 0;
    for (const d of drinks) {
        const name = str(d.strDrink).toLowerCase();
        let parent = null;
        for (const cand of candidates) {
            if (cand.length >= name.length)
                continue;
            if (name.startsWith(`${cand} `) || name.startsWith(`${cand}'s `) || name.startsWith(`${cand}s `) || name.endsWith(` ${cand}`)) {
                parent = cand;
                break;
            }
        }
        if (!parent) {
            standalone += 1;
            continue;
        }
        if (!families.has(parent))
            families.set(parent, []);
        families.get(parent).push(str(d.strDrink));
    }
    const rows = [...families.entries()]
        .map(([base, members]) => ({ family: byName.get(base) ? str(byName.get(base).strDrink) : base, variants: members.length + 1, members: members.sort() }))
        .filter((r) => r.variants >= minFamily)
        .sort((a, b) => b.variants - a.variants || a.family.localeCompare(b.family));
    if (!rows.length)
        return `No name family with at least ${minFamily} member(s) among the ${drinks.length} reachable drinks.`;
    const shown = rows.slice(0, top);
    const lines = [
        `${rows.length} drink name famil${rows.length === 1 ? "y" : "ies"} with at least ${minFamily} member(s), from ${drinks.length} distinct reachable drink(s) (showing ${shown.length})`,
        `${standalone} drink(s) match no other name and stand alone.`,
        "",
    ];
    for (const row of shown) {
        lines.push(`${row.variants}. ${row.family}`);
        for (const member of row.members)
            lines.push(`     - ${member}`);
    }
    lines.push("", "A family is named after the longest other drink name the variant actually contains, so a base drink must exist in the data for its variants to group.");
    return truncate(lines.join("\n"), 9000);
}
