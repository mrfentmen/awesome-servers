const BASE = 'https://api.certspotter.com/v1/issuances';
export async function issuances(args) {
    const domain = (args.domain ?? '').trim().toLowerCase();
    if (!domain)
        return 'Provide a domain name.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const params = new URLSearchParams({ domain, include_subdomains: 'false', expand: 'dns_names', after: '0' });
    const res = await fetch(`${BASE}?${params.toString()}&count=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-certspotter-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Cert Spotter returned ${res.status}`);
    const rows = (await res.json());
    if (!rows.length)
        return `No certificates found for ${domain}.`;
    return `Certificate issuances for ${domain} (${rows.slice(0, limit).length} shown):\n` +
        rows
            .slice(0, limit)
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            const names = Array.isArray(r.dns_names) ? r.dns_names.slice(0, 4).join(', ') : '';
            return `${i + 1}. ${s('id')} | not before ${String(s('not_before')).slice(0, 10)} | ${names || s('common_name')}`;
        })
            .join('\n');
}
// ---- muxA tools:
const CRTSH = 'https://crt.sh/';
function bound(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
function clean(value) {
    return value != null ? String(value) : '';
}
async function spotter(domain, expand, count, subdomains) {
    const params = new URLSearchParams({
        domain,
        include_subdomains: subdomains ? 'true' : 'false',
        expand,
        after: '0',
    });
    const res = await fetch(`${BASE}?${params.toString()}&count=${count}`, {
        headers: { 'User-Agent': 'mrfentmen-certspotter-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Cert Spotter returned ${res.status}`);
    return (await res.json());
}
export async function transparencyLog(args) {
    const domain = (args.domain ?? '').trim().toLowerCase();
    if (!domain)
        return 'Provide a domain name.';
    const limit = bound(args.limit, 15, 50);
    const res = await fetch(`${CRTSH}?q=${encodeURIComponent(domain)}&output=json&exclude=expired`, {
        headers: { 'User-Agent': 'mrfentmen-certspotter-mcp/1.0', Accept: 'application/json' },
        // crt.sh is a volunteer-run mirror and is routinely slow
        signal: AbortSignal.timeout(60000),
    });
    if (!res.ok)
        throw new Error(`crt.sh returned ${res.status}`);
    const rows = (await res.json());
    if (!rows.length)
        return `crt.sh has no unexpired entries for ${domain}.`;
    const cas = new Map();
    for (const r of rows) {
        const key = clean(r.issuer_name) || 'issuer not reported';
        cas.set(key, (cas.get(key) ?? 0) + 1);
    }
    return [
        `crt.sh logged ${rows.length} unexpired certificate(s) for ${domain}, from ${cas.size} distinct CA(s).`,
        `Top CAs: ${[...cas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k.split(',').pop()?.trim() || k} ${v}`).join(' | ')}`,
        ...rows.slice(0, limit).map((r, i) => {
            const names = clean(r.name_value).split('\n').slice(0, 3).join(', ');
            return `${i + 1}. ${clean(r.common_name) || names || 'name not reported'} | ${clean(r.not_before).slice(0, 10)} to ${clean(r.not_after).slice(0, 10)} | CA id ${r.issuer_ca_id ?? 'not reported'} | serial ${clean(r.serial_number).slice(0, 20) || 'not reported'}${names ? `\n   names: ${names.slice(0, 160)}` : ''}`;
        }),
    ].join('\n');
}
