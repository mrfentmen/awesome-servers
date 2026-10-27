const UA = "mrfentmen-coffee-mcp/1.0 (https://github.com/mrfentmen)";
const BASE = "https://api.sampleapis.com/coffee";
export class CoffeeError extends Error {
}
async function get(path) {
    const res = await fetch(`${BASE}/${path}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new CoffeeError(`Coffee API returned HTTP ${res.status}`);
    return (await res.json());
}
function format(list) {
    return list.map((d, i) => `${i + 1}. ${d.title}\n   ${(d.description ?? "").slice(0, 120)}\n   Ingredients: ${(d.ingredients ?? []).join(", ") || "n/a"}`).join("\n\n");
}
export async function hot(args) {
    const limit = Math.min(args.limit ?? 10, 30);
    return format((await get("hot")).slice(0, limit));
}
export async function iced(args) {
    const limit = Math.min(args.limit ?? 10, 30);
    return format((await get("iced")).slice(0, limit));
}
export async function search(args) {
    const q = (args.query ?? "").trim().toLowerCase();
    if (!q)
        throw new CoffeeError("Provide a search keyword");
    const limit = Math.min(args.limit ?? 10, 30);
    const all = [...(await get("hot")), ...(await get("iced"))];
    const hits = all.filter((d) => d.title.toLowerCase().includes(q) || (d.description ?? "").toLowerCase().includes(q)).slice(0, limit);
    if (!hits.length)
        return `No coffee drinks match "${args.query}"`;
    return format(hits);
}
async function catalogue() {
    const [hot, iced] = await Promise.all([get("hot"), get("iced")]);
    return { hot: hot ?? [], iced: iced ?? [] };
}
function bound(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
/**
 * The API types ingredients as a list, but a few records carry a bare string,
 * so normalise both shapes before any code calls .map or .some on it.
 */
function ingredientList(d) {
    const raw = d.ingredients;
    if (Array.isArray(raw))
        return raw.map((x) => String(x).trim()).filter(Boolean);
    if (typeof raw === "string")
        return raw.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
    return [];
}
function name(d, kind) {
    return d.title?.trim() || `untitled drink (id ${d.id ?? '?'})`;
}
export async function drinksWithIngredient(args) {
    const wanted = (args.ingredient ?? "").trim().toLowerCase();
    if (!wanted)
        throw new CoffeeError("Provide an ingredient, e.g. Espresso.");
    const limit = bound(args.limit, 20, 60);
    const { hot, iced } = await catalogue();
    const rows = [
        ...hot.map((d) => ({ d, kind: "hot" })),
        ...iced.map((d) => ({ d, kind: "iced" })),
    ];
    const hits = rows.filter((r) => ingredientList(r.d).some((a) => a.toLowerCase().includes(wanted)));
    if (!hits.length) {
        return `No drink in the catalogue lists "${args.ingredient}". Try drinks_with_ingredient on a term from ingredient_index.`;
    }
    const shown = hits.slice(0, limit);
    return [
        `${hits.length} of ${rows.length} drink(s) list "${args.ingredient}", showing ${shown.length}.`,
        ...shown.map((r, i) => `${i + 1}. ${name(r.d, r.kind)} (${r.kind}) | ingredients: ${ingredientList(r.d).join(", ") || "not reported"}`),
        hits.length > shown.length ? `...and ${hits.length - shown.length} more.` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
