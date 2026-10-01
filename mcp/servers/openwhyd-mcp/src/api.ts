const BASE = 'https://openwhyd.org/hot';

export interface HotArgs {
  limit?: number;
}

export async function hot(args: HotArgs = {}): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const res = await fetch(`${BASE}?format=json&limit=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-openwhyd-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`OpenWhyd returned ${res.status}`);
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  if (!Array.isArray(rows) || !rows.length) return 'No hot tracks available.';
  return `Hot tracks on OpenWhyd (${rows.length} shown):\n` +
    rows
      .slice(0, limit)
      .map((t, i) => {
        const name = t.name ?? 'untitled';
        const artist = t.artist ? String(t.artist).replace(/^[^ ]+ /, '') : '';
        const url = t.url ?? '';
        return `${i + 1}. ${name}${artist ? ` by ${artist}` : ''}${url ? `\n   ${url}` : ''}`;
      })
      .join('\n');
}

// ---- muxB tools:

const OW = 'https://openwhyd.org'

async function owGet<T>(path: string): Promise<T> {
  const res = await fetch(`${OW}${path}`, {
    headers: { 'User-Agent': 'mrfentmen-openwhyd-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`OpenWhyd returned ${res.status} for ${path}`)
  return (await res.json()) as T
}

const owText = (row: Record<string, unknown>, key: string): string =>
  row[key] != null && String(row[key]).trim() ? String(row[key]) : 'not reported'

const owNum = (value: unknown): string => {
  const n = Number(value)
  return Number.isFinite(n) ? n.toLocaleString('en-US') : 'not reported'
}

export interface HotDetailArgs {
  limit?: number;
}

export interface SearchTracksArgs {
  query?: string;
  limit?: number;
}

