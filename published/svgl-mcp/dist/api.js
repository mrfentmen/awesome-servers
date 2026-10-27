const BASE = 'https://api.svgl.app';
const UA = 'mrfentmen-svgl-mcp/1.0';
export async function logos(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 25) || 25, 1), 50);
    const q = (args?.category ?? '').trim();
    const url = q ? `${BASE}/category/${encodeURIComponent(q)}` : `${BASE}/`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`SVGL returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d) || !d.length)
        return q ? `No logos in category "${q}".` : 'No logos returned.';
    const rows = d.slice(0, limit).map((x, i) => {
        if (typeof x === 'string')
            return `${i + 1}. ${x}`;
        return `${i + 1}. ${x.title ?? '?'} [${x.category ?? '?'}] ${x.route ?? ''}`.trim();
    });
    return `SVGL logos (${d.length} available, showing ${rows.length}):\n${rows.join('\n')}`;
}
export async function categories(_args) {
    const res = await fetch(`${BASE}/categories`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`SVGL returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d) || !d.length)
        return 'No categories returned.';
    return `SVGL categories (${d.length}):\n${d.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
}
// the library returns category as a string or an array, and route as a single
// SVG url or a { light, dark } pair, so normalise both before printing
const categoryText = (value) => {
    if (Array.isArray(value))
        return value.map(String).join(", ");
    return value == null ? "category not reported" : String(value);
};
const svgText = (value) => {
    if (typeof value === "string")
        return value;
    if (value && typeof value === "object") {
        const row = value;
        const light = String(row.light ?? "").trim();
        const dark = String(row.dark ?? "").trim();
        if (light && dark)
            return `${light} (light) | ${dark} (dark)`;
        return light || dark || "not reported";
    }
    return "not reported";
};
