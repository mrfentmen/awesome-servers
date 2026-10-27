const UA = 'mrfentmen-ipinfo-mcp/1.0';
export async function lookup(args) {
    const ip = args?.ip ? `/${encodeURIComponent(args.ip)}` : '';
    const res = await fetch(`https://ipinfo.io${ip}/json`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`IPinfo returned ${res.status}`);
    const d = (await res.json());
    if (!d.ip)
        throw new Error('No IP returned.');
    const loc = d.loc ? d.loc.split(',') : [];
    return `IP ${d.ip}\nLocation: ${[d.city, d.region, d.country].filter(Boolean).join(', ') || '?'}\nCoordinates: ${loc.length === 2 ? `${loc[0]}, ${loc[1]}` : '?'}\nPostal: ${d.postal ?? '?'} | Timezone: ${d.timezone ?? '?'}\nOrg: ${d.org ?? d.asn?.name ?? '?'}\nCarrier: ${d.carrier?.name ?? 'none'}`;
}
