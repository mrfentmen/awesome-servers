const UA = 'mrfentmen-vatcomply-mcp/1.0';

export async function rates(_args?: unknown): Promise<string> {
  const res = await fetch('https://api.vatcomply.com/rates', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`VATComply returned ${res.status}`);
  const d = (await res.json()) as { date?: string; base?: string; rates?: Record<string, number> };
  const r = d.rates ?? {};
  const rows = Object.entries(r).map(([k, v]) => `${k}: ${v}`).join('\n');
  return `VATComply FX rates (base ${d.base ?? 'EUR'}, ${d.date ?? '?'}):\n${rows}`;
}

export interface CountryArgs {
  code: string;
}

export async function country(args: CountryArgs): Promise<string> {
  const code = (args.code ?? '').trim().toUpperCase();
  if (!code) return 'Provide an ISO country code like DE.';
  const res = await fetch(`https://api.vatcomply.com/rates?base=${encodeURIComponent(code)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`VATComply returned ${res.status}`);
  const d = (await res.json()) as { date?: string; base?: string; rates?: Record<string, number> };
  return `VATComply rates for ${code} (${d.date ?? '?'}):\n` +
    Object.entries(d.rates ?? {}).map(([k, v]) => `${k}: ${v}`).join('\n');
}

// ---- muxB tools:
const VIES = 'https://ec.europa.eu/taxation_customs/vies/rest-api/ms';

const EU_MEMBERS: Record<string, string> = {
  AT: 'Austria',
  BE: 'Belgium',
  BG: 'Bulgaria',
  CY: 'Cyprus',
  CZ: 'Czechia',
  DE: 'Germany',
  DK: 'Denmark',
  EE: 'Estonia',
  EL: 'Greece',
  ES: 'Spain',
  FI: 'Finland',
  FR: 'France',
  HR: 'Croatia',
  HU: 'Hungary',
  IE: 'Ireland',
  IT: 'Italy',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  LV: 'Latvia',
  MT: 'Malta',
  NL: 'Netherlands',
  PL: 'Poland',
  PT: 'Portugal',
  RO: 'Romania',
  SE: 'Sweden',
  SI: 'Slovenia',
  SK: 'Slovakia',
};

export interface VatArgs {
  country: string;
  number: string;
}

