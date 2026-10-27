const BASE = 'https://fakestoreapi.com';
const UA = 'mrfentmen-fakestoreapi-mcp/1.0';
export async function products(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 20);
    const res = await fetch(`${BASE}/products?limit=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`FakeStoreAPI returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d) || !d.length)
        return 'No products returned.';
    return `FakeStoreAPI products (${d.length}):\n` +
        d.map((p, i) => `${i + 1}. ${p.title ?? '?'} - $${p.price ?? '?'} [${p.category ?? '?'}]`).join('\n');
}
export async function product(args) {
    const id = Number(args.id);
    if (!Number.isFinite(id) || id <= 0)
        return 'Provide a product id.';
    const res = await fetch(`${BASE}/products/${id}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`FakeStoreAPI returned ${res.status}`);
    const d = (await res.json());
    return [
        `Product #${d.id ?? id}`,
        `Title: ${d.title ?? '?'}`,
        `Price: $${d.price ?? '?'} | Category: ${d.category ?? '?'}`,
        d.description ? `Description: ${d.description}` : null,
        d.rating ? `Rating: ${d.rating.rate ?? '?'}/5 (${d.rating.count ?? '?'} votes)` : null,
        d.image ? `Image: ${d.image}` : null,
    ].filter(Boolean).join('\n');
}
export async function categories(_args) {
    const res = await fetch(`${BASE}/products/categories`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`FakeStoreAPI returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d) || !d.length)
        return 'No categories returned.';
    return `FakeStoreAPI categories:\n${d.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
}
function money(value) {
    return typeof value === 'number' ? `$${value.toFixed(2)}` : '$?';
}
async function fetchProducts() {
    const res = await fetch(`${BASE}/products`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`FakeStoreAPI returned ${res.status}`);
    const d = (await res.json());
    return Array.isArray(d) ? d : [];
}
export async function catalogSummary(args) {
    const all = await fetchProducts();
    if (!all.length)
        return 'The store returned no products.';
    const byCategory = new Map();
    for (const p of all) {
        const key = p.category ?? 'uncategorised';
        const bucket = byCategory.get(key);
        if (bucket)
            bucket.push(p.price ?? 0);
        else
            byCategory.set(key, [p.price ?? 0]);
    }
    const priced = all.map((p) => p.price).filter((p) => typeof p === 'number');
    const total = priced.reduce((a, b) => a + b, 0);
    const lines = [
        `Store catalogue: ${all.length} products in ${byCategory.size} categories`,
        `Price across the catalogue: min ${money(Math.min(...priced))}, max ${money(Math.max(...priced))}, average ${money(priced.length ? total / priced.length : undefined)}`,
        'By category:',
    ];
    const ranked = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length);
    for (const [name, prices] of ranked) {
        const sum = prices.reduce((a, b) => a + b, 0);
        lines.push(`  ${name}: ${prices.length} products, average ${money(prices.length ? sum / prices.length : undefined)}, range ${money(Math.min(...prices))} to ${money(Math.max(...prices))}`);
    }
    const top = Math.max(1, Math.min(Math.trunc(args.top ?? 3), 10));
    const rated = all
        .filter((p) => p.rating && typeof p.rating.rate === 'number')
        .sort((a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0))
        .slice(0, top);
    lines.push(`Best rated (${rated.length} of ${all.length}):`);
    for (const p of rated) {
        lines.push(`  ${p.title ?? '?'} — ${p.rating?.rate ?? '?'}/5 from ${p.rating?.count ?? '?'} votes, ${money(p.price)}`);
    }
    return lines.join('\n');
}
