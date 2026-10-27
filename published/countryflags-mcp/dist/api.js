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

const FLAG_SIZES = ['w20', 'w40', 'w80', 'w160', 'w320', 'w640', 'w1280', 'w2560',
    '20x15', '24x18', '32x24', '40x30', '48x36', '64x48', '80x60', '96x72', '128x96', '160x120', '240x180', '256x192'];
export async function flagUrls(args = {}) {
    const code = String(args?.code ?? '').trim().toLowerCase();
    if (!/^[a-z]{2}(-[a-z]{2,3})?$/.test(code))
        throw new Error(`"${args?.code}" is not a flag code like us or gb-eng.`);
    const codesRes = await fetch('https://flagcdn.com/en/codes.json', {
        headers: { 'User-Agent': 'mrfentmen-countryflags-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!codesRes.ok)
        throw new Error(`flagcdn codes list returned ${codesRes.status}`);
    const codes = (await codesRes.json());
    const name = codes[code];
    if (!name)
        throw new Error(`flagcdn has no flag for "${code}".`);
    const wanted = args?.sizes
        ? String(args.sizes).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
        : FLAG_SIZES;
    const unknown = wanted.filter((s) => !FLAG_SIZES.includes(s));
    if (unknown.length)
        throw new Error(`Unknown sizes: ${unknown.join(', ')}. Known: ${FLAG_SIZES.join(', ')}.`);
    const checked = await Promise.all(wanted.map(async (size) => {
        try {
            const r = await fetch(`https://flagcdn.com/${size}/${code}.png`, {
                method: 'HEAD',
                headers: { 'User-Agent': 'mrfentmen-countryflags-mcp/1.0' },
                signal: AbortSignal.timeout(15000),
            });
            return r.ok ? size : null;
        }
        catch {
            return null;
        }
    }));
    const live = checked.filter(Boolean);
    if (!live.length)
        throw new Error(`flagcdn has no image for ${code} at the requested sizes.`);
    return [
        `${name} (${code}) — ${live.length} working size(s):`,
        ...live.map((s) => `- ${s}: https://flagcdn.com/${s}/${code}.png`),
    ].join('\n');
}
