
export interface m0_SearchArgs {
  query: string;
  limit?: number;
}

export interface m0_ArtworkArgs {
  id: number;
}

export interface m1_SearchArgs {
  query: string;
  limit?: number;
}

export interface m1_ArtworkArgs {
  id: number;
}

const m0 = (() => {
const BASE = 'https://api.artic.edu/api/v1';

function pick<T>(obj: Record<string, unknown>, key: string): T {
  return (obj?.[key] as T) ?? ('' as T);
}

function firstText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((v) => (typeof v === 'string' ? v : '')).filter(Boolean).join(', ');
  return '';
}

async function search(args: m0_SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide a search query.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const url = `${BASE}/artworks/search?q=${encodeURIComponent(q)}&limit=${limit}&fields=id,title,artist_title,date_display,image_id`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-art-institute-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Art Institute search returned ${res.status}`);
  const data = (await res.json()) as { data?: unknown[] };
  const rows = (data.data ?? []).map((d) => {
    const o = d as Record<string, unknown>;
    const imageId = pick<string>(o, 'image_id');
    return `${pick<string>(o, 'title')} | ${firstText(pick(o, 'artist_title'))} | ${pick<string>(o, 'date_display')} | id ${pick<number>(o, 'id')}${imageId ? ` | image https://www.artic.edu/iiif/2/${imageId}/full/843,/0/default.jpg` : ''}`;
  });
  if (!rows.length) return `No artworks found for "${q}".`;
  return `Art Institute results for "${q}" (${rows.length} shown):\n` + rows.map((r, i) => `${i + 1}. ${r}`).join('\n');
}

async function artwork(args: m0_ArtworkArgs): Promise<string> {
  const url = `${BASE}/artworks/${args.id}?fields=id,title,artist_title,date_display,medium_display,description,image_id`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-art-institute-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Art Institute fetch returned ${res.status}`);
  const data = (await res.json()) as { data?: unknown };
  const o = (data.data ?? {}) as Record<string, unknown>;
  const imageId = pick<string>(o, 'image_id');
  const lines = [
    `Title: ${pick<string>(o, 'title')}`,
    `Artist: ${firstText(pick(o, 'artist_title'))}`,
    `Date: ${pick<string>(o, 'date_display')}`,
    `Medium: ${pick<string>(o, 'medium_display')}`,
  ];
  const desc = pick<string>(o, 'description');
  if (desc) lines.push(`Description: ${desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400)}`);
  if (imageId) lines.push(`Image: https://www.artic.edu/iiif/2/${imageId}/full/843,/0/default.jpg`);
  return lines.join('\n');
}

return { artwork, search };
})();

const m1 = (() => {
const BASE = 'https://api.artic.edu/api/v1/artworks';

async function search(args: m1_SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}&fields=id,title,artist_title,date_display,image_id`, {
    headers: { 'User-Agent': 'mrfentmen-artic-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Artic returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<Record<string, unknown>> };
  const rows = d.data ?? [];
  if (!rows.length) return 'No artworks found.';
  return `Artworks for "${query}" (${rows.length} shown):\n` +
    rows.map((r, i) => {
      const s = (k: string) => (r[k] != null ? String(r[k]) : '');
      return `${i + 1}. ${s('title')}${s('artist_title') ? ` by ${s('artist_title')}` : ''}${s('date_display') ? ` (${s('date_display')})` : ''}`;
    }).join('\n');
}

async function artwork(args: m1_ArtworkArgs): Promise<string> {
  const id = Math.floor(args.id ?? 0);
  if (!id) return 'Provide an artwork id.';
  const res = await fetch(`${BASE}/${id}?fields=id,title,artist_title,date_display,medium_display,description,image_id`, {
    headers: { 'User-Agent': 'mrfentmen-artic-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Artic returned ${res.status}`);
  const d = (await res.json()) as { data?: Record<string, unknown> };
  const r = d.data;
  if (!r) return `No artwork with id ${id}.`;
  const s = (k: string) => (r[k] != null ? String(r[k]) : '');
  return [
    `${s('title')}${s('artist_title') ? ` by ${s('artist_title')}` : ''}`,
    s('date_display') ? `Date: ${s('date_display')}` : '',
    s('medium_display') ? `Medium: ${s('medium_display')}` : '',
    s('description') ? `\n${s('description').replace(/<[^>]+>/g, '')}` : '',
  ].filter(Boolean).join('\n');
}

return { artwork, search };
})();

export const artwork = m0.artwork;
export const search = m0.search;
export const m0_search = m0.search;
export const m0_artwork = m0.artwork;
export const m1_search = m1.search;
export const m1_artwork = m1.artwork;

// ---- muxE tools:
// The two existing tools search artworks and read one artwork, and the search
// prints one line per hit. The new tools work the two angles that leaves open:
// the shape of a whole result set rather than its first rows, and the exhibition
// records, which this server has never touched at all.
const AIC = "https://api.artic.edu/api/v1";
const AIC_UA = "mrfentmen-art-institute-mcp/1.0";

interface AICEnvelope {
  pagination?: { total?: number; current_page?: number; total_pages?: number };
  data?: Array<Record<string, unknown>>;
  facets?: unknown;
}

async function aicGet(path: string, params: Record<string, string | number>): Promise<AICEnvelope> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) qs.set(key, String(value));
  const res = await fetch(`${AIC}${path}?${qs.toString()}`, {
    headers: { 'User-Agent': AIC_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  if (res.status === 404) throw new Error('The Art Institute has no record for that.');
  if (!res.ok) {
    let why = `The Art Institute returned ${res.status}`;
    const raw = await res.text();
    if (raw.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(raw) as { error?: { reason?: string } };
        if (parsed?.error?.reason) why = `The Art Institute said: ${parsed.error.reason}`;
      } catch {
        // the body was not the JSON error, so the status is all we have
      }
    }
    throw new Error(why);
  }
  const raw = await res.text();
  try {
    return JSON.parse(raw) as AICEnvelope;
  } catch {
    throw new Error('The Art Institute returned a body that is not JSON.');
  }
}

const text = (v: unknown): string => (v === undefined || v === null || v === '' ? 'not reported' : String(v));
const clean = (v: unknown): string => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export interface CollectionProfileArgs {
  query: string;
  limit?: number;
}

export interface ExhibitionSearchArgs {
  query: string;
  limit?: number;
}

export async function exhibitionSearch(args: ExhibitionSearchArgs): Promise<string> {
  const query = (args?.query ?? '').trim();
  if (!query) return 'Provide search terms for the exhibition archive.';
  const limit = Math.max(1, Math.min(Math.floor(Number(args?.limit ?? 10) || 10), 25));
  const fields = ['id', 'title', 'aic_start_at', 'aic_end_at', 'web_url', 'artwork_ids', 'short_description'].join(',');
  const body = await aicGet('/exhibitions/search', { q: query, limit, fields, page: 1 });
  const rows = Array.isArray(body.data) ? body.data : [];
  if (!rows.length) return `The Art Institute exhibition archive holds nothing matching "${query}".`;
  const lines = [
    `Exhibitions at the Art Institute matching "${query}" (${rows.length} shown):`,
  ];
  let withArtworks = 0;
  let totalArtworks = 0;
  for (const [i, r] of rows.entries()) {
    const ids = Array.isArray(r.artwork_ids) ? r.artwork_ids : [];
    if (ids.length) {
      withArtworks += 1;
      totalArtworks += ids.length;
    }
    const start = String(r.aic_start_at ?? '').slice(0, 10);
    const end = String(r.aic_end_at ?? '').slice(0, 10);
    const ran = start && end ? (end >= start ? `${start} to ${end}` : `${start} to ${end || 'unknown'}`) : start ? `opened ${start}, no end date reported` : 'no dates reported';
    lines.push(`${i + 1}. ${text(r.title)}`);
    lines.push(`   exhibition id ${text(r.id)}, ${ran}`);
    lines.push(`   artworks listed in the record: ${ids.length}${ids.length ? `, first few ${ids.slice(0, 8).join(', ')}` : ' (this record lists none)'}`);
    if (r.web_url) lines.push(`   ${String(r.web_url).slice(0, 160)}`);
    const description = clean(r.short_description);
    if (description) lines.push(`   ${description.slice(0, 200)}`);
  }
  lines.push(`  exhibitions in this page that list at least one artwork: ${withArtworks} of ${rows.length}, ${totalArtworks} artwork id(s) in total.`);
  const apiTotal = body.pagination?.total;
  lines.push(`  the Art Institute's exhibition index holds ${typeof apiTotal === 'number' ? apiTotal.toLocaleString('en-US') : 'an unstated number of'} exhibitions, though that count is the index size and not a match count for this query.`);
  return lines.join('\n');
}
