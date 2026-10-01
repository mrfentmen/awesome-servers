const BASE = 'https://www.ebi.ac.uk/interpro/api/entry/interpro';

export interface EntryArgs {
  id: string;
}

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function entry(args: EntryArgs): Promise<string> {
  const id = (args.id ?? '').trim().toUpperCase();
  if (!id) return 'Provide an entry accession like IPR000001.';
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}/`, {
    headers: { 'User-Agent': 'mrfentmen-interpro-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`InterPro returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const md = (d.metadata ?? {}) as Record<string, unknown>;
  const s = (k: string) => (md[k] != null ? String(md[k]) : '');
  const nameObj = (md.name ?? {}) as Record<string, unknown>;
  const name = String(nameObj.name ?? s('name'));
  const descArr = (md.description ?? []) as Array<Record<string, unknown>>;
  const desc = String(descArr[0]?.text ?? '').replace(/<[^>]+>/g, '').trim();
  const go = (md.go_terms ?? []) as Array<Record<string, unknown>>;
  const db = (md.source_database ?? '') as string;
  return [
    `${name} (${s('accession')})`,
    desc ? `\n${desc}` : '',
    `Type: ${s('type')} | Source: ${db}`,
    go.length ? `GO terms: ${go.slice(0, 5).map((g) => String(g.identifier ?? '')).join(', ')}` : '',
  ].filter(Boolean).join('\n');
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}/search/${encodeURIComponent(query)}/?page_size=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-interpro-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`InterPro returned ${res.status}`);
  const d = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const rows = d.results ?? [];
  if (!rows.length) return `No entries found for "${query}".`;
  return `InterPro entries for "${query}" (${rows.length} shown):\n` +
    rows.map((r, i) => {
      const md = (r.metadata ?? {}) as Record<string, unknown>;
      const s = (k: string) => (md[k] != null ? String(md[k]) : '');
      return `${i + 1}. ${s('accession')} ${s('name')} (${s('type')})`;
    }).join('\n');
}

// ---- muxB tools:

interface InterProMeta {
  accession?: string
  name?: string
  type?: string
  integrated?: string | number
  source_database?: string
  source_organism?: { scientificName?: string; fullName?: string; taxId?: string | number }
  length?: number | string
  gene?: string
  go_terms?: Array<{ name?: string; category?: { name?: string } }>
  member_databases?: Record<string, string>
  in_alphafold?: string | number
}

interface InterProMatchedEntry {
  accession?: string
  entry_type?: string
  source_database?: string
  protein_length?: number
  entry_protein_locations?: unknown
  entry_integrated?: string | number
}

interface InterProMatchedProtein {
  accession?: string
  source_database?: string
  source_organism?: { scientificName?: string; fullName?: string; taxId?: string | number }
  protein_length?: number
  in_alphafold?: string | number
  entry_protein_locations?: unknown
}

export interface ProteinEntryMatchesArgs {
  accession: string;
  limit?: number;
}

export interface EntryProteinMatchesArgs {
  accession: string;
  limit?: number;
}

