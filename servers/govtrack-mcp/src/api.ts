const BASE = 'https://www.govtrack.us/api/v2/bill';

export interface BillsArgs {
  limit?: number;
}

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function bills(args: BillsArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const params = new URLSearchParams({ limit: String(limit), order_by: '-current_status_date' });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-govtrack-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GovTrack returned ${res.status}`);
  const d = (await res.json()) as { objects?: Array<Record<string, unknown>> };
  const rows = d.objects ?? [];
  if (!rows.length) return 'No bills returned.';
  return `Recent US bills (${rows.length} shown):\n` +
    rows
      .map((r, i) => {
        const s = (k: string) => (r[k] != null ? String(r[k]) : '');
        return `${i + 1}. ${s('display_number')} ${s('title').slice(0, 90)}${s('current_status_date') ? ` | ${String(s('current_status_date')).slice(0, 10)}` : ''}`;
      })
      .join('\n');
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const params = new URLSearchParams({ q, limit: String(limit) });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-govtrack-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GovTrack returned ${res.status}`);
  const d = (await res.json()) as { objects?: Array<Record<string, unknown>> };
  const rows = d.objects ?? [];
  if (!rows.length) return `No bills found for "${q}".`;
  return `GovTrack bills for "${q}" (${rows.length} shown):\n` +
    rows
      .map((r, i) => {
        const s = (k: string) => (r[k] != null ? String(r[k]) : '');
        return `${i + 1}. ${s('display_number')} ${s('title').slice(0, 90)}${s('current_status') ? ` | ${s('current_status')}` : ''}`;
      })
      .join('\n');
}

// ---- muxB tools:

const GT = 'https://www.govtrack.us/api/v2'

async function gtGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GT}/${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-govtrack-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`GovTrack returned ${res.status} for ${path}`)
  return (await res.json()) as T
}

const gtText = (v: unknown): string => (v == null || String(v).trim() === '' ? 'not reported' : String(v))

export interface MembersArgs {
  current?: boolean
  congress?: number
  party?: string
  limit?: number
}

export interface VotesArgs {
  congress?: number
  chamber?: string
  limit?: number
}

export interface CommitteesArgs {
  committeeType?: string
  limit?: number
}

export async function committees(args: CommitteesArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50))
  // GovTrack accepts committee_type as a value but refuses it as a filter on
  // this endpoint, so pull a page and narrow it here
  const d = await gtGet<{ meta?: { total_count?: number }; objects?: Array<Record<string, unknown>> }>('committee', {
    limit: '100',
  })
  const all = d.objects ?? []
  // a sub-committee record leaves its own committee_type null and carries the
  // chamber on the parent committee, so look in both places
  const chamberOf = (c: Record<string, unknown>): string => {
    const own = String(c.committee_type ?? '').toLowerCase()
    if (own) return own
    return String(((c.committee ?? {}) as Record<string, unknown>).committee_type ?? '').toLowerCase()
  }
  const want = args.committeeType?.trim().toLowerCase()
  const rows = want ? all.filter((c) => chamberOf(c) === want) : all
  if (!rows.length) return want
    ? `None of the ${all.length} committee records in the page GovTrack returned are ${want} committees.`
    : 'No committees matched.'
  const shown = rows.slice(0, limit)
  return `Congressional committees${want ? ` filtered to ${want}` : ''} (${gtText(d.meta?.total_count)} in the dataset, ${rows.length} in the page fetched, showing ${shown.length}):\n` +
    shown.map((c, i) => {
      const parent = (c.committee ?? {}) as Record<string, unknown>
      return [
        `${i + 1}. ${gtText(c.name)}${parent.name ? ` (subcommittee of ${gtText(parent.name)})` : ''}`,
        `   code: ${gtText(c.code)} | abbrev: ${gtText(c.abbrev)} | chamber: ${chamberOf(c) || 'not reported'}`,
        `   jurisdiction: ${gtText(c.jurisdiction).slice(0, 220)}`,
        `   link: ${gtText(c.url)}`,
      ].join('\n')
    }).join('\n')
}
