const BASE = 'https://api.wellcomecollection.org/catalogue/v2/works';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}?query=${encodeURIComponent(query)}&pageSize=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-wellcome-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Wellcome returned ${res.status}`);
  const d = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const rows = d.results ?? [];
  if (!rows.length) return `No works found for "${query}".`;
  return `Wellcome works for "${query}" (${rows.length} shown):\n` +
    rows.map((r, i) => {
      const s = (k: string) => (r[k] != null ? String(r[k]) : '');
      const workType = (r.workType ?? {}) as Record<string, unknown>;
      const contrib = (r.contributions ?? []) as Array<Record<string, unknown>>;
      const agents = contrib.slice(0, 2).map((c) => String(((c.agent as Record<string, unknown> | undefined) ?? {}).label ?? '')).join(', ');
      return `${i + 1}. ${s('title')}${agents ? ` | ${agents}` : ''} | ${String(workType.label ?? '')}`;
    }).join('\n');
}

// ---- muxB tools:

const WC = 'https://api.wellcomecollection.org/catalogue/v2'

// the letters and labels below are the ones the catalogue's own workType
// filter accepts, read back from the API response
const WC_FORMATS: Record<string, string> = {
  a: 'Books',
  k: 'Pictures',
  e: 'Maps',
  j: 'E-journals',
  d: 'Journals',
  m: 'CD-Roms',
  v: 'E-books',
}

async function wcGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${WC}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-wellcome-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`Wellcome returned ${res.status}`)
  return (await res.json()) as T
}

const wcText = (v: unknown): string => (v == null || String(v).trim() === '' ? 'not reported' : String(v))

export interface SearchImagesArgs {
  query?: string
  limit?: number
}

export async function searchImages(args: SearchImagesArgs): Promise<string> {
  const query = (args.query ?? '').trim()
  if (!query) return 'Provide search terms.'
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50))
  const d = await wcGet<{ totalResults?: number; results?: Array<Record<string, unknown>> }>('/images', {
    query,
    pageSize: String(limit),
  })
  const rows = (d.results ?? []).slice(0, limit)
  if (!rows.length) return `No digitised images found for "${query}".`
  return `Wellcome digitised images for "${query}" (${wcText(d.totalResults)} total, showing ${rows.length}):\n` +
    rows.map((r, i) => {
      const src = (r.source ?? {}) as Record<string, unknown>
      const thumb = (r.thumbnail ?? {}) as Record<string, unknown>
      const license = (thumb.license ?? {}) as Record<string, unknown>
      const locs = Array.isArray(r.locations) ? (r.locations as Array<Record<string, unknown>>) : []
      const first = (locs[0] ?? {}) as Record<string, unknown>
      return [
        `${i + 1}. ${wcText(src.title)}`,
        `   from work ${wcText(src.id)} | licence: ${wcText(license.label)}`,
        `   image: ${wcText(first.url)}`,
        `   aspect ratio: ${r.aspectRatio != null ? String(r.aspectRatio) : 'not reported'}`,
      ].join('\n')
    }).join('\n')
}

export interface SearchByFormatArgs {
  query?: string
  format?: string
  limit?: number
}

export async function searchByFormat(args: SearchByFormatArgs): Promise<string> {
  const query = (args.query ?? '').trim()
  if (!query) return 'Provide search terms.'
  const key = (args.format ?? 'a').trim().toLowerCase()
  if (!WC_FORMATS[key]) {
    return `Unknown format "${args.format}". Supported: ${Object.entries(WC_FORMATS).map(([k, v]) => `${k} (${v})`).join(', ')}.`
  }
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50))
  const d = await wcGet<{ totalResults?: number; results?: Array<Record<string, unknown>> }>('/works', {
    query,
    workType: key,
    pageSize: String(limit),
  })
  const rows = (d.results ?? []).slice(0, limit)
  if (!rows.length) return `No ${WC_FORMATS[key]} found for "${query}".`
  const avail = (r: Record<string, unknown>): string => {
    const list = Array.isArray(r.availabilities) ? (r.availabilities as Array<Record<string, unknown>>) : []
    const labels = list.map((a) => String(a.label ?? '')).filter(Boolean)
    return labels.length ? labels.join(', ') : 'not reported'
  }
  return `Wellcome ${WC_FORMATS[key]} for "${query}" (${wcText(d.totalResults)} total, showing ${rows.length}):\n` +
    rows.map((r, i) => `${i + 1}. ${wcText(r.title)} | ${wcText(r.id)} | availability: ${avail(r)}`).join('\n')
}
