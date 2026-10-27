const UA = 'mrfentmen-dnstwister-mcp/1.0';
const BASE = 'https://dnstwister.report/api';
function hexEncode(s) {
    let out = '';
    for (const c of s)
        out += c.charCodeAt(0).toString(16).padStart(2, '0');
    return out;
}
export async function fuzz(args) {
    const domain = String(args.domain).trim().toLowerCase();
    if (!domain)
        throw new Error('Provide a domain.');
    const res = await fetch(`${BASE}/fuzz/${hexEncode(domain)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`DNS Twister returned ${res.status}`);
    const d = (await res.json());
    const fuzzies = d.fuzzy_domains ?? [];
    if (!fuzzies.length)
        return `No fuzzy domains for ${domain}.`;
    const flagged = fuzzies.filter((f) => f.has_mx_url || f.resolve_ip_url);
    return `Lookalike domains for ${domain} (${fuzzies.length} total, ${flagged.length} with DNS records):\n` +
        fuzzies.slice(0, 20).map((f) => `* ${f.domain ?? '?'} ${f.has_mx_url || f.resolve_ip_url ? '- has DNS records' : '- no DNS'}`).join('\n');
}
export async function whois(args) {
    const domain = String(args.domain).trim().toLowerCase();
    if (!domain)
        throw new Error('Provide a domain.');
    const res = await fetch(`${BASE}/whois/${hexEncode(domain)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`DNS Twister returned ${res.status}`);
    const d = (await res.json());
    if (d.domain == null)
        throw new Error('No whois returned.');
    return `Whois for ${d.domain ?? domain} (retrieved ${d.retrieved ?? '?'}):\n${(d.response ?? 'No whois data').slice(0, 800)}`;
}
// ---- muxA tools:
// The existing tools list lookalike domains and one whois record. These ask
// two different questions of the same API, whether a name can receive mail and
// what its parking score says, plus a summary of a fuzz result by method.
async function fetchJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`DNS Twister returned ${res.status}`);
    return (await res.json());
}
function checkedDomain(args) {
    const domain = String(args.domain ?? '').trim().toLowerCase();
    if (!domain)
        throw new Error('Provide a domain.');
    return domain;
}
export async function fuzzSummary(args) {
    const domain = checkedDomain(args);
    const d = await fetchJson(`/fuzz/${hexEncode(domain)}`);
    const fuzzies = d.fuzzy_domains ?? [];
    if (!fuzzies.length)
        return `No lookalike domains for ${domain}.`;
    const byMethod = new Map();
    for (const f of fuzzies) {
        const method = f.fuzzer ?? 'unlabelled';
        const bucket = byMethod.get(method);
        if (bucket) {
            if (f.domain)
                bucket.push(f.domain);
        }
        else
            byMethod.set(method, f.domain ? [f.domain] : []);
    }
    const top = Math.max(1, Math.min(Math.trunc(args.top ?? 3), 10));
    const ranked = [...byMethod.entries()].sort((a, b) => b[1].length - a[1].length);
    const lines = [`Lookalike methods for ${domain}: ${fuzzies.length} domains across ${ranked.length} methods`];
    for (const [method, names] of ranked) {
        lines.push(`  ${method}: ${names.length}${names.length ? ` — e.g. ${names.slice(0, top).join(', ')}` : ''}`);
    }
    return lines.join('\n');
}
