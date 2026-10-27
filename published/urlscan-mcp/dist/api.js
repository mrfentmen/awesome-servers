const UA = 'mrfentmen-urlscan-mcp/1.0';
async function searchQuery(query, limit) {
    const res = await fetch(`https://urlscan.io/api/v1/search/?q=${encodeURIComponent(query)}&size=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`urlscan.io returned ${res.status}`);
    const d = (await res.json());
    const list = d.results ?? [];
    if (!list.length)
        return `No urlscan results for "${query}".`;
    return `urlscan.io results for "${query}" (${d.total ?? list.length} total, showing ${Math.min(limit, list.length)}):\n` +
        list.slice(0, limit).map((r, i) => `${i + 1}. ${r.task?.url ?? '?'} | ${r.task?.time ?? '?'} | visibility: ${r.task?.visibility ?? '?'}`).join('\n');
}
export async function resultLookup(args) {
    const uuid = (args.uuid ?? '').trim();
    if (!uuid)
        return 'Provide a scan UUID.';
    const headers = { 'User-Agent': UA, Accept: 'application/json' };
    if (process.env.URLSCAN_API_KEY?.trim())
        headers['API-Key'] = process.env.URLSCAN_API_KEY.trim();
    const res = await fetch(`https://urlscan.io/api/v1/result/${encodeURIComponent(uuid)}/`, {
        headers,
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        return 'Scan not found (bad UUID or not finished).';
    if (res.status === 403)
        return 'Scan is private; set URLSCAN_API_KEY to view it.';
    if (!res.ok)
        throw new Error(`urlscan.io returned ${res.status}`);
    const d = (await res.json());
    const v = d.verdicts?.overall;
    return [
        `URL: ${d.task?.url ?? '?'}`,
        `Scanned: ${d.task?.time ?? '?'}`,
        `IP: ${d.page?.ip ?? '?'} (${d.page?.country ?? '?'}) | Server: ${d.page?.server ?? '?'}`,
        v ? `Verdict: score ${v.score ?? '?'}${v.malicious ? ' MALICIOUS' : ' clean'}` : '',
        d.lists?.ips?.length ? `Contacted IPs: ${d.lists.ips.slice(0, 5).join(', ')}` : '',
    ].filter(Boolean).join('\n');
}
export async function domainSearch(args) {
    const value = (args.value ?? '').trim();
    if (!value)
        return 'Provide a domain like example.com.';
    const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
    return searchQuery(`domain:${value}`, limit);
}
export async function ipSearch(args) {
    const value = (args.value ?? '').trim();
    if (!value)
        return 'Provide an IP address.';
    const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
    return searchQuery(`ip:${value}`, limit);
}
export async function asnSearch(args) {
    const value = (args.value ?? '').trim();
    if (!value)
        return 'Provide an ASN like AS15169.';
    const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
    return searchQuery(`asn:${value}`, limit);
}
export async function hashSearch(args) {
    const value = (args.value ?? '').trim();
    if (!value)
        return 'Provide a SHA256 hash.';
    const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
    return searchQuery(`hash:${value}`, limit);
}
export async function search(args) {
    const query = (args.query ?? '').trim();
    if (!query)
        return 'Provide search terms like domain:github.com.';
    const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
    const res = await fetch(`https://urlscan.io/api/v1/search/?q=${encodeURIComponent(query)}&size=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`urlscan.io returned ${res.status}`);
    const d = (await res.json());
    const list = d.results ?? [];
    if (!list.length)
        return `No urlscan results for "${query}".`;
    return `urlscan.io results for "${query}" (${d.total ?? list.length} total, showing ${Math.min(limit, list.length)}):\n` +
        list.slice(0, limit).map((r, i) => `${i + 1}. ${r.task?.url ?? '?'} | ${r.task?.time ?? '?'} | visibility: ${r.task?.visibility ?? '?'}`).join('\n');
}
