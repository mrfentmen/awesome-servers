const UA = 'mrfentmen-ebi-search-mcp/1.0';
const BASE = 'https://www.ebi.ac.uk/ebisearch/ws/rest';

export interface SearchArgs {
  query: string;
  domain?: string;
  size?: number;
}
export interface EntryArgs {
  domain: string;
  id: string;
}

export async function search(args: SearchArgs): Promise<string> {
  const size = Math.min(Math.max(Number(args?.size ?? 5) || 5, 1), 20);
  const domain = args.domain || 'ensembl';
  const url = `${BASE}/${encodeURIComponent(domain)}?query=${encodeURIComponent(args.query)}&size=${size}&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`EBI Search returned ${res.status}`);
  const d = (await res.json()) as { hitCount?: number; entries?: Array<{ id?: string; source?: string; fields?: Array<{ name?: string; value?: string }> }> };
  const entries = d.entries ?? [];
  if (!entries.length) return `No EBI results in "${domain}" for "${args.query}".`;
  const lines = entries.slice(0, size).map((e, i) => {
    const name = e.fields?.find((f) => f.name === 'name' || f.name === 'title')?.value ?? '';
    return `${i + 1}. ${e.id ?? '?'} ${name ? `- ${name.slice(0, 80)}` : ''}`;
  });
  return `EBI Search "${args.query}" in ${domain} (${d.hitCount ?? entries.length} hits):\n` + lines.join('\n');
}

export async function entry(args: EntryArgs): Promise<string> {
  const url = `${BASE}/${encodeURIComponent(args.domain)}/entry/${encodeURIComponent(args.id)}?format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`EBI Search returned ${res.status}`);
  const d = (await res.json()) as { id?: string; source?: string; fields?: Array<{ name?: string; value?: string }> };
  if (!d.id) throw new Error('No entry returned.');
  const fields = (d.fields ?? []).slice(0, 15).map((f) => `* ${f.name ?? '?'}: ${(f.value ?? '').slice(0, 120)}`);
  return `Entry ${d.id} (${d.source ?? args.domain}):\n` + fields.join('\n');
}

// ---- muxA tools:
// The existing tools ask one domain for results or for one entry, so the new
// ones describe the catalogue itself: the whole tree of searchable domains, and
// the index size plus the searchable field list of one domain.
interface EbiDomain {
  id: string;
  name?: string;
  description?: string;
  subdomains?: EbiDomain[];
  indexInfos?: Array<{ name?: string; value?: string }>;
  fieldInfos?: Array<{ id?: string; options?: Array<{ name?: string; value?: string }> }>;
}

interface EbiNode {
  id: string;
  name: string;
  depth: number;
  descendants: number;
}

async function explainFailure(res: Response): Promise<string> {
  let why = `HTTP ${res.status}`;
  try {
    const body = (await res.json()) as { diagnostics?: { message?: string } };
    if (body?.diagnostics?.message) why = body.diagnostics.message;
  } catch {
    // the body was not JSON, so the status code is the only reason we have
    why = `HTTP ${res.status}`;
  }
  return why;
}

async function getEbi(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`EBI Search said ${await explainFailure(res)}`);
  return res.json();
}

export async function domainIndex(_args: Record<string, never> = {}): Promise<string> {
  const data = (await getEbi(`${BASE}?format=json`)) as { domains?: EbiDomain[] };
  const roots = data.domains ?? [];
  if (!roots.length) throw new Error('EBI Search returned no domains.');
  const nodes: EbiNode[] = [];
  const walk = (node: EbiDomain, depth: number): number => {
    const entry: EbiNode = { id: node.id, name: node.name ?? '', depth, descendants: 0 };
    nodes.push(entry);
    for (const child of node.subdomains ?? []) entry.descendants += 1 + walk(child, depth + 1);
    return entry.descendants;
  };
  for (const root of roots) walk(root, 0);
  const at = (depth: number) => nodes.filter((n) => n.depth === depth);
  const lines = [
    `EBI Search holds ${nodes.length} domains in one tree, ${nodes.length - roots.length} of them below the top level.`,
  ];
  for (const root of at(0)) lines.push(`${root.id}${root.name ? ` (${root.name})` : ''}`);
  lines.push('  the groups directly below it:');
  for (const group of at(1)) {
    lines.push(`    ${group.id}${group.name ? ` (${group.name})` : ''}: ${group.descendants} domain(s) inside`);
  }
  const deepest = nodes.reduce((max, n) => Math.max(max, n.depth), 0);
  lines.push(`  the tree is ${deepest + 1} level(s) deep; pass any of these ids to the search or entry tool.`);
  return lines.join('\n');
}

export interface DomainInfoArgs {
  domain: string;
}

