const BASE = 'https://aur.archlinux.org/rpc/?v=5';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export interface InfoArgs {
  name: string;
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const res = await fetch(`${BASE}&type=search&arg=${encodeURIComponent(q)}`, {
    headers: { 'User-Agent': 'mrfentmen-aur-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`AUR returned ${res.status}`);
  const d = (await res.json()) as { resultcount?: number; results?: Array<Record<string, unknown>> };
  const rows = (d.results ?? []).slice(0, limit);
  if (!rows.length) return `No AUR packages found for "${q}".`;
  return `AUR packages for "${q}" (${d.resultcount ?? rows.length} total, ${rows.length} shown):\n` +
    rows
      .map((r, i) => {
        const s = (k: string) => (r[k] != null ? String(r[k]) : '');
        return `${i + 1}. ${s('Name')}${s('Version') ? ` ${s('Version')}` : ''}${s('Description') ? ` | ${s('Description').slice(0, 90)}` : ''}${s('NumVotes') ? ` | votes ${s('NumVotes')}` : ''}`;
      })
      .join('\n');
}

export async function info(args: InfoArgs): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) return 'Provide a package name.';
  const res = await fetch(`${BASE}&type=info&arg[]=${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': 'mrfentmen-aur-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`AUR returned ${res.status}`);
  const d = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const r = (d.results ?? [])[0];
  if (!r) return `No AUR package named ${name}.`;
  const s = (k: string) => (r[k] != null ? String(r[k]) : '');
  return [
    `${s('Name')} ${s('Version')}`,
    s('Description') ? `Desc: ${s('Description')}` : '',
    s('URL') ? `URL: ${s('URL')}` : '',
    s('Maintainer') ? `Maintainer: ${s('Maintainer')}` : '',
    s('NumVotes') ? `Votes: ${s('NumVotes')}` : '',
    s('OutOfDate') ? `Out of date: ${s('OutOfDate')}` : '',
  ].filter(Boolean).join('\n') || `No data for ${name}.`;
}

// ---- muxA tools:

const BY_FIELDS = new Set([
  'name', 'name-desc', 'maintainer', 'submitter', 'depends', 'checkdepends',
  'makedepends', 'optdepends', 'provides', 'conflicts', 'replaces', 'groups',
  'keywords', 'comaintainers',
]);

function bound(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

async function rpc<T>(query: string): Promise<T> {
  const res = await fetch(`${BASE}${query}`, {
    headers: { 'User-Agent': 'mrfentmen-aur-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`AUR returned ${res.status}`);
  return (await res.json()) as T;
}

function epochDate(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 'not reported';
  return new Date(n * 1000).toISOString().slice(0, 10);
}

export interface SuggestArgs {
  name: string;
}

export async function suggestNames(args: SuggestArgs): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) return 'Provide a package name.';
  const d = await rpc<string[]>(`&type=suggest&arg[]=${encodeURIComponent(name)}`);
  if (!Array.isArray(d) || !d.length) return `The AUR suggested no alternative names for ${name}.`;
  return `${d.length} name(s) the AUR suggests for "${name}":\n` + d.slice(0, 40).map((n, i) => `${i + 1}. ${n}`).join('\n');
}

export interface ByFieldArgs {
  query: string;
  by?: string;
  limit?: number;
}

export interface MaintainerArgs {
  maintainer: string;
  limit?: number;
}

