const BASE = 'https://bundlephobia.com/api/size';
export async function size(args) {
    const name = (args.name ?? '').trim();
    if (!name)
        return 'Provide a package name.';
    const res = await fetch(`${BASE}?package=${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': 'mrfentmen-bundlephobia-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Bundlephobia returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    const fmt = (n) => {
        const v = Number(n);
        if (!v)
            return 'n/a';
        if (v >= 1024 * 1024)
            return `${(v / 1024 / 1024).toFixed(2)} MB`;
        return `${(v / 1024).toFixed(1)} KB`;
    };
    const assets = (d.assets ?? []);
    const jsAssets = assets.filter((a) => String(a.type ?? '') === 'js');
    const main = jsAssets[0] ?? assets[0] ?? {};
    return [
        `${s('name')}@${s('version')}`,
        `Minified: ${fmt(main.size ?? d.size)} | Gzip: ${fmt(main.gzip ?? d.gzip)}`,
        `Dependencies: ${s('dependencyCount')} | Has side effects: ${s('hasJSModule') ? 'module' : s('hasJSNext') ? 'next' : 'no'}`,
    ].filter(Boolean).join('\n');
}
// ---- muxA tools:
function fmtBytes(n) {
    const v = Number(n);
    if (!Number.isFinite(v) || v <= 0)
        return 'n/a';
    if (v >= 1024 * 1024)
        return `${(v / 1024 / 1024).toFixed(2)} MB`;
    if (v >= 1024)
        return `${(v / 1024).toFixed(1)} KB`;
    return `${v} B`;
}
function clean(value) {
    return value != null ? String(value) : '';
}
async function sizeOf(name) {
    const res = await fetch(`${BASE}?package=${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': 'mrfentmen-bundlephobia-mcp/1.0', Accept: 'application/json' },
        // bundlephobia builds each package on demand and is slow on a cold package
        signal: AbortSignal.timeout(45000),
    });
    if (res.status === 404)
        throw new Error(`Bundlephobia has no package named ${name}`);
    if (!res.ok)
        throw new Error(`Bundlephobia returned ${res.status} for ${name}`);
    return (await res.json());
}
