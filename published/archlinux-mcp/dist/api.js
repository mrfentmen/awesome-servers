const UA = 'mrfentmen-archlinux-mcp/1.0';
const BASE = 'https://archlinux.org/packages/search/json';
export async function search(args) {
    const q = String(args.query).trim();
    if (!q)
        throw new Error('Provide a package query.');
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
    const res = await fetch(`${BASE}/?q=${encodeURIComponent(q)}&limit=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Arch Linux returned ${res.status}`);
    const d = (await res.json());
    const results = d.results ?? [];
    if (!results.length)
        return `No Arch packages matching "${args.query}".`;
    return `Arch Linux packages matching "${args.query}" (${results.length}):\n` + results.slice(0, limit).map((p, i) => `${i + 1}. ${p.pkgname ?? '?'} ${p.pkgver ?? '?'} [${p.repo ?? '?'}/${p.arch ?? '?'}] votes ${p.num_votes ?? 0}\n   ${(p.pkgdesc ?? '').slice(0, 100)}`).join('\n');
}
// ---- muxA tools:
const ARCH = 'https://archlinux.org';
function bound(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
async function archSearch(params, limit) {
    const query = new URLSearchParams({ ...params, limit: String(limit) });
    const res = await fetch(`${BASE}/?${query.toString()}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new Error(`Arch Linux returned ${res.status}`);
    const d = (await res.json());
    return d.results ?? [];
}
function mb(bytes) {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0)
        return 'not reported';
    return n >= 1024 * 1024 * 1024 ? `${(n / 1024 / 1024 / 1024).toFixed(2)} GB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
}
function list(value, cap = 12) {
    const arr = Array.isArray(value) ? value.map(String) : [];
    if (!arr.length)
        return 'none';
    return arr.slice(0, cap).join(', ') + (arr.length > cap ? `, plus ${arr.length - cap} more` : '');
}
function clean(value) {
    const s = value != null ? String(value) : '';
    return s ? s.slice(0, 10) : 'not reported';
}
export async function mirrorStatus(args) {
    const country = (args.country ?? '').trim().toLowerCase();
    const limit = bound(args.limit, 15, 100);
    const res = await fetch(`${ARCH}/mirrors/status/json/`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new Error(`Arch Linux returned ${res.status}`);
    const d = (await res.json());
    let rows = d.urls ?? [];
    if (!rows.length)
        throw new Error('Arch Linux returned no mirror list.');
    if (args.active_only !== false)
        rows = rows.filter((r) => r.active !== false);
    if (country)
        rows = rows.filter((r) => String(r.country ?? '').toLowerCase().includes(country));
    if (!rows.length) {
        return country
            ? `No active Arch mirror matches "${args.country}".`
            : 'Arch Linux lists no active mirrors.';
    }
    const ranked = rows.slice().sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0)).slice(0, limit);
    const countries = new Set(rows.map((r) => r.country).filter(Boolean));
    return [
        `Arch mirrors: ${rows.length} active across ${countries.size} countries, best ${ranked.length} by score.`,
        `Last status check ${clean(d.last_check)} | every ${Math.round((Number(d.check_frequency) || 0) / 60)} minutes | ${d.num_checks ?? '?'} checks`,
        ...ranked.map((r, i) => {
            const sync = r.last_sync ? String(r.last_sync).slice(11, 19) : 'not reported';
            return `${i + 1}. ${r.url ?? '?'}${r.protocol ? ` (${r.protocol})` : ''} | ${r.country ?? 'country not reported'}` +
                `${r.country_code ? ` ${r.country_code}` : ''} | score ${Number(r.score ?? 0).toFixed(3)} | delay ${r.delay ?? '?'} ms` +
                ` | completion ${Math.round((Number(r.completion_pct) || 0) * 100)}% | last sync ${sync} UTC` +
                `${r.ipv6 ? ' | ipv6' : ''}${r.isos ? ' | isos' : ''}`;
        }),
        'Score is Arch own mirror quality metric, higher is better. Delay is the probe response time in milliseconds.',
    ].join('\n');
}
