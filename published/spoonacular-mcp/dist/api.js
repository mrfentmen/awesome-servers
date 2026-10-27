/**
 * Spoonacular API client. Needs SPOONACULAR_API_KEY
 * (free at https://spoonacular.com/food-api, 150 calls/day).
 * Docs: https://spoonacular.com/food-api/docs
 *
 * The Open Food Facts premium tools moved to the licence gateway
 * (src/gateway.ts); what remains here is the free Spoonacular client.
 */
const BASE = "https://api.spoonacular.com";
export class SpoonacularError extends Error {
}
function apiKey() {
    const k = process.env.SPOONACULAR_API_KEY;
    if (!k)
        throw new SpoonacularError("Set SPOONACULAR_API_KEY first (free at spoonacular.com/food-api).");
    return k;
}
async function getJson(path, extra = {}) {
    const qs = new URLSearchParams({ ...extra, apiKey: apiKey() }).toString();
    const res = await fetch(`${BASE}${path}?${qs}`, {
        headers: { "User-Agent": "spoonacular-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new SpoonacularError("Spoonacular refused (401/403). Check API key.");
    if (res.status === 402)
        throw new SpoonacularError("Spoonacular quota used up (free tier is 150/day).");
    if (res.status === 404)
        throw new SpoonacularError("Not found.");
    if (!res.ok)
        throw new SpoonacularError(`Spoonacular error ${res.status}`);
    return (await res.json());
}
export async function searchRecipes(query, limit = 5) {
    if (!query.trim())
        throw new SpoonacularError("Query is empty.");
    const data = await getJson("/recipes/complexSearch", { query: query.trim(), number: String(Math.min(Math.max(limit, 1), 100)), addRecipeInformation: "false" });
    const rows = Array.isArray(data.results) ? data.results : [];
    return rows.slice(0, limit).map((r) => ({
        id: Number(r.id),
        title: r.title,
        minutes: r.readyInMinutes,
        servings: r.servings,
        image: r.image,
    }));
}
export async function getRecipe(id) {
    if (!/^\d+$/.test(id.trim()))
        throw new SpoonacularError(`Recipe id must be numeric, got "${id}".`);
    const r = await getJson(`/recipes/${id.trim()}/information?includeNutrition=false`);
    const ings = Array.isArray(r.extendedIngredients) ? r.extendedIngredients : [];
    const steps = [];
    for (const inst of (r.analyzedInstructions ?? [])) {
        for (const st of (inst.steps ?? [])) {
            if (st.step)
                steps.push(String(st.step));
            if (steps.length >= 8)
                break;
        }
    }
    const lines = [
        `[${r.id ?? id}] ${r.title ?? "(untitled)"}${r.readyInMinutes ? ` — ${r.readyInMinutes} min` : ""}${r.servings ? `, serves ${r.servings}` : ""}`,
        ings.length ? `Ingredients: ${ings.slice(0, 10).map((g) => String(g.original ?? g.name ?? "?")).join("; ")}` : "",
        steps.length ? `Steps:\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : "",
        r.sourceUrl ? `Source: ${r.sourceUrl}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export async function guessNutrition(text) {
    if (!text.trim())
        throw new SpoonacularError("Text is empty.");
    const data = await getJson(`/recipes/guessNutrition?title=${encodeURIComponent(text.trim())}`);
    const cal = (data.calories ?? {});
    const fat = (data.fat ?? {});
    const protein = (data.protein ?? {});
    const carbs = (data.carbs ?? {});
    return [
        `Guess for "${text.trim().slice(0, 60)}"`,
        `Calories: ${cal.value ?? "?"}${cal.unit ?? ""}`,
        `Fat: ${fat.value ?? "?"}${fat.unit ?? ""} · Protein: ${protein.value ?? "?"}${protein.unit ?? ""} · Carbs: ${carbs.value ?? "?"}${carbs.unit ?? ""}`,
    ].join("\n");
}
export function formatRecipe(r, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${r.id}] ${r.title ?? "(untitled)"}${r.minutes !== undefined ? ` — ${r.minutes} min` : ""}${r.servings !== undefined ? `, serves ${r.servings}` : ""}${r.image ? `\n   ${r.image}` : ""}`;
}
