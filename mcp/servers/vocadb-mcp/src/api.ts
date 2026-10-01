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

const ARTISTS = 'https://vocadb.net/api/artists';
const ALBUMS = 'https://vocadb.net/api/albums';

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

export async function artistSearch(args: VocadbEntityArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide an artist name.';
  const limit = Math.max(1, Math.min(args.limit ?? 8, 25));
  const params = new URLSearchParams({ query: q, maxResults: String(limit), fields: 'Names,MainPicture,Description' });
  const d = await vocadbGet<{ items?: Array<Record<string, unknown>> }>(`${ARTISTS}?${params.toString()}`);
  const rows = d.items ?? [];
  if (!rows.length) return `No VocaDB artists found for "${q}".`;
  return `VocaDB artists matching "${q}" (${rows.length} shown):\n` +
    rows
      .map((r, i) => {
        const s = (k: string) => (r[k] != null ? String(r[k]) : '');
        const desc = s('description').replace(/\s+/g, ' ').slice(0, 120);
        return `${i + 1}. ${s('name') || 'not reported'}${s('artistType') ? ` | ${s('artistType')}` : ''}${r.mainPicture ? ' | has picture' : ' | no picture'}\n   ${desc || 'description not reported'}${r.id ? ` | artist id ${r.id}` : ''}`;
      })
      .join('\n');
}

export async function albumSearch(args: VocadbEntityArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide an album name.';
  const limit = Math.max(1, Math.min(args.limit ?? 8, 25));
  const params = new URLSearchParams({ query: q, maxResults: String(limit), fields: 'Names,MainPicture' });
  const d = await vocadbGet<{ items?: Array<Record<string, unknown>> }>(`${ALBUMS}?${params.toString()}`);
  const rows = d.items ?? [];
  if (!rows.length) return `No VocaDB albums found for "${q}".`;
  return `VocaDB albums matching "${q}" (${rows.length} shown):\n` +
    rows
      .map((r, i) => {
        const s = (k: string) => (r[k] != null ? String(r[k]) : '');
        const rd = (r.releaseDate ?? null) as { year?: number; month?: number; day?: number } | null;
        const date = rd && rd.year ? `${rd.year}-${String(rd.month ?? 1).padStart(2, '0')}-${String(rd.day ?? 1).padStart(2, '0')}` : 'date not reported';
        return `${i + 1}. ${s('name') || 'not reported'}${s('artistString') ? ` | ${s('artistString')}` : ''}\n   ${s('discType') || 'type not reported'} | released ${date} | album id ${r.id ?? 'not reported'}`;
      })
      .join('\n');
}
