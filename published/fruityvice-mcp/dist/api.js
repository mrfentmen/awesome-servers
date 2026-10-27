const BASE = 'https://www.fruityvice.com/api/fruit';
export async function fruit(args) {
    const name = (args.name ?? '').trim().toLowerCase();
    if (!name)
        return 'Provide a fruit name.';
    const res = await fetch(`${BASE}/${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': 'mrfentmen-fruityvice-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Fruityvice returned ${res.status}`);
    const d = (await res.json());
    const n = d.nutritions ?? {};
    return [
        `Fruit: ${d.name ?? name} (id=${d.id ?? '?'})`,
        `Family: ${d.family ?? '?'} | Order: ${d.order ?? '?'} | Genus: ${d.genus ?? '?'}`,
        `Nutrition per 100g:`,
        `  Calories: ${n.calories ?? '?'} kcal`,
        `  Fat: ${n.fat ?? '?'} g | Sugar: ${n.sugar ?? '?'} g`,
        `  Carbs: ${n.carbohydrates ?? '?'} g | Protein: ${n.protein ?? '?'} g`,
    ].join('\n');
}
export async function all(_args) {
    const res = await fetch(`${BASE}/all`, {
        headers: { 'User-Agent': 'mrfentmen-fruityvice-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Fruityvice returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d) || !d.length)
        return 'No fruits returned.';
    return `Fruityvice fruits (${d.length}):\n` +
        d.slice(0, 40).map((f, i) => `${i + 1}. ${f.name ?? '?'} (${f.family ?? '?'})`).join('\n');
}
// ---- muxB tools:
function kcal(value) {
    const n = Number(value);
    return Number.isFinite(n) ? `${n} kcal` : 'not reported';
}
