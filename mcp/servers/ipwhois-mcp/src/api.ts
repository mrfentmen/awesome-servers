const BASE = 'https://ipwho.is';

export interface LookupArgs {
  ip?: string;
}

export async function lookup(args: LookupArgs = {}): Promise<string> {
  const ip = (args.ip ?? '').trim();
  const url = ip ? `${BASE}/${encodeURIComponent(ip)}` : `${BASE}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-ipwhois-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`IPWhois returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  if (!d.success) return `Lookup failed: ${d.message ?? 'unknown reason'}`;
  const connection = d.connection as Record<string, unknown> | undefined;
  const flag = d.flag as Record<string, unknown> | undefined;
  return [
    `IP: ${d.ip}`,
    `Type: ${d.type ?? 'n/a'}`,
    `Country: ${d.country ?? 'n/a'}${flag?.emoji ? ` ${flag.emoji}` : ''}`,
    `Region: ${d.region ?? 'n/a'}`,
    `City: ${d.city ?? 'n/a'}`,
    `Latitude: ${d.latitude ?? 'n/a'}`,
    `Longitude: ${d.longitude ?? 'n/a'}`,
    `ISP: ${connection?.isp ?? 'n/a'}`,
    `Organization: ${connection?.org ?? 'n/a'}`,
    `Timezone: ${(d.timezone as Record<string, unknown> | undefined)?.id ?? 'n/a'}`,
  ].join('\n');
}

// ---- muxB tools:

export interface RdapArgs {
  ip?: string;
}

interface RdapEntity {
  handle?: string;
  roles?: string[];
  vcardArray?: unknown[] | string;
  name?: string;
  fn?: string;
  org?: string;
}

