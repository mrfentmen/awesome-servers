const BASE = 'https://rest.ensembl.org';

export interface LookupArgs {
  species?: string;
  symbol: string;
}

export interface SeqArgs {
  id: string;
}

export async function lookup(args: LookupArgs): Promise<string> {
  const symbol = (args.symbol ?? '').trim();
  const species = (args.species ?? 'human').trim();
  if (!symbol) return 'Provide a gene symbol.';
  const res = await fetch(`${BASE}/lookup/symbol/${encodeURIComponent(species)}/${encodeURIComponent(symbol)}?content-type=application/json`, {
    headers: { 'User-Agent': 'mrfentmen-ensembl-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Ensembl returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const s = (k: string) => (d[k] != null ? String(d[k]) : '');
  return [
    `${s('display_name')} (${s('id')})`,
    s('description') ? `Description: ${s('description')}` : '',
    `Type: ${s('biotype')} | ${s('start')}-${s('end')} on ${s('seq_region_name')} (${s('strand') === '1' ? '+' : '-'})`,
    s('assembly_name') ? `Assembly: ${s('assembly_name')}` : '',
  ].filter(Boolean).join('\n');
}

export async function sequence(args: SeqArgs): Promise<string> {
  const id = (args.id ?? '').trim();
  if (!id) return 'Provide a stable id.';
  const res = await fetch(`${BASE}/sequence/id/${encodeURIComponent(id)}?content-type=application/json`, {
    headers: { 'User-Agent': 'mrfentmen-ensembl-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Ensembl returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const seq = String(d.seq ?? '');
  return [
    `Sequence for ${id} (${seq.length} bases):`,
    seq.slice(0, 200) + (seq.length > 200 ? '...' : ''),
  ].filter(Boolean).join('\n');
}

// ---- muxA tools:

// Ensembl's public REST node answers slowly and throttles hard, so these calls
// get a longer budget than the 20s the original tools use.
const SLOW_TIMEOUT = 30000

const FEATURES = new Set([
  'gene', 'transcript', 'exon', 'cds', 'repeat', 'simple', 'misc', 'variation',
  'regulatory', 'motif', 'peak', 'other_regulatory', 'rnats', 'cdna',
  'five_prime_utr', 'three_prime_utr', 'intron', 'constrained',
])

async function restJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': 'mrfentmen-ensembl-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(SLOW_TIMEOUT),
  });
  if (res.status === 400) throw new Error(`Ensembl rejected the request: ${path}`);
  if (res.status === 404) throw new Error(`Ensembl has nothing at ${path}`);
  if (!res.ok) throw new Error(`Ensembl returned ${res.status} for ${path}`);
  return (await res.json()) as T;
}

function bound(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

export interface TranscriptArgs {
  id: string;
  limit?: number;
}

export interface ExonArgs {
  id: string;
  transcript?: string;
}

export interface RegionArgs {
  species?: string;
  chrom?: string;
  start?: number;
  end?: number;
  feature?: string;
  limit?: number;
}

export async function genesInRegion(args: RegionArgs): Promise<string> {
  const species = (args.species ?? 'human').trim();
  const chrom = (args.chrom ?? '').trim();
  if (!chrom) return 'Provide chrom, e.g. chrom: "7".';
  if (!Number.isInteger(args.start) || !Number.isInteger(args.end)) {
    return 'Provide whole-number start and end coordinates.';
  }
  const start = Number(args.start);
  const end = Number(args.end);
  if (start < 1 || end < start) return 'Start must be 1 or more and end must not be before start.';
  // Ensembl's overlap/region refuses spans over 5 Mb
  if (end - start > 5000000) return 'Region is wider than 5 Mb, which Ensembl will not return in one call. Narrow it down.';

  const wanted = (args.feature ?? 'gene').trim().toLowerCase();
  if (!FEATURES.has(wanted)) {
    return `Unknown feature type ${wanted}. Use one of: ${[...FEATURES].join(', ')}.`;
  }
  const limit = bound(args.limit, 25, 100);
  const region = `${encodeURIComponent(chrom)}:${start}-${end}`;
  const d = await restJson<Array<Record<string, unknown>>>(
    `/overlap/region/${encodeURIComponent(species)}/${region}?feature=${encodeURIComponent(wanted)}&content-type=application/json`,
  );
  if (!Array.isArray(d) || !d.length) return `Ensembl found no ${wanted} features in ${chrom}:${start}-${end} (${species}).`;
  const shown = d.slice(0, limit);
  return [
    `${d.length} ${wanted} feature(s) in ${chrom}:${start}-${end} (${species}), showing ${shown.length}.`,
    ...shown.map((f, i) => {
      const bits = [
        `${i + 1}. ${String(f.external_name ?? f.id ?? '?')}`,
        String(f.biotype ?? f.feature_type ?? 'not reported'),
        `${f.start}-${f.end}`,
        Number(f.strand) === 1 ? '+' : '-',
      ];
      if (f.description) bits.push(String(f.description).slice(0, 90));
      return bits.join(' | ');
    }),
    d.length > shown.length ? `...and ${d.length - shown.length} more.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
