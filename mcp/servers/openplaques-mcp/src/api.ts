const UA = 'mrfentmen-openplaques-mcp/1.0';
const BASE = 'https://openplaques.org';

export interface LimitArgs {
  limit?: number;
}
export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function recent(args: LimitArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
  const res = await fetch(`${BASE}/plaques.json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`OpenPlaques returned ${res.status}`);
  const d = (await res.json()) as Array<{ id?: number; inscription?: string; latitude?: number | null; longitude?: number | null; installed_year?: string; main_photo_url?: string }>;
  if (!Array.isArray(d) || !d.length) return 'No plaques returned.';
  return `Recent OpenPlaques (${d.length} shown):\n` + d.slice(0, limit).map((p, i) => `${i + 1}. [${p.id ?? '?'}] ${(p.inscription ?? '').slice(0, 100)}${p.installed_year ? ` (${p.installed_year})` : ''}${p.latitude != null ? ` @ ${p.latitude.toFixed(3)}, ${p.longitude?.toFixed(3)}` : ''}`).join('\n');
}

export async function search(args: SearchArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
  const res = await fetch(`${BASE}/plaques.json?q=${encodeURIComponent(args.query)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`OpenPlaques returned ${res.status}`);
  const d = (await res.json()) as Array<{ id?: number; inscription?: string; latitude?: number | null; longitude?: number | null; installed_year?: string }>;
  if (!Array.isArray(d) || !d.length) return `No plaques matching "${args.query}".`;
  return `Plaques matching "${args.query}" (${d.length}):\n` + d.slice(0, limit).map((p, i) => `${i + 1}. [${p.id ?? '?'}] ${(p.inscription ?? '').slice(0, 100)}${p.installed_year ? ` (${p.installed_year})` : ''}`).join('\n');
}

// ---- muxB tools:

interface PlaqueRecord {
  id?: number;
  inscription?: string;
  title?: string;
  address?: string;
  subjects?: string;
  erected_at?: string;
  is_current?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  uri?: string;
  main_photo_url?: string;
  installed_year?: string;
}

interface PlaquePhoto {
  file_url?: string;
  photographer_name?: string;
  file_description?: string;
  is_used_on_plaque?: boolean;
}

export interface PlaqueArgs {
  id: string;
}

export interface PlaquePhotosArgs {
  id: string;
}

