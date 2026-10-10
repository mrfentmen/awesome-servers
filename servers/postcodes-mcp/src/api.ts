const BASE = 'https://api.postcodes.io';
const UA = 'mrfentmen-postcodes-mcp/1.0';

export interface LookupArgs {
  postcode: string;
}

export async function lookup(args: LookupArgs): Promise<string> {
  const postcode = (args.postcode ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!postcode) return 'Provide a UK postcode.';
  const res = await fetch(`${BASE}/postcodes/${encodeURIComponent(postcode)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`postcodes.io returned ${res.status}`);
  const d = (await res.json()) as { result?: { postcode?: string; quality?: number; eastings?: number; northings?: number; country?: string; region?: string; admin_district?: string; admin_ward?: string; latitude?: number; longitude?: number; codes?: { admin_district?: string } } };
  const r = d.result ?? {};
  return [
    `Postcode: ${r.postcode ?? postcode} (quality ${r.quality ?? '?'})`,
    `Country: ${r.country ?? '?'} | Region: ${r.region ?? '?'}`,
    `District: ${r.admin_district ?? '?'} | Ward: ${r.admin_ward ?? '?'}`,
    `Coordinates: ${r.latitude ?? '?'}, ${r.longitude ?? '?'}`,
    r.eastings != null ? `Grid ref: ${r.eastings}, ${r.northings}` : null,
  ].filter(Boolean).join('\n');
}

export async function random(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/random/postcodes`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`postcodes.io returned ${res.status}`);
  const d = (await res.json()) as { result?: Array<{ postcode?: string; country?: string; region?: string }> };
  const results = d.result ?? [];
  if (!results.length) return 'No postcode returned.';
  const r = results[0];
  return `Random postcode: ${r.postcode ?? '?'} [${r.country ?? '?'}, ${r.region ?? '?'}]`;
}

// ---- muxF tools:

interface PcResult {
  postcode?: string
  quality?: number
  country?: string
  region?: string
  nhs_ha?: string | null
  nhs_region?: string | null
  icb?: string | null
  ccg?: string | null
  european_electoral_region?: string | null
  parliamentary_constituency?: string | null
  parliamentary_constituency_2024?: string | null
  pfa?: string | null
  lsoa?: string | null
  msoa?: string | null
  nuts?: string | null
  parish?: string | null
  admin_district?: string
  admin_county?: string | null
  admin_ward?: string | null
  bua?: string | null
  ced?: string | null
  cancer_alliance?: string | null
  national_park?: string | null
  primary_care_trust?: string | null
  ttwa?: string | null
  date_of_introduction?: string | null
  date_of_termination?: string | null
  latitude?: number
  longitude?: number
  codes?: Record<string, string | null>
}

