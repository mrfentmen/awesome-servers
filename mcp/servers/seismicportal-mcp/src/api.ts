const BASE = 'https://www.seismicportal.eu/fdsnws/event/1/query';

export interface ListArgs {
  limit?: number;
}

async function query(minMag: number, args: ListArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}?limit=${limit}&format=json&minmag=${minMag}`, {
    headers: { 'User-Agent': 'mrfentmen-seismicportal-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Seismic portal returned ${res.status}`);
  const d = (await res.json()) as { features?: Array<Record<string, unknown>> };
  const feats = d.features ?? [];
  if (!feats.length) return 'No earthquakes returned.';
  return `Earthquakes (${feats.length} shown):\n` +
    feats.map((f, i) => {
      const p = (f.properties ?? {}) as Record<string, unknown>;
      const s = (k: string) => (p[k] != null ? String(p[k]) : '');
      return `${i + 1}. M${s('mag')} at ${s('time').replace('T', ' ').slice(0, 16)} | ${s('place')}`;
    }).join('\n');
}

export function recent(args: ListArgs): Promise<string> {
  return query(0, args);
}

export function significant(args: ListArgs): Promise<string> {
  return query(5, args);
}

// ---- muxB tools:

interface SeismicFeature {
  properties?: Record<string, unknown>;
  geometry?: { coordinates?: [number, number, number?] };
}

async function features(params: string): Promise<SeismicFeature[]> {
  const res = await fetch(`${BASE}?format=json&${params}`, {
    headers: { 'User-Agent': 'mrfentmen-seismicportal-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Seismic portal returned ${res.status}`);
  const d = (await res.json()) as { features?: SeismicFeature[] };
  return d.features ?? [];
}

export interface LargestArgs {
  limit?: number;
  min_magnitude?: number;
}

export interface BoxArgs {
  min_lat: number;
  min_lon: number;
  max_lat: number;
  max_lon: number;
  min_magnitude?: number;
  limit?: number;
}

