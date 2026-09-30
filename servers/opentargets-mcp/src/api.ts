/**
 * Open Targets Platform GraphQL client, keyless.
 * Docs: https://platform-docs.opentargets.org/data-access/graphql-api
 */
const API = "https://api.platform.opentargets.org/api/v4/graphql"

export class OpenTargetsError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function gql<T>(query: string, variables: Raw = {}): Promise<T> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "User-Agent": "opentargets-mcp/1.0", "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new OpenTargetsError(`Open Targets error ${res.status}`)
  const data = (await res.json()) as Raw
  if (data.errors) throw new OpenTargetsError(`Open Targets: ${String(data.errors[0]?.message ?? "query failed")}`)
  return data.data as T
}

export interface SearchHit {
  id: string
  kind: string
  label: string
}

export async function searchEntities(query: string, entity: "target" | "disease" | "drug", limit = 5): Promise<SearchHit[]> {
  const data = await gql<Raw>(
    `query($q: String!, $e: [String!], $n: Int!) {
      search(queryString: $q, entityNames: $e, page: { index: 0, size: $n }) {
        hits { id object { __typename ... on Target { approvedSymbol approvedName } ... on Disease { name } ... on Drug { name } } }
      }
    }`,
    { q: query, e: [entity], n: Math.min(Math.max(limit, 1), 25) }
  )
  const hits: Raw[] = data.search?.hits ?? []
  return hits.map((h) => {
    const o: Raw = h.object ?? {}
    return {
      id: String(h.id),
      kind: String(o.__typename ?? entity),
      label: String(o.approvedSymbol ?? o.approvedName ?? o.name ?? h.id),
    }
  })
}

export interface TargetDetails {
  id: string
  symbol?: string
  name?: string
  biotype?: string
  functions: string[]
  drugs: string[]
  diseases: string[]
}

export async function getTarget(ensemblId: string): Promise<TargetDetails | null> {
  const id = ensemblId.trim()
  if (!/^ENSG\d+$/.test(id)) throw new OpenTargetsError(`Not an Ensembl gene id: "${ensemblId}". Use search (e.g. BRCA1 gives ENSG...).`)
  const data = await gql<Raw>(
    `query($id: String!) {
      target(ensemblId: $id) {
        approvedSymbol approvedName biotype
        functionDescriptions
        drugAndClinicalCandidates { count rows { drug { name } } }
        associatedDiseases(page: { index: 0, size: 5 }) { rows { disease { name } score } }
      }
    }`,
    { id }
  )
  const t: Raw | null = data.target
  if (!t) return null
  const dc: Raw = t.drugAndClinicalCandidates ?? {}
  return {
    id,
    symbol: t.approvedSymbol,
    name: t.approvedName,
    biotype: t.biotype,
    functions: Array.isArray(t.functionDescriptions) ? t.functionDescriptions.map(String).slice(0, 3) : [],
    drugs: ((dc.rows ?? []) as Raw[]).map((r) => String(r.drug?.name ?? "?")).slice(0, 5),
    diseases: ((t.associatedDiseases?.rows ?? []) as Raw[]).map((r) => `${String(r.disease?.name ?? "?")} (${Number(r.score ?? 0).toFixed(2)})`).slice(0, 5),
  }
}

export function formatHit(h: SearchHit, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${h.id}] ${h.label} (${h.kind})`
}

export function formatTarget(t: TargetDetails): string {
  const lines = [
    `${t.symbol ?? t.id}${t.name ? ` — ${t.name}` : ""} [${t.id}]`,
    t.biotype ? `Biotype: ${t.biotype}` : "",
    t.functions.length ? `Functions:\n- ${t.functions.join("\n- ")}` : "",
    t.drugs.length ? `Known drugs: ${t.drugs.join(", ")}` : "",
    t.diseases.length ? `Top diseases:\n- ${t.diseases.join("\n- ")}` : "",
    `More: https://platform.opentargets.org/target/${t.id}`,
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxE tools:
// getTarget reads six of the forty-two fields Open Targets holds on a target:
// symbol, name, biotype, three function descriptions, five drugs and five
// diseases. The other thirty-six are untouched, and among them are the three
// that answer the questions a target is actually triaged on: is it druggable,
// how badly does losing it hurt, and how much literature stands behind the
// association. The field names and types below were read from the live schema
// by introspection rather than assumed, since several differ from the obvious
// spelling, and geneticConstraint is a list rather than a single object.
// This block is spliced into the same module, so gql and OpenTargetsError are
// already in scope and are not imported again.

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

function ensemblId(raw: unknown): string {
  const id = String(raw ?? '').trim();
  if (!/^ENSG\d+$/.test(id)) {
    throw new OpenTargetsError(`Not an Ensembl gene id: "${raw}". Use search (e.g. BRCA1 gives ENSG...).`);
  }
  return id;
}

const label = (v: unknown, max = 60): string => {
  if (typeof v !== 'string' || !v.trim()) return 'not reported';
  const t = v.trim();
  return t.length > max ? `${t.slice(0, max)}...` : t;
};

const pct = (n: number, total: number): string => (total > 0 ? `${((n / total) * 100).toFixed(0)}%` : 'n/a');

export interface DruggabilityArgs {
  ensemblId: string;
}

export interface PathwayArgs {
  ensemblId: string;
  limit?: number;
}

export interface EvidenceArgs {
  ensemblId: string;
  limit?: number;
}

export async function target_evidence(args: EvidenceArgs): Promise<string> {
  const id = ensemblId(args?.ensemblId);
  const limit = Math.max(5, Math.min(60, Math.floor(Number(args?.limit ?? 30) || 30)));
  const data = await gql<Record<string, any>>(
    `query($id: String!) { target(ensemblId: $id) { approvedSymbol approvedName dbXrefs { id source } literatureOcurrences { count earliestPubYear } } }`,
    { id },
  );
  const t = data.target;
  if (!t) return `Open Targets has no record for ${id}.`;
  const xr: Array<{ id?: string; source?: string }> = Array.isArray(t.dbXrefs) ? t.dbXrefs : [];
  const bySource = new Map<string, number>();
  const examples = new Map<string, string[]>();
  for (const x of xr) {
    const s = x.source ?? 'not reported';
    bySource.set(s, (bySource.get(s) ?? 0) + 1);
    if (x.id) examples.set(s, [...(examples.get(s) ?? []), x.id].slice(0, 3));
  }
  const lit = t.literatureOcurrences ?? {};
  const count = num(lit.count);
  const lines = [
    `How much evidence stands behind ${t.approvedSymbol ?? id}, as Open Targets counts it:`,
    `  linked publications: ${count === null ? 'not reported' : count.toLocaleString('en-US')}${lit.earliestPubYear ? `, the earliest recorded from ${lit.earliestPubYear}` : ''}.`,
  ];
  if (count !== null) {
    lines.push("  that figure counts papers mentioning the entity, not papers supporting any particular claim about it, so it measures attention rather than support.");
  }
  lines.push(`  cross-references held: ${xr.length}, across ${bySource.size} source${bySource.size === 1 ? '' : 's'}.`);
  if (!bySource.size) {
    lines.push("  none of them report a source, so there is no way to tell which database an identifier came from.");
  } else {
    const ordered = [...bySource.entries()].sort((a, b) => b[1] - a[1]);
    lines.push('');
    lines.push("  by source:");
    for (const [s, n] of ordered) {
      lines.push(`    ${s.padEnd(16)}${String(n).padStart(4)}  ${(examples.get(s) ?? []).join(', ')}${n > 3 ? ' ...' : ''}`);
    }
    const structural = ordered.filter(([s]) => s === 'PDB' || s === 'CHEMBL' || s === 'OpenTargets_WikiPathways' || s === 'Reactome');
    const literature = ordered.filter(([s]) => s === 'PubMed' || s === 'GO');
    if (structural.length) {
      lines.push('');
      lines.push(`  ${structural.map(([s, n]) => `${n} ${s}`).join(', ')}: structural records a compound or a pathway can be built from.`);
    }
    if (literature.length) {
      lines.push(`  ${literature.map(([s, n]) => `${n} ${s}`).join(', ')}: indexing references, which is a measure of curation rather than of evidence quality.`);
    }
    const top = ordered[0];
    if (top && xr.length && top[1] / xr.length > 0.5) {
      lines.push(`  one source holds ${pct(top[1], xr.length)} of all cross-references, so the apparent breadth of this record is mostly that one database.`);
    }
  }
  lines.push("");
  lines.push("  The existing tools report neither the publication count nor the cross-references, so a target with three links and a target with three hundred look identical.");
  return lines.join('\n');
}

// ---- gap3d tools:

// Five of the six tools on this server go target -> something: a gene, its
// diseases, its pathways, its evidence. search can find a drug, but nothing can
// then answer what that drug is, so the drug side of the graph is unreachable.
// This closes that, from a ChEMBL id to the molecule, its stage, its trade
// names and the targets its mechanism of action points at.

interface OtDrug {
  id?: string
  name?: string
  drugType?: string | null
  maximumClinicalStage?: string | null
  description?: string | null
  tradeNames?: Array<{ label?: string; source?: string | null }> | null
  mechanismsOfAction?: {
    uniqueActionTypes?: string[] | null
    uniqueTargetTypes?: string[] | null
    rows?: Array<{
      actionType?: string | null
      mechanismOfAction?: string | null
      targetName?: string | null
      targets?: Array<{ id?: string; approvedSymbol?: string | null; approvedName?: string | null }> | null
    }> | null
  } | null
}

export interface DrugProfileArgs {
  chemblId?: string
  limit?: number
}

