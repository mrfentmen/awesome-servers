const BASE = 'https://cavalier.hudsonrock.com/api/json/v2/osint-tools/search-by-email';
export async function email(args) {
    const email = (args.email ?? '').trim().toLowerCase();
    if (!email || !email.includes('@'))
        return 'Provide a valid email address.';
    const res = await fetch(`${BASE}?email=${encodeURIComponent(email)}`, {
        headers: { 'User-Agent': 'mrfentmen-hudsonrock-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Hudson Rock returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    const stole = (d.stolen_data ?? []);
    if (!stole.length)
        return `No infostealer breach records for ${email}.`;
    const rows = stole.slice(0, 5).map((r, i) => {
        const f = (k) => (r[k] != null ? String(r[k]) : '');
        const creds = (r.credentials ?? []);
        const credStr = creds.slice(0, 2).map((c) => `${String(c.name ?? '')}:${String(c.login ?? '')}`).join(' | ');
        return `${i + 1}. ${f('stealer_name')} | infected at ${f('computer_name')} on ${f('date_compromised')}${credStr ? ` | ${credStr}` : ''}`;
    });
    return [
        `Infostealer breaches for ${email}: ${stole.length} found`,
        ...rows,
    ].join('\n');
}
// ---- muxB tools:
const TOOLS_ROOT = 'https://cavalier.hudsonrock.com/api/json/v2/osint-tools';
async function osint(path, query) {
    const res = await fetch(`${TOOLS_ROOT}/${path}?${query}`, {
        headers: { 'User-Agent': 'mrfentmen-hudsonrock-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Hudson Rock returned ${res.status}`);
    return (await res.json());
}
export async function ipBreaches(args) {
    const ip = (args.ip ?? '').trim();
    if (!ip)
        return 'Provide an IP address.';
    const limit = Math.max(1, Math.min(Number(args.limit ?? 5) || 5, 20));
    const d = await osint('search-by-ip', `ip=${encodeURIComponent(ip)}`);
    const rows = (Array.isArray(d.stealers) ? d.stealers : []).slice(0, limit);
    if (!rows.length)
        return `Hudson Rock reports no infostealer breach records for IP ${ip}.`;
    return `Hudson Rock infostealer breaches for IP ${ip} (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const av = (Array.isArray(r.antiviruses) ? r.antiviruses : []).slice(0, 2).join(', ');
            return `${i + 1}. ${String(r.stealer_name ?? 'not reported')} on ${String(r.computer_name ?? 'not reported')} at ${String(r.date_compromised ?? 'not reported').slice(0, 10)} | ${String(r.operating_system ?? 'OS not reported')}${av ? ` | AV ${av}` : ''} | corporate services ${String(r.total_corporate_services ?? 0)}, user services ${String(r.total_user_services ?? 0)}`;
        })
            .join('\n');
}
