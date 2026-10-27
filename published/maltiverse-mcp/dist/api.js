const BASE = 'https://api.maltiverse.com/ip';
export async function ip(args) {
    const address = (args.address ?? '').trim();
    if (!address)
        return 'Provide an IP address.';
    const res = await fetch(`${BASE}/${encodeURIComponent(address)}`, {
        headers: { 'User-Agent': 'mrfentmen-maltiverse-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Maltiverse returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    const blacklist = (d.blacklist ?? []);
    const bl = blacklist.slice(0, 5).map((b) => `${String(b.description ?? b.source ?? '')} (${String(b.last_seen ?? '').slice(0, 10)})`).join(' | ');
    return [
        `IP ${s('ip_addr')}`,
        s('as_number') ? `ASN: ${s('as_number')}` : '',
        s('country_code') ? `Country: ${s('country_code')}` : '',
        s('city') ? `City: ${s('city')}` : '',
        s('hostname') ? `Hostname: ${s('hostname')}` : '',
        s('number_of_blacklisted_domains') ? `Blacklisted domains: ${s('number_of_blacklisted_domains')}` : '',
        s('number_of_blacklisted_urls') ? `Blacklisted URLs: ${s('number_of_blacklisted_urls')}` : '',
        bl ? `Recent blacklists: ${bl}` : 'No blacklist records.',
    ].filter(Boolean).join('\n');
}
// ---- muxB tools:
const RDAP_BOOTSTRAP = 'https://rdap.org';
const CRT_SH = 'https://crt.sh';
function vcardField(card, key) {
    if (!Array.isArray(card))
        return '';
    for (const row of card) {
        if (Array.isArray(row) && row[0] === key)
            return String(row[3] ?? '');
    }
    return '';
}
