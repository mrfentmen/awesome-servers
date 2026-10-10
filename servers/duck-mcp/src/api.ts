const BASE = 'https://random-d.uk/api/v2';

export interface RandomArgs {
  limit?: number;
}

export async function random(args: RandomArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 1, 10));
  const res = await fetch(`${BASE}/random?count=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-duck-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Random-d.uk returned ${res.status}`);
  const d = (await res.json()) as Array<{ url?: string }> | { url?: string; message?: string };
  const urls = Array.isArray(d) ? (d as Array<{ url?: string }>).map((r) => r.url ?? '').filter(Boolean) : ((d as { url?: string }).url ? [(d as { url?: string }).url ?? ''] : []);
  const rows = urls.slice(0, limit);
  if (!rows.length) return 'No duck photos returned.';
  return `Random ducks (${rows.length}):\n` + rows.map((u, i) => `${i + 1}. ${u}`).join('\n');
}

// ---- muxA tools:

// Waterfowl = order Anseriformes. GBIF and iNaturalist use different ids for
// the same clade, so both are named explicitly rather than shared.

interface GbifVernacular {
  language?: string;
  vernacularName?: string;
}

interface GbifSpecies {
  key?: number;
  scientificName?: string;
  canonicalName?: string;
  rank?: string;
  taxonomicStatus?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  vernacularNames?: GbifVernacular[];
}

export interface SpeciesArgs {
  name?: string;
}

export interface SightingsArgs {
  limit?: number;
}

