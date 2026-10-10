const BASE = 'https://photon.komoot.io/api';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide a place name.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}/?q=${encodeURIComponent(query)}&limit=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-photon-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Photon returned ${res.status}`);
  const d = (await res.json()) as { features?: Array<Record<string, unknown>> };
  const feats = d.features ?? [];
  if (!feats.length) return `No results for "${query}".`;
  return `Places for "${query}" (${feats.length} shown):\n` +
    feats.map((f, i) => {
      const p = (f.properties ?? {}) as Record<string, unknown>;
      const g = (f.geometry ?? {}) as Record<string, unknown>;
      const coords = (g.coordinates ?? []) as Array<number>;
      const s = (k: string) => (p[k] != null ? String(p[k]) : '');
      const label = [s('name'), s('city'), s('state'), s('country')].filter(Boolean).join(', ');
      const c = coords.length >= 2 ? ` [${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}]` : '';
      return `${i + 1}. ${label || s('osm_value')}${c}`;
    }).join('\n');
}

// ---- muxB tools:

const PHOTON_ROOT = 'https://photon.komoot.io';

async function photonFeatures(path: string, params: Record<string, string>): Promise<Array<Record<string, unknown>>> {
  const url = new URL(`${PHOTON_ROOT}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-photon-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const detail = (await res.text()).replace(/\s+/g, ' ').slice(0, 200);
    throw new Error(`Photon returned ${res.status}: ${detail}`);
  }
  const d = (await res.json()) as { features?: Array<Record<string, unknown>> };
  return d.features ?? [];
}

const pStr = (p: Record<string, unknown>, k: string): string => (p[k] != null ? String(p[k]) : '');

const pCoords = (f: Record<string, unknown>): string => {
  const g = (f.geometry ?? {}) as Record<string, unknown>;
  const c = (g.coordinates ?? []) as Array<number>;
  return c.length >= 2 ? `${c[1].toFixed(5)}, ${c[0].toFixed(5)}` : 'coordinates not reported';
};

export interface ReverseGeocodeArgs {
  lat: number
  lon: number
  limit?: number
}

export interface SearchByTagArgs {
  query: string
  tag: string
  countryCode?: string
  limit?: number
}

export interface GeocodeInBoxArgs {
  query: string
  south: number
  west: number
  north: number
  east: number
  limit?: number
}

export async function geocodeInBox(args: GeocodeInBoxArgs): Promise<string> {
  const query = (args.query ?? '').trim()
  if (!query) return 'Provide a place name.'
  const { south, west, north, east } = args
  for (const [name, value] of [['south', south], ['north', north]] as const) {
    if (!Number.isFinite(value) || value < -90 || value > 90) throw new Error(`${name} must be between -90 and 90`)
  }
  for (const [name, value] of [['west', west], ['east', east]] as const) {
    if (!Number.isFinite(value) || value < -180 || value > 180) throw new Error(`${name} must be between -180 and 180`)
  }
  if (north <= south) throw new Error('north must be greater than south')
  if (east <= west) throw new Error('east must be greater than west')
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25))
  const feats = await photonFeatures('/api/', {
    q: query,
    bbox: [west, south, east, north].join(','),
    limit: String(limit),
  })
  if (!feats.length) return `No places matching "${query}" inside that bounding box.`
  return `Places matching "${query}" between ${west},${south} and ${east},${north} (${feats.length} shown):\n` +
    feats.slice(0, limit).map((f, i) => {
      const p = (f.properties ?? {}) as Record<string, unknown>
      const label = [pStr(p, 'name'), pStr(p, 'city'), pStr(p, 'state'), pStr(p, 'country')].filter(Boolean).join(', ')
      return `${i + 1}. ${label || 'unnamed place'} [${pCoords(f)}]`
    }).join('\n')
}
