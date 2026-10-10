const BASE = 'https://api.fontsource.org/v1/fonts';

export interface ListArgs {
  search?: string;
  limit?: number;
}

export async function list(args: ListArgs = {}): Promise<string> {
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-fontsource-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Fontsource returned ${res.status}`);
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  const q = (args.search ?? '').trim().toLowerCase();
  const limit = Math.max(1, Math.min(args.limit ?? 20, 100));
  const filtered = q
    ? rows.filter((f) => String(f.id ?? f.family ?? '').toLowerCase().includes(q))
    : rows;
  const shown = filtered.slice(0, limit);
  if (!shown.length) return `No fonts match "${q}".`;
  return `Fontsource fonts (${shown.length} shown):\n` +
    shown.map((f, i) => `${i + 1}. ${f.id ?? f.family ?? 'unknown'}`).join('\n');
}

// ---- muxF tools:
const FONTS = 'https://api.fontsource.org/v1/fonts'

interface FontRow {
  id?: string
  family?: string
  subsets?: string[]
  weights?: number[]
  styles?: string[]
  defSubset?: string
  variable?: boolean
  lastModified?: string
  category?: string
  license?: string
  type?: string
  source?: string
  npmVersion?: string
  version?: string
  unicodeRange?: Record<string, string>
  variants?: Record<string, unknown>
}

function bound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

async function catalogue(): Promise<FontRow[]> {
  const res = await fetch(FONTS, {
    headers: { 'User-Agent': 'mrfentmen-fontsource-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`Fontsource returned ${res.status}`)
  const rows = (await res.json()) as FontRow[]
  if (!Array.isArray(rows) || !rows.length) throw new Error('Fontsource returned no fonts.')
  return rows
}

function or(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : 'not reported'
}

function tally<T>(map: Map<T, number>, cap: number): string {
  if (!map.size) return 'not reported'
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, cap)
    .map(([k, n]) => `${k} ${n}`)
    .join(', ')
}

/** Which fonts carry a given language or script subset, and which of the catalogue do not. */
export async function subsetFinder(args: { subset?: string; limit?: number }): Promise<string> {
  const subset = (args.subset ?? '').trim().toLowerCase()
  if (!subset) return 'Provide a subset name, for example cyrillic, arabic, greek, vietnamese or devanagari.'
  const limit = bound(args.limit, 1, 60, 20)
  const rows = await catalogue()
  const hits = rows.filter((f) => (f.subsets ?? []).map((s) => s.toLowerCase()).includes(subset))
  const known = new Set<string>()
  for (const f of rows) for (const s of f.subsets ?? []) known.add(s.toLowerCase())
  if (!known.has(subset)) {
    return `"${subset}" is not a subset any Fontsource font names. The catalogue names ${known.size} distinct subsets, including ${[...known].sort().slice(0, 24).join(', ')}.`
  }
  const categories = new Map<string, number>()
  for (const f of hits) categories.set(or(f.category), (categories.get(or(f.category)) ?? 0) + 1)
  const variable = hits.filter((f) => f.variable).length
  const families = hits.filter((f) => f.family !== f.id)
  return [
    `Fonts carrying the "${subset}" subset: ${hits.length} of ${rows.length} (${((hits.length / rows.length) * 100).toFixed(1)}%)`,
    `Not carrying it: ${rows.length - hits.length}`,
    `Variable among them: ${variable} of ${hits.length}`,
    `Categories: ${tally(categories, 8)}`,
    `Fonts with a display name different from their id: ${families.length}`,
    ...hits.slice(0, limit).map((f, i) => `${i + 1}. ${f.id}${f.family && f.family !== f.id ? ` (${f.family})` : ''} | ${or(f.category)} | ${or(f.license)} | variable ${f.variable ? 'yes' : 'no'}`),
    hits.length > limit ? `... and ${hits.length - limit} more font(s).` : '',
    `Install one with: npm add @fontsource/${hits[0]?.id ?? '<font id>'}`,
  ].join('\n')
}
