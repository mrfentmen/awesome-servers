const UA = 'mrfentmen-cdc-data-mcp/1.0';

export interface DatasetArgs {
  dataset_id: string;
  limit?: number;
}

export async function dataset(args: DatasetArgs): Promise<string> {
  const id = String(args.dataset_id).trim();
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error('Invalid dataset id.');
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 50);
  const res = await fetch(`https://data.cdc.gov/resource/${encodeURIComponent(id)}.json?$limit=${limit}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`CDC returned ${res.status}`);
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  if (!Array.isArray(rows) || !rows.length) return `No rows for dataset ${id}.`;
  const headers = Object.keys(rows[0]).slice(0, 8);
  const lines = rows.slice(0, limit).map((r, i) => {
    const parts = headers.map((h) => `${h}=${String(r[h] ?? '').slice(0, 40)}`);
    return `${i + 1}. ${parts.join(' | ')}`;
  });
  return `CDC dataset ${id} (${rows.length} rows shown, fields: ${headers.join(', ')}):\n` + lines.join('\n');
}

// ---- muxA tools:

const CDC = 'https://data.cdc.gov'

function clampLimit(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max))
}

function scalar(value: unknown): string {
  const s = value != null ? String(value) : ''
  return s.length > 220 ? `${s.slice(0, 220)}...` : s
}

export interface MetaArgs {
  dataset_id: string;
  show_columns?: boolean;
}

export interface AggregateArgs {
  dataset_id: string;
  select: string;
  where?: string;
  group?: string;
  order?: string;
  limit?: number;
}

export interface SearchArgs {
  query: string;
  only?: string;
  limit?: number;
}

export async function datasetSearch(args: SearchArgs): Promise<string> {
  const q = String(args.query ?? '').trim()
  if (!q) throw new Error('Provide search words, e.g. "COVID vaccine" or "foodborne".')
  const limit = clampLimit(args.limit, 10, 25)
  const only = (args.only ?? 'dataset').trim()
  const query = new URLSearchParams({ q, limit: String(limit) })
  if (only && only !== 'any') query.set('only', only)
  const res = await fetch(`${CDC}/api/catalog/v1?${query.toString()}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`CDC returned ${res.status}`)
  const d = (await res.json()) as { resultSetSize?: number; results?: Array<Record<string, any>> }
  const results = d.results ?? []
  if (!results.length) return `No CDC catalog entries match "${q}".`
  return [
    `${Number(d.resultSetSize ?? results.length).toLocaleString('en-US')} CDC entries match "${q}", showing ${results.length}.`,
    ...results.map((r, i) => {
      const res0 = r.resource ?? {}
      return `${i + 1}. ${res0.id ?? '?'} [${res0.type ?? '?'}] ${res0.name ?? 'untitled'}\n     ${scalar(res0.description || 'no description')}`
    }),
    'Pass an id to dataset_metadata for the column schema or to dataset for raw rows.',
  ].join('\n')
}
