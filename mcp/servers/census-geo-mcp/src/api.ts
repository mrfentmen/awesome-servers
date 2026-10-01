const UA = 'mrfentmen-census-geo-mcp/1.0';
const BASE = 'https://geocoding.geo.census.gov/geocoder/locations';

export interface AddressArgs {
  address: string;
}
export interface CoordArgs {
  x: number;
  y: number;
}

export async function geocode(args: AddressArgs): Promise<string> {
  const addr = String(args.address).trim();
  if (!addr) throw new Error('Provide a street address.');
  const res = await fetch(`${BASE}/onelineaddress?address=${encodeURIComponent(addr)}&benchmark=Public_AR_Current&format=json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Census geocoder returned ${res.status}`);
  const d = (await res.json()) as { result?: { addressMatches?: Array<{ matchedAddress?: string; coordinates?: { x?: number; y?: number }; tigerLine?: { tigerLineId?: string; side?: string }; geographies?: { 'Census Blocks'?: Array<{ GEOID?: string; STATE?: string; COUNTY?: string; TRACT?: string; BLOCK?: string }> } }> } };
  const matches = d.result?.addressMatches ?? [];
  if (!matches.length) return `No address match for "${args.address}".`;
  const m = matches[0];
  const block = m.geographies?.['Census Blocks']?.[0];
  return `Address match for "${args.address}":\nMatched: ${m.matchedAddress ?? '?'}\nCoordinates: ${m.coordinates?.y ?? '?'}, ${m.coordinates?.x ?? '?'}\nFIPS block: ${block?.GEOID ?? '?'} (state ${block?.STATE ?? '?'}, county ${block?.COUNTY ?? '?'}, tract ${block?.TRACT ?? '?'}, block ${block?.BLOCK ?? '?'})`;
}

export async function coordinates(args: CoordArgs): Promise<string> {
  const x = Number(args.x), y = Number(args.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Provide valid x (lon) and y (lat).');
  const res = await fetch(`${BASE}/coordinates?x=${x}&y=${y}&benchmark=Public_AR_Current&format=json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Census geocoder returned ${res.status}`);
  const d = (await res.json()) as { result?: { geographies?: { 'Census Blocks'?: Array<{ GEOID?: string; STATE?: string; COUNTY?: string; TRACT?: string; BLOCK?: string }> } } };
  const block = d.result?.geographies?.['Census Blocks']?.[0];
  if (!block?.GEOID) throw new Error(`No census geography for ${x},${y}.`);
  return `Census geography for ${x},${y}:\nFIPS block: ${block.GEOID}\nState: ${block.STATE ?? '?'} | County: ${block.COUNTY ?? '?'} | Tract: ${block.TRACT ?? '?'} | Block: ${block.BLOCK ?? '?'}`;
}

// ---- pay1 tools:

const GEO_BASE = 'https://geocoding.geo.census.gov/geocoder/geographies';

interface GeoRow {
  GEOID?: string
  BASENAME?: string
  NAME?: string
  STATE?: string
  COUNTY?: string
  TRACT?: string
}

interface GeoMatch {
  matchedAddress?: string
  coordinates?: { x?: number; y?: number }
  geographies?: Record<string, GeoRow[]>
}

// Most useful layers first, so a capped list never hides the state or county.
const LAYER_ORDER = ['States', 'Counties', 'Census Tracts', 'Incorporated Places', 'County Subdivisions', 'Urban Areas', 'Combined Statistical Areas', '2020 Census Blocks'];

function layerRank(name: string): number {
  const index = LAYER_ORDER.findIndex((known) => name.startsWith(known));
  return index === -1 ? LAYER_ORDER.length : index;
}

/** Every layer the geocoder knows for a point, capped so the output stays readable. */
function formatLayers(layers: Record<string, GeoRow[]>, maxLayers = 12, maxRows = 3): string[] {
  const names = Object.keys(layers).sort((a, b) => layerRank(a) - layerRank(b) || a.localeCompare(b))
  const lines: string[] = []
  for (const name of names.slice(0, maxLayers)) {
    const rows = (layers[name] ?? []).slice(0, maxRows)
    if (!rows.length) continue
    const described = rows.map((r) => {
      const label = r.BASENAME ?? r.NAME ?? 'not reported'
      const id = r.GEOID ? ` (GEOID ${r.GEOID})` : ''
      const state = r.STATE ? ` state ${r.STATE}` : ''
      return `${label}${id}${state}`
    })
    lines.push(`  ${name}: ${described.join(' | ')}`)
  }
  if (names.length > maxLayers) lines.push(`  ...and ${names.length - maxLayers} more layer(s)`)
  return lines
}

export interface AddressGeoArgs {
  address: string;
}

export interface CoordGeoArgs {
  x: number;
  y: number;
}

export async function coordinateGeographies(args: CoordGeoArgs): Promise<string> {
  const x = Number(args.x), y = Number(args.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Provide valid x (lon) and y (lat).');
  const url = `${GEO_BASE}/coordinates?x=${x}&y=${y}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Census geocoder returned ${res.status}`);
  const d = (await res.json()) as { result?: { geographies?: Record<string, GeoRow[]> } };
  const layers = d.result?.geographies ?? {};
  const lines = formatLayers(layers);
  if (!lines.length) throw new Error(`No census geographies for ${x},${y}.`);
  return [`Census geographies for ${x},${y}`, ...lines].join('\n');
}
