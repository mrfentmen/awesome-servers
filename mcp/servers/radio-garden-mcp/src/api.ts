const BASE = 'https://radio.garden/api/ara/content';
const UA = 'mrfentmen-radio-garden-mcp/1.0';

interface Place {
  title?: string;
  url?: string;
  id?: string;
}

export interface PlacesArgs {
  limit?: number;
}

export async function places(args: PlacesArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 15) || 15, 1), 30);
  const res = await fetch(`${BASE}/places`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Radio Garden returned ${res.status}`);
  const d = (await res.json()) as { data?: { list?: Place[] } };
  const list = d.data?.list ?? [];
  if (!list.length) return 'No places returned.';
  return `Radio Garden places (${list.length} available, showing ${Math.min(limit, list.length)}):\n` +
    list.slice(0, limit).map((p, i) => `${i + 1}. ${p.title ?? '?'}`).join('\n');
}

export interface SearchArgs {
  query: string;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Radio Garden returned ${res.status}`);
  const d = (await res.json()) as { data?: { list?: Place[] } };
  const list = d.data?.list ?? [];
  if (!list.length) return `No Radio Garden results for "${query}".`;
  return `Radio Garden results for "${query}" (${list.length}):\n` +
    list.slice(0, 15).map((p, i) => `${i + 1}. ${p.title ?? '?'}`).join('\n');
}

// ---- muxB tools:

const RG = 'https://radio.garden/api/ara/content'

interface RgPlace {
  title?: string;
  country?: string;
  id?: string;
  url?: string;
  geo?: [number, number];
  size?: number;
}

async function rgAllPlaces(): Promise<RgPlace[]> {
  const res = await fetch(`${RG}/places`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(40000),
  })
  if (!res.ok) throw new Error(`Radio Garden returned ${res.status}`)
  const d = (await res.json()) as { data?: { list?: RgPlace[] } }
  return d.data?.list ?? []
}

const rgRad = (deg: number) => (deg * Math.PI) / 180

const rgText = (p: RgPlace, key: keyof RgPlace): string => {
  const v = p?.[key]
  return v != null && String(v).trim() ? String(v) : 'not reported'
}

export interface PlaceDetailArgs {
  id?: string;
}

export interface PlacesNearArgs {
  lat?: number;
  lon?: number;
  radiusKm?: number;
  limit?: number;
}

