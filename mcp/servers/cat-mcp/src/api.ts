const FACTS_BASE = 'https://catfact.ninja';
const CATAPI_BASE = 'https://api.thecatapi.com/v1/breeds';
const CATAAS_BASE = 'https://cataas.com/cat';
const UA = 'mrfentmen-cat-mcp/1.0 (https://github.com/mrfentmen)';
export class CatError extends Error {}

async function get<T>(url: string, accept = 'application/json'): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept }, signal: AbortSignal.timeout(20000) });
  if (res.status === 429) throw new CatError('rate limit hit, wait and retry');
  if (!res.ok) throw new CatError(`Cat API error ${res.status}`);
  return (await res.json()) as T;
}

export async function fact(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<{ fact?: string }>(`${FACTS_BASE}/fact`);
  if (!d.fact) throw new CatError('Cat Facts returned an empty response');
  return `Cat fact: ${d.fact}`;
}

export async function breeds(args: { limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 20, 50));
  const d = await get<{ data?: Array<Record<string, unknown>> }>(`${FACTS_BASE}/breeds?limit=${limit}`);
  const rows = d.data ?? [];
  if (!rows.length) return 'No breeds returned.';
  return `Cat breeds (${rows.length} shown):\n` +
    rows.map((r, i) => {
      const s = (k: string) => (r[k] != null ? String(r[k]) : '');
      return `${i + 1}. ${s('breed')} (${s('origin')})`;
    }).join('\n');
}

export async function breedInfo(args: { breed_id?: string }): Promise<string> {
  const id = (args.breed_id ?? '').trim().toLowerCase();
  if (!id) throw new CatError('Provide a breed id');
  const d = await get<any[]>(`${CATAPI_BASE}/search?q=${encodeURIComponent(id)}`);
  const b = d[0];
  if (!b) throw new CatError('Breed not found');
  return [
    `${b.name ?? ''} (${b.origin ?? ''})`,
    `Temperament: ${b.temperament ?? ''}`,
    `Weight: ${b.weight?.metric ?? '?'} kg`,
    `Life span: ${b.life_span ?? '?'} years`,
    `Description: ${(b.description ?? '').slice(0, 300)}`,
    `Wikipedia: ${b.wikipedia_url ?? 'n/a'}`,
  ].join('\n');
}

export async function photo(args: { tag?: string }): Promise<string> {
  const tag = (args.tag ?? '').trim().toLowerCase();
  const url = tag ? `${CATAAS_BASE}/${encodeURIComponent(tag)}?json=true` : `${CATAAS_BASE}?json=true`;
  const d = await get<{ url?: string; tags?: string[] }>(url);
  if (!d.url) throw new CatError('Cataas returned an empty response');
  const tags = (d.tags ?? []).slice(0, 5).join(', ');
  return `Random cat photo${tag ? ` (tag: ${tag})` : ''}${tags ? ` (tags: ${tags})` : ''}: ${d.url.startsWith('http') ? d.url : `https://cataas.com${d.url}`}`;
}

export async function searchImages(args: { tag?: string; limit?: number }): Promise<string> {
  const tag = (args.tag ?? '').trim().toLowerCase();
  const limit = Math.max(1, Math.min(args.limit ?? 5, 10));
  const out: string[] = [];
  for (let i = 0; i < limit; i++) {
    try { out.push(await photo({ tag: tag || undefined })); } catch { break; }
  }
  return out.join('\n') || 'No cat photos returned';
}

// ---- muxA tools:

const CATAAS = 'https://cataas.com';

interface CataasCat {
  id?: string;
  tags?: string[];
  mimetype?: string;
  created_at?: string;
  createdAt?: string;
  url?: string;
}

function catUrl(id: string): string {
  return `${CATAAS}/cat/${encodeURIComponent(id)}`;
}

function bound(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

export async function popularCatTags(args: { limit?: number; filter?: string }): Promise<string> {
  const limit = bound(args.limit, 40, 200)
  const filter = (args.filter ?? '').trim()
  const d = await get<string[]>(`${CATAAS}/api/tags`)
  if (!Array.isArray(d)) throw new CatError('Cataas returned an unexpected tags payload')
  // the tag list includes an empty string and a leading "#" convention, so keep
  // only entries a caller could actually pass back to catPhotosByTag
  const usable = d.filter((t) => typeof t === 'string' && t.trim().length > 0)
  const matched = filter
    ? usable.filter((t) => t.toLowerCase().includes(filter.toLowerCase()))
    : usable
  if (!matched.length) {
    return filter ? `No Cataas tag contains "${filter}".` : 'Cataas returned no usable tags.'
  }
  const shown = matched.slice(0, limit)
  return [
    `Cataas has ${usable.length} usable tag(s)${filter ? `, ${matched.length} containing "${filter}"` : ''}.`,
    `Showing ${shown.length}:`,
    shown.join(', '),
    filter ? '' : 'Pass any of these to cat_photos_by_tag to browse a set.',
  ]
    .filter(Boolean)
    .join('\n')
}
