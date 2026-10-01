const BASE = 'https://vocadb.net/api/songs';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const params = new URLSearchParams({ query: q, maxResults: String(limit), fields: 'Names,MainPicture' });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-vocadb-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`VocaDB returned ${res.status}`);
  const d = (await res.json()) as { items?: Array<Record<string, unknown>> };
  const rows = d.items ?? [];
  if (!rows.length) return `No VocaDB songs found for "${q}".`;
  return `VocaDB songs for "${q}" (${rows.length} shown):\n` +
    rows
      .map((r, i) => {
        const s = (k: string) => (r[k] != null ? String(r[k]) : '');
        const name = s('name');
        return `${i + 1}. ${name}${s('artistString') ? ` | ${s('artistString')}` : ''}${s('songType') ? ` [${s('songType')}]` : ''}`;
      })
      .join('\n');
}

// ---- muxB tools:

export interface VocadbEntityArgs {
  query: string;
  limit?: number;
}

async function vocadbGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-vocadb-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`VocaDB returned ${res.status}`);
  return (await res.json()) as T;
}

// ---- gap4c3 tools:

const vdValue = (value: unknown): string => value == null || value === '' ? 'not reported' : String(value).slice(0, 500);

export async function tagSearch(args: { query: string; limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 10), 25));
  const params = new URLSearchParams({ query: args.query.trim(), maxResults: String(limit), fields: 'Description' });
  const d = await vocadbGet<{ items?: Array<{ id?: number; name?: string; categoryName?: string; usageCount?: number; description?: string }> }>(`https://vocadb.net/api/tags?${params}`);
  const rows = (d.items ?? []).slice(0, limit);
  if (!rows.length) return 'No matching tags.';
  return 'VocaDB tags:\n' + rows.map(t => `${vdValue(t.name)} | tag ${vdValue(t.id)} | ${vdValue(t.categoryName)} | uses ${vdValue(t.usageCount)}\n${vdValue(t.description)}`).join('\n\n');
}
