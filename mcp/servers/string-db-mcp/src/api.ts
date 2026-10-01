const BASE = 'https://string-db.org/api/tsv/network';

export interface NetworkArgs {
  proteins: string;
  species?: number;
}

export async function network(args: NetworkArgs): Promise<string> {
  const proteins = (args.proteins ?? '').trim();
  if (!proteins) return 'Provide protein gene names separated by commas.';
  const species = args.species ?? 9606;
  const params = new URLSearchParams({ identifiers: proteins, species: String(species) });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-string-db-mcp/1.0', Accept: 'text/tab-separated-values' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`STRING DB returned ${res.status}`);
  const text = await res.text();
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length <= 1) return `No interactions found for ${proteins}.`;
  const header = lines[0].split('\t');
  const rows = lines.slice(1, 11).map((l) => l.split('\t'));
  const get = (r: string[], k: string) => r[header.indexOf(k)] ?? '';
  return `Interactions for ${proteins} (${rows.length} shown):\n` +
    rows
      .map((r, i) => `${i + 1}. ${get(r, 'preferredName_A')} <-> ${get(r, 'preferredName_B')} | score ${Number(get(r, 'score')).toFixed(2)}`)
      .join('\n');
}

// ---- muxB tools:
const ROOT = 'https://string-db.org/api/tsv';

export interface PartnersArgs {
  proteins: string;
  species?: number;
  limit?: number;
}

async function tsv(path: string, params: URLSearchParams): Promise<string> {
  const res = await fetch(`${ROOT}/${path}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-string-db-mcp/1.0', Accept: 'text/tab-separated-values' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`STRING DB returned ${res.status}`);
  return res.text();
}

function identifiers(proteins: string): string | null {
  const list = proteins.split(/[\s,]+/).filter(Boolean);
  return list.length ? list.join('\r') : null;
}

export async function networkSummary(args: NetworkArgs): Promise<string> {
  const proteins = (args.proteins ?? '').trim();
  if (!proteins) return 'Provide protein gene names separated by commas.';
  const ids = identifiers(proteins);
  if (!ids) return 'Provide protein gene names separated by commas.';
  const species = args.species ?? 9606;
  const params = new URLSearchParams({ identifiers: ids, species: String(species) });
  const lines = (await tsv('ppi_enrichment', params)).split('\n').filter((l) => l.trim());
  if (lines.length < 2) return `No network summary reported for ${proteins}.`;
  const header = lines[0].split('\t');
  const row = lines[1].split('\t');
  const get = (key: string) => {
    const value = row[header.indexOf(key)];
    return value === undefined || value === '' ? 'not reported' : value;
  };
  return [
    `STRING network summary for ${proteins} (species ${species}):`,
    `Nodes: ${get('number_of_nodes')} | edges: ${get('number_of_edges')} | expected edges: ${get('expected_number_of_edges')}`,
    `Average node degree: ${get('average_node_degree')} | local clustering coefficient: ${get('local_clustering_coefficient')}`,
    `Enrichment p-value: ${get('p_value')}`,
  ].join('\n');
}
