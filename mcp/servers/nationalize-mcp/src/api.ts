const BASE = 'https://api.nationalize.io';

export interface NationalityArgs {
  name: string;
}

export async function nationality(args: NationalityArgs): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) return 'Provide a first name.';
  const res = await fetch(`${BASE}?name=${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': 'mrfentmen-nationalize-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Nationalize returned ${res.status}`);
  const data = (await res.json()) as {
    name?: string;
    country?: Array<{ country_id?: string; probability?: number }>;
  };
  const countries = (data.country ?? []).slice(0, 5);
  if (!countries.length) return `No nationality estimate available for "${name}".`;
  return `${name}: possible nationalities\n` +
    countries.map((c, i) => `${i + 1}. ${c.country_id ?? ''} (${Math.round((c.probability ?? 0) * 100)}%)`).join('\n');
}

// ---- muxB tools:

const WB = 'https://api.worldbank.org/v2'

interface WbCountry {
  id?: string
  iso2Code?: string
  name?: string
  region?: { value?: string }
  incomeLevel?: { value?: string }
  lendingType?: { value?: string }
  capitalCity?: string
  longitude?: string
  latitude?: string
}

async function wbCountries(): Promise<WbCountry[]> {
  const res = await fetch(`${WB}/country?format=json&per_page=300`, {
    headers: { 'User-Agent': 'mrfentmen-nationalize-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`World Bank returned ${res.status} for the country list`)
  const d = (await res.json()) as [unknown, WbCountry[]]
  return Array.isArray(d?.[1]) ? d[1] : []
}

const wbField = (v: unknown): string => (v != null && String(v).trim() ? String(v).trim() : 'not reported')

export interface NationalityCountriesArgs {
  name?: string
  limit?: number
}

export interface CountryIndicatorsArgs {
  code?: string
}

