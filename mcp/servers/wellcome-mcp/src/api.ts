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

export interface SearchByFormatArgs {
  query?: string
  format?: string
  limit?: number
}

// ---- gap4c3 tools:

const wcField = (v: unknown): string => v == null || v === '' ? 'not reported' : String(v).replace(/\s+/g, ' ').slice(0, 500)

function wcWorkPath(id: string): string {
  if (!/^[a-z0-9]{8}$/.test(id)) throw new Error('Provide an eight-character Wellcome work id.')
  return `/works/${encodeURIComponent(id)}`
}

export async function workDetail(args: { id: string }): Promise<string> {
  const d = await wcGet<{
    id?: string; title?: string; description?: string; physicalDescription?: string;
    workType?: { label?: string }; production?: Array<{ label?: string }>;
    contributors?: Array<{ agent?: { label?: string }; roles?: Array<{ label?: string }> }>;
    subjects?: Array<{ label?: string }>; genres?: Array<{ label?: string }>;
    notes?: Array<{ noteType?: { label?: string }; contents?: string[] }>;
  }>(wcWorkPath(args.id), { include: 'subjects,contributors,production,notes,genres' })
  return [
    `${wcField(d.title)} | work ${wcField(d.id)} | ${wcField(d.workType?.label)}`,
    `Description: ${wcField(d.description)}`,
    `Physical description: ${wcField(d.physicalDescription)}`,
    `Production: ${(d.production ?? []).slice(0, 5).map(p => wcField(p.label)).join('; ') || 'not reported'}`,
    `Contributors: ${(d.contributors ?? []).slice(0, 10).map(c => `${wcField(c.agent?.label)} (${(c.roles ?? []).slice(0, 4).map(r => wcField(r.label)).join(', ') || 'role not reported'})`).join('; ') || 'not reported'}`,
    `Subjects: ${(d.subjects ?? []).slice(0, 15).map(s => wcField(s.label)).join('; ') || 'not reported'}`,
    `Genres: ${(d.genres ?? []).slice(0, 10).map(g => wcField(g.label)).join('; ') || 'not reported'}`,
    ...(d.notes ?? []).slice(0, 8).map(n => `${wcField(n.noteType?.label)}: ${(n.contents ?? []).slice(0, 3).map(wcField).join('; ') || 'not reported'}`),
  ].join('\n')
}

