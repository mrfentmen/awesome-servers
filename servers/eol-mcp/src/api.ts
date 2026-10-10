const UA = 'mrfentmen-eol-mcp/1.0';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export interface PageArgs {
  id: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), 20);
  const res = await fetch(`https://eol.org/api/search/1.0.json?q=${encodeURIComponent(query)}&page=1`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`EOL returned ${res.status}`);
  const d = (await res.json()) as { totalResults?: number; results?: Array<{ id?: number; title?: string; content?: string }> };
  const results = d.results ?? [];
  if (!results.length) return `No species for "${query}".`;
  return `EOL species for "${query}" (${d.totalResults ?? results.length} total, showing ${Math.min(limit, results.length)}):\n` +
    results.slice(0, limit).map((x, i) => `${i + 1}. ${x.title ?? '?'} (id=${x.id ?? '?'})`).join('\n');
}

export async function page(args: PageArgs): Promise<string> {
  const id = Number(args.id);
  if (!Number.isFinite(id) || id <= 0) return 'Provide a taxon id.';
  const res = await fetch(`https://eol.org/api/pages/${id}.json?images_per_page=0&videos_per_page=0&sounds_per_page=0&maps_per_page=0&details=false`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`EOL returned ${res.status}`);
  const d = (await res.json()) as { taxonConcept?: { identifier?: number; scientificName?: string; nameAccordingTo?: string; richness_score?: number | null } };
  const t = d.taxonConcept;
  if (!t) return `No EOL page for id ${id}.`;
  return [
    `EOL taxon ${t.identifier ?? id}:`,
    `Scientific name: ${t.scientificName ?? '?'}`,
    `Name source: ${t.nameAccordingTo ?? '?'} | Richness score: ${t.richness_score ?? '?'}`,
  ].filter(Boolean).join('\n');
}

// ---- muxA tools:

const EOL = "https://eol.org/api";

function clamp(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

async function eolGet(path: string, params: Record<string, string>): Promise<any> {
  const query = new URLSearchParams(params);
  const res = await fetch(`${EOL}/${path}?${query.toString()}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`EOL returned ${res.status}`);
  return (await res.json()) as any;
}

export interface ClassificationArgs {
  id: number;
}

export interface PagedArgs {
  query: string;
  page?: number;
  limit?: number;
}

