const BASE = 'https://api.ipma.pt/open-data/forecast/meteorology/cities';
const UA = 'mrfentmen-ipma-mcp/1.0';

export async function cities(_args?: unknown): Promise<string> {
  const res = await fetch('https://api.ipma.pt/open-data/distrits-islands.json', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`IPMA returned ${res.status}`);
  const raw = (await res.json()) as { data?: Array<{ globalIdLocal?: number; local?: string }> };
  const d = raw?.data ?? [];
  if (!Array.isArray(d) || !d.length) return 'No cities returned.';
  return `IPMA cities (${d.length}):\n` +
    d.slice(0, 30).map((c, i) => `${i + 1}. ${c.local ?? '?'} (id=${c.globalIdLocal ?? '?'})`).join('\n');
}

export interface ForecastArgs {
  id: number;
  limit?: number;
}

export async function forecast(args: ForecastArgs): Promise<string> {
  const id = Number(args.id);
  if (!Number.isFinite(id) || id <= 0) return 'Provide a city global id.';
  const limit = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), 10);
  const res = await fetch(`${BASE}/daily/${id}.json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`IPMA returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<{ forecastDate?: string; tMax?: string; tMin?: string; precipitaProb?: string; weatherType?: string }> };
  const data = d.data ?? [];
  if (!data.length) return `No forecast for city ${id}.`;
  return `IPMA forecast for city ${id} (next ${limit} days):\n` +
    data.slice(0, limit).map((f, i) => `${i + 1}. ${f.forecastDate ?? '?'}: max ${f.tMax ?? '?'}C min ${f.tMin ?? '?'}C rain ${f.precipitaProb ?? '?'}%`).join('\n');
}

// ---- muxB tools:

const WARNINGS = 'https://api.ipma.pt/open-data/forecast/warnings/warnings_www.json';
const STATIONS = 'https://api.ipma.pt/open-data/observation/meteorology/stations/stations.json';
const OBSERVATIONS = 'https://api.ipma.pt/open-data/observation/meteorology/stations/observations.json';

const LEVELS: Record<string, string> = {
  green: 'green (no risk)',
  yellow: 'yellow (moderate)',
  orange: 'orange (high)',
  red: 'red (highest)',
};

export interface WeatherWarningsArgs {
  level?: string;
  area?: string;
  limit?: number;
}

export interface StationObservationsArgs {
  station?: string;
  limit?: number;
}

