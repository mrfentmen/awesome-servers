const BASE = 'https://www.fruityvice.com/api/fruit';

export interface FruitArgs {
  name: string;
}

export async function fruit(args: FruitArgs): Promise<string> {
  const name = (args.name ?? '').trim().toLowerCase();
  if (!name) return 'Provide a fruit name.';
  const res = await fetch(`${BASE}/${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': 'mrfentmen-fruityvice-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Fruityvice returned ${res.status}`);
  const d = (await res.json()) as {
    name?: string;
    id?: number;
    family?: string;
    order?: string;
    genus?: string;
    nutritions?: { calories?: number; fat?: number; sugar?: number; carbohydrates?: number; protein?: number };
  };
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

export async function all(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/all`, {
    headers: { 'User-Agent': 'mrfentmen-fruityvice-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Fruityvice returned ${res.status}`);
  const d = (await res.json()) as Array<{ name?: string; id?: number; family?: string }>;
  if (!Array.isArray(d) || !d.length) return 'No fruits returned.';
  return `Fruityvice fruits (${d.length}):\n` +
    d.slice(0, 40).map((f, i) => `${i + 1}. ${f.name ?? '?'} (${f.family ?? '?'})`).join('\n');
}

// ---- muxB tools:

function kcal(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? `${n} kcal` : 'not reported';
}

export interface GroceryProductArgs {
  barcode: string;
}

export interface ProductSearchArgs {
  query: string;
  limit?: number;
}

