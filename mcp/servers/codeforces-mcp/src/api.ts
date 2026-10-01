const UA = 'mrfentmen-codeforces-mcp/1.0';
const BASE = 'https://codeforces.com/api';

export interface LimitArg {
  limit?: number;
}
export interface UserArg {
  handle: string;
}

export async function contests(args: LimitArg): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
  const res = await fetch(`${BASE}/contest.list?gym=false`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Codeforces returned ${res.status}`);
  const d = (await res.json()) as { status?: string; result?: Array<{ id?: number; name?: string; type?: string; phase?: string; startTimeSeconds?: number; durationSeconds?: number }> };
  if (d.status !== 'OK' || !d.result) throw new Error(`Codeforces error: ${d.status ?? 'unknown'}`);
  const upcoming = d.result.filter((c) => c.phase === 'BEFORE').slice(0, limit);
  const finished = d.result.filter((c) => c.phase === 'FINISHED').slice(0, limit);
  const fmt = (c: { name?: string; startTimeSeconds?: number; durationSeconds?: number }) => `* ${c.name ?? '?'} | starts ${new Date((c.startTimeSeconds ?? 0) * 1000).toISOString()} | ${Math.round((c.durationSeconds ?? 0) / 60)} min`;
  return `Codeforces contests:\nUpcoming (${upcoming.length}):\n${upcoming.map(fmt).join('\n') || 'none'}\nRecent finished (${finished.length}):\n${finished.map(fmt).join('\n') || 'none'}`;
}

export async function user(args: UserArg): Promise<string> {
  const res = await fetch(`${BASE}/user.info?handles=${encodeURIComponent(args.handle)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Codeforces returned ${res.status}`);
  const d = (await res.json()) as { status?: string; result?: Array<{ handle?: string; rating?: number; maxRating?: number; rank?: string; maxRank?: string; organization?: string; country?: string; contribution?: number; lastOnlineTimeSeconds?: number }> };
  const u = d.result?.[0];
  if (d.status !== 'OK' || !u) throw new Error(`User ${args.handle} not found.`);
  return `User ${u.handle ?? args.handle}\nRank: ${u.rank ?? 'unrated'} (max ${u.maxRank ?? 'unrated'} ${u.maxRating ?? 0})\nRating: ${u.rating ?? 'unrated'} (max ${u.maxRating ?? 0})\nCountry: ${u.country ?? '?'} | Org: ${u.organization ?? '?'}\nContribution: ${u.contribution ?? 0}\nLast seen: ${new Date((u.lastOnlineTimeSeconds ?? 0) * 1000).toISOString()}`;
}

// ---- muxA tools:

async function cf<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Codeforces returned ${res.status}`);
  const d = (await res.json()) as { status?: string; comment?: string; result?: T };
  if (d.status !== 'OK' || d.result == null) {
    throw new Error(`Codeforces error: ${d.comment ?? d.status ?? 'unknown'}`);
  }
  return d.result;
}

function bound(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

function stamp(seconds: unknown): string {
  const n = Number(seconds);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString().slice(0, 10) : 'not reported';
}

export interface ProblemArgs {
  query?: string;
  tag?: string;
  minRating?: number;
  maxRating?: number;
  limit?: number;
}

export async function problemList(args: ProblemArgs): Promise<string> {
  const limit = bound(args.limit, 20, 100);
  const q = (args.query ?? '').trim().toLowerCase();
  const tag = (args.tag ?? '').trim().toLowerCase();
  const min = Number.isFinite(args.minRating) ? Number(args.minRating) : undefined;
  const max = Number.isFinite(args.maxRating) ? Number(args.maxRating) : undefined;

  const result = await cf<{
    problems?: Array<{
      contestId?: number;
      problemsetName?: string;
      index?: string;
      name?: string;
      type?: string;
      points?: number;
      rating?: number;
      tags?: string[];
    }>;
  }>('/problemset.problems');

  const all = result.problems ?? [];
  const matched = all.filter((p) => {
    if (q && !(p.name ?? '').toLowerCase().includes(q)) return false;
    if (tag && !(p.tags ?? []).some((t) => t.toLowerCase() === tag)) return false;
    if (min != null && (typeof p.rating !== 'number' || p.rating < min)) return false;
    if (max != null && (typeof p.rating !== 'number' || p.rating > max)) return false;
    return true;
  });
  if (!matched.length) {
    const filters = [
      q ? `name containing "${q}"` : '',
      tag ? `tag "${tag}"` : '',
      min != null ? `rating at least ${min}` : '',
      max != null ? `rating at most ${max}` : '',
    ].filter(Boolean);
    return `No problem in the Codeforces archive matches ${filters.join(' and ')} (the archive holds ${all.length}).`;
  }
  const shown = matched.slice(0, limit);
  return [
    `${matched.length} of ${all.length} archived problem(s) match, showing ${shown.length}.`,
    ...shown.map((p, i) => {
      const where = p.problemsetName ?? `contest ${p.contestId ?? '?'}`;
      return `${i + 1}. ${where} ${p.index ?? '?'} | ${p.name ?? 'untitled'}` +
        ` | rating ${p.rating ?? 'unrated'}${p.points ? ` | ${p.points} pts` : ''}` +
        `${p.type && p.type !== 'PROGRAMMING' ? ` | ${p.type}` : ''}` +
        `${p.tags?.length ? ` | ${p.tags.join(', ')}` : ''}`;
    }),
    matched.length > shown.length ? `...and ${matched.length - shown.length} more. Narrow the filters to see them.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export interface RatingArgs {
  handle: string;
  limit?: number;
}

export interface SubmissionArgs {
  handle: string;
  count?: number;
  verdict?: string;
}

function cleanVerdict(value: unknown): string {
  const v = value != null ? String(value) : 'UNKNOWN';
  const known: Record<string, string> = {
    OK: 'ACCEPTED',
    WRONG_ANSWER: 'WRONG ANSWER',
    TIME_LIMIT_EXCEEDED: 'TIME LIMIT EXCEEDED',
    MEMORY_LIMIT_EXCEEDED: 'MEMORY LIMIT EXCEEDED',
    IDLENESS_LIMIT_EXCEEDED: 'IDLENESS LIMIT EXCEEDED',
    RUNTIME_ERROR: 'RUNTIME ERROR',
    COMPILATION_ERROR: 'COMPILATION ERROR',
    PRESENTATION_ERROR: 'PRESENTATION ERROR',
    PARTIAL: 'PARTIAL',
    CRASHED: 'CRASHED',
    REJECTED: 'REJECTED',
    SKIPPED: 'SKIPPED',
    TESTING: 'TESTING',
    CHALLENGED: 'CHALLENGED',
  };
  return known[v] ?? v;
}
