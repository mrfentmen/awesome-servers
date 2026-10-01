const UA = 'mrfentmen-nasa-tle-mcp/1.0';
const BASE = 'https://tle.ivanstanojevic.me/api/tle';

export interface SatIdArg {
  satid: number;
}
export interface SearchArg {
  query: string;
}

export async function satellite(args: SatIdArg): Promise<string> {
  const res = await fetch(`${BASE}/${encodeURIComponent(String(args.satid))}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`TLE API returned ${res.status}`);
  const d = (await res.json()) as { satelliteId?: number; name?: string; date?: string; line1?: string; line2?: string };
  if (!d.name) throw new Error(`No satellite for id ${args.satid}.`);
  return `Satellite ${d.satelliteId ?? args.satid}: ${d.name}\nEpoch: ${d.date ?? '?'}\n${d.line1 ?? ''}\n${d.line2 ?? ''}`;
}

export async function search(args: SearchArg): Promise<string> {
  const res = await fetch(`${BASE}?search=${encodeURIComponent(args.query)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`TLE API returned ${res.status}`);
  const d = (await res.json()) as { member?: Array<{ satelliteId?: number; name?: string }> };
  const list = d.member ?? [];
  if (!list.length) return `No satellites matching "${args.query}".`;
  return `Satellites matching "${args.query}" (${list.length}):\n` + list.slice(0, 15).map((s) => `* ${s.satelliteId ?? '?'} - ${s.name ?? '?'}`).join('\n');
}

// ---- muxQ tools:
// The upstream TLE catalog (tle.ivanstanojevic.me) is a hydra collection: it
// reports totalItems and accepts page / page-size / sort / sort-dir. None of
// that is reachable through the two tools this server shipped with, and the raw
// two-line element sets are not decoded anywhere. These three tools expose it.
const TLE_LIST = 'https://tle.ivanstanojevic.me/api/tle';
const TLE_UA = 'mrfentmen-nasa-tle-mcp/1.1';
const TLE_PAGE_MAX = 50;
const TLE_SORTS = ['popularity', 'name'] as const;

interface TleRow {
  satelliteId?: number;
  name?: string;
  date?: string;
  line1?: string;
  line2?: string;
}

interface TleCollection {
  totalItems?: number;
  member?: TleRow[];
}

function clampInt(value: number | undefined, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.min(max, Math.max(min, n));
}

async function tleFetch(path: string): Promise<TleCollection> {
  const res = await fetch(path, {
    headers: { 'User-Agent': TLE_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`TLE API returned ${res.status}`);
  const raw = (await res.json()) as { response?: { message?: string } } & TleCollection;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('TLE API returned an unexpected body.');
  if (raw.response?.message) throw new Error(`TLE API rejected the request: ${raw.response.message}`);
  return raw;
}

export interface CatalogPageArgs {
  page?: number;
  pageSize?: number;
  sort?: string;
  direction?: string;
}

/** Walks the whole catalog, one page at a time, newest numbers included. */
export async function browseCatalog(args: CatalogPageArgs): Promise<string> {
  const page = clampInt(args.page, 1, 1, 10000);
  const size = clampInt(args.pageSize, 20, 1, TLE_PAGE_MAX);
  const sort = TLE_SORTS.includes((args.sort ?? '') as (typeof TLE_SORTS)[number]) ? (args.sort as string) : 'popularity';
  const dir = (args.direction ?? '').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const data = await tleFetch(`${TLE_LIST}/?page=${page}&page-size=${size}&sort=${sort}&sort-dir=${dir}`);
  const list = data.member ?? [];
  const total = typeof data.totalItems === 'number' ? data.totalItems : 0;
  const pages = size > 0 ? Math.ceil(total / size) : 0;
  const head = `TLE catalog page ${page} of ${pages} (${total} objects, ${sort} ${dir})\n`;
  if (!list.length) return `${head}No objects on this page.`;
  return head + list.map((s) => `* ${s.satelliteId ?? 'not reported'} - ${s.name ?? 'not reported'}`).join('\n');
}

function column(line: string, from: number, to: number): string {
  return line.slice(from - 1, to);
}

function impliedExponential(field: string): number | null {
  const text = field.trim();
  if (!text) return null;
  const match = /^([+-]?)(\d+)([+-]\d+)?$/.exec(text);
  if (!match) return null;
  const value = Number.parseFloat(`0.${match[2]}`);
  if (!Number.isFinite(value)) return null;
  return (match[1] === '-' ? -value : value) * 10 ** Number.parseInt(match[3] ?? '0', 10);
}

function epochToIso(field: string): string | null {
  const text = field.trim();
  const match = /^(\d{2})(\d{3}\.\d+)$/.exec(text);
  if (!match) return null;
  const year = 2000 + Number.parseInt(match[1], 10);
  const dayOfYear = Number.parseFloat(match[2]);
  if (!Number.isFinite(dayOfYear)) return null;
  const start = Date.UTC(year, 0, 1);
  const date = new Date(start + (dayOfYear - 1) * 86_400_000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().replace('.000Z', 'Z');
}

export interface ElementsArgs {
  satid: number;
}

export interface FleetArgs {
  query: string;
  limit?: number;
}

