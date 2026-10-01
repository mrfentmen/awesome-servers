const UA = 'mrfentmen-ipinfo-mcp/1.0';

export interface IpArg {
  ip?: string;
}

export async function lookup(args: IpArg): Promise<string> {
  const ip = args?.ip ? `/${encodeURIComponent(args.ip)}` : '';
  const res = await fetch(`https://ipinfo.io${ip}/json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`IPinfo returned ${res.status}`);
  const d = (await res.json()) as {
    ip?: string; city?: string; region?: string; country?: string; loc?: string; org?: string; postal?: string; timezone?: string; asn?: { asn?: string; name?: string }; company?: { name?: string }; carrier?: { name?: string };
  };
  if (!d.ip) throw new Error('No IP returned.');
  const loc = d.loc ? d.loc.split(',') : [];
  return `IP ${d.ip}\nLocation: ${[d.city, d.region, d.country].filter(Boolean).join(', ') || '?'}\nCoordinates: ${loc.length === 2 ? `${loc[0]}, ${loc[1]}` : '?'}\nPostal: ${d.postal ?? '?'} | Timezone: ${d.timezone ?? '?'}\nOrg: ${d.org ?? d.asn?.name ?? '?'}\nCarrier: ${d.carrier?.name ?? 'none'}`;
}

// ---- muxB tools:

export interface NetworkProfileArgs {
  ip?: string;
}

