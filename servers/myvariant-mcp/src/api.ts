const UA = 'mrfentmen-myvariant-mcp/1.0';
const BASE = 'https://myvariant.info/v1';

export interface QueryArgs {
  q: string;
  size?: number;
}
export interface GetArgs {
  id: string;
}

export async function query(args: QueryArgs): Promise<string> {
  const size = Math.min(Math.max(Number(args?.size ?? 5) || 5, 1), 20);
  const res = await fetch(`${BASE}/query?q=${encodeURIComponent(args.q)}&size=${size}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`MyVariant returned ${res.status}`);
  const d = (await res.json()) as { total?: number; hits?: Array<{ _id?: string; _score?: number; hgvs?: string; clinvar?: { clinvar_id?: string; clinical_significance?: Array<{ clinical_significance?: string }> } }> };
  const hits = d.hits ?? [];
  if (!hits.length) return `No variants found for "${args.q}".`;
  return `Variants matching "${args.q}" (${d.total ?? hits.length} hits):\n` + hits.slice(0, size).map((h, i) => {
    const cs = h.clinvar?.clinical_significance?.map((c) => c.clinical_significance).filter(Boolean).join(', ');
    return `${i + 1}. ${h._id ?? h.hgvs ?? '?'}${cs ? ` | ${cs}` : ''}`;
  }).join('\n');
}

export async function get(args: GetArgs): Promise<string> {
  const res = await fetch(`${BASE}/variant/${encodeURIComponent(args.id)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`MyVariant returned ${res.status}`);
  const d = (await res.json()) as { _id?: string; hgvs?: string; chrom?: string; pos?: number; ref?: string; alt?: string; clinvar?: { clinvar_id?: string; clinical_significance?: Array<{ clinical_significance?: string; last_evaluated?: string }> } };
  if (!d._id) throw new Error(`No variant for ${args.id}.`);
  const cs = d.clinvar?.clinical_significance ?? [];
  return `Variant ${d._id}\nHGVS: ${d.hgvs ?? '?'}\nPosition: ${d.chrom ?? '?'}:${d.pos ?? '?'} ${d.ref ?? ''}>${d.alt ?? ''}\nClinVar id: ${d.clinvar?.clinvar_id ?? 'none'}\nSignificance: ${cs.map((c) => c.clinical_significance).join(', ') || 'not classified'}${cs[0]?.last_evaluated ? ` (last evaluated ${cs[0].last_evaluated})` : ''}`;
}

// ---- muxC tools:

const MYVARIANT_BASE = "https://myvariant.info/v1"
const MYVARIANT_UA = "mrfentmen-myvariant-mcp/1.0"

