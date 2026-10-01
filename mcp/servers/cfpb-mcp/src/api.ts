const UA = 'mrfentmen-cfpb-mcp/1.0';

export interface SearchArgs {
  company: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const company = (args.company ?? '').trim();
  if (!company) return 'Provide a company name.';
  const limit = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), 20);
  const url = `https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/?search_term=${encodeURIComponent(company)}&size=${limit}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`CFPB returned ${res.status}`);
  const d = (await res.json()) as { hits?: { total?: number | { value?: number }; hits?: Array<{ _source?: Record<string, unknown> }> } };
  const hits = d.hits?.hits ?? [];
  if (!hits.length) return `No CFPB complaints for "${company}".`;
  const total = typeof d.hits?.total === 'number' ? d.hits.total : d.hits?.total?.value ?? hits.length;
  const get = (h: Record<string, unknown>, k: string) => String(h[k] ?? '?');
  return `CFPB complaints for "${company}" (${total} total):\n` +
    hits.slice(0, limit).map((h, i) => {
      const s = h._source ?? {};
      return `${i + 1}. ${get(s, 'complaint_what_happened')?.slice(0, 120) || get(s, 'product')} | product: ${get(s, 'product')} | company: ${get(s, 'company')} | date: ${get(s, 'date_received')}`;
    }).join('\n');
}

// ---- muxA tools:

const CFPB = 'https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/'

const FACETS = [
  'product',
  'state',
  'issue',
  'company',
  'company_response',
  'company_public_response',
  'timely',
  'submitted_via',
  'tags',
] as const

function count(value: unknown): string {
  return Number(value ?? 0).toLocaleString('en-US')
}

function pct(part: number, whole: number): string {
  if (!whole) return '0%'
  const p = (part / whole) * 100
  return p >= 10 ? `${p.toFixed(1)}%` : `${p.toFixed(2)}%`
}

async function facetsFor(params: Record<string, string>): Promise<{ total: number; aggregations: Record<string, any> }> {
  const query = new URLSearchParams({ ...params, size: '0' })
  const res = await fetch(`${CFPB}?${query.toString()}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) {
    let detail = ''
    try {
      const b = (await res.json()) as Record<string, any>
      detail = Object.values(b).map((v) => JSON.stringify(v)).join(' ').slice(0, 180)
    } catch {
      detail = ''
    }
    throw new Error(`CFPB returned ${res.status}${detail ? ` | ${detail}` : ''}`)
  }
  const d = (await res.json()) as { hits?: { total?: { value?: number } }; aggregations?: Record<string, any> }
  return { total: Number(d.hits?.total?.value ?? 0), aggregations: d.aggregations ?? {} }
}

function bucketsOf(aggregations: Record<string, any>, facet: string): Array<{ key: string; n: number }> {
  const node = aggregations[facet]
  const inner = node?.[facet]?.buckets
  if (!Array.isArray(inner)) return []
  return inner.map((b: Record<string, any>) => ({ key: String(b.key), n: Number(b.doc_count ?? 0) }))
}

export interface FacetsArgs {
  search_term?: string;
  product?: string;
  facet?: string;
  limit?: number;
}

export interface CatalogueArgs {
  limit?: number;
}

