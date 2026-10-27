const BASE = 'https://flagcdn.com';
export async function list(args = {}) {
    const res = await fetch(`${BASE}/en/codes.json`, {
        headers: { 'User-Agent': 'mrfentmen-countryflags-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Flagcdn returned ${res.status}`);
    const codes = (await res.json());
    const entries = Object.entries(codes);
    const q = (args.search ?? '').trim().toLowerCase();
    const limit = Math.max(1, Math.min(args.limit ?? 20, 100));
    const filtered = q ? entries.filter(([code, name]) => `${code} ${name}`.toLowerCase().includes(q)) : entries;
    const shown = filtered.slice(0, limit);
    if (!shown.length)
        return `No countries match "${q}".`;
    return `Country flags (${shown.length} shown):\n` +
        shown.map(([code, name], i) => `${i + 1}. ${name} (${code}) | ${BASE}/${code}.png`).join('\n');
}
export async function flag(args) {
    const code = (args.code ?? '').trim().toLowerCase();
    if (!code)
        return 'Provide a country code like us.';
    return `${code.toUpperCase()}: ${BASE}/${code}.png (w160: ${BASE}/w160/${code}.png, w320: ${BASE}/w320/${code}.png)`;
}
// ---- muxA tools:
// The existing tools search the code list and print a bare flag url. The bare
// form has no size and answers 404, so these return only the sized urls that
// really exist and resolve a country or region name to its code.
/** Sizes confirmed to answer 200 for a country code. Anything else 404s. */
const SIZES = [
    'w20', 'w40', 'w80', 'w160', 'w320', 'w640', 'w1280', 'w2560',
    'h20', 'h24', 'h40', 'h60', 'h80', 'h120',
    '24x18', '32x24', '48x36', '64x48', '96x72', '128x96', '256x192',
];
async function codes() {
    const res = await fetch(`${BASE}/en/codes.json`, {
        headers: { 'User-Agent': 'mrfentmen-countryflags-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Flagcdn returned ${res.status}`);
    const d = (await res.json());
    return d && typeof d === 'object' ? d : {};
}
function sizeList(requested) {
    if (!requested)
        return SIZES;
    const wanted = requested.split(/[,\s]+/).filter(Boolean).map((s) => s.toLowerCase());
    const bad = wanted.filter((s) => !SIZES.includes(s));
    if (bad.length)
        throw new Error(`These sizes do not exist: ${bad.join(', ')}. Available: ${SIZES.join(', ')}.`);
    return wanted;
}
export async function resolveName(args) {
    const query = (args.name ?? '').trim().toLowerCase();
    if (!query)
        throw new Error('Provide a country or region name, or part of one.');
    const names = await codes();
    const hits = Object.entries(names).filter(([code, name]) => name.toLowerCase().includes(query) || code === query);
    if (!hits.length)
        return `No flag matches "${args.name}".`;
    const wanted = sizeList(args.sizes);
    const shown = hits.slice(0, 10);
    const lines = [`Flags matching "${args.name}": ${hits.length}${hits.length > shown.length ? `, showing ${shown.length}` : ''}`];
    for (const [code, name] of shown) {
        lines.push(`  ${name} (${code})`);
        for (const size of wanted.slice(0, 3))
            lines.push(`     ${BASE}/${size}/${code}.png`);
    }
    return lines.join('\n');
}
