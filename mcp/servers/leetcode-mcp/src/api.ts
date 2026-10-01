const UA = 'mrfentmen-leetcode-mcp/1.0';
const BASE = 'https://leetcode.com/api';

export interface DiffArg {
  difficulty?: string;
}
export interface SearchArg {
  query: string;
  limit?: number;
}

interface Problem {
  stat?: { question_id?: number; question__title?: string; question__title_slug?: string; total_acs?: number; total_submitted?: number };
  difficulty?: { level?: number };
  paid_only?: boolean;
  status?: string | null;
}

function levelName(l: number | undefined): string {
  return l === 1 ? 'Easy' : l === 2 ? 'Medium' : l === 3 ? 'Hard' : '?';
}

export async function problems(args: DiffArg): Promise<string> {
  const res = await fetch(`${BASE}/problems/all/`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`LeetCode returned ${res.status}`);
  const d = (await res.json()) as { num_total?: number; stat_status_pairs?: Problem[] };
  const pairs = d.stat_status_pairs ?? [];
  if (!pairs.length) throw new Error('No problems returned.');
  const level = args?.difficulty ? { easy: 1, medium: 2, hard: 3 }[String(args.difficulty).toLowerCase()] : undefined;
  let list = pairs;
  if (level) list = list.filter((p) => p.difficulty?.level === level);
  const solved = list.filter((p) => p.status === 'ac').length;
  const sample = list.slice(0, 8).map((p) => `* ${p.stat?.question_id ?? '?'}. ${p.stat?.question__title ?? '?'} [${levelName(p.difficulty?.level)}]${p.paid_only ? ' (premium)' : ''}`).join('\n');
  return `LeetCode problems (${d.num_total ?? pairs.length} total, ${list.length} in filter, ${solved} solved):\n${sample}\n...`;
}

export async function search(args: SearchArg): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 15);
  const res = await fetch(`${BASE}/problems/all/`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`LeetCode returned ${res.status}`);
  const d = (await res.json()) as { stat_status_pairs?: Problem[] };
  const pairs = d.stat_status_pairs ?? [];
  const q = String(args.query).toLowerCase();
  const hits = pairs.filter((p) => (p.stat?.question__title ?? '').toLowerCase().includes(q) || (p.stat?.question__title_slug ?? '').toLowerCase().includes(q)).slice(0, limit);
  if (!hits.length) return `No LeetCode problems matching "${args.query}".`;
  return `LeetCode problems matching "${args.query}" (${hits.length} shown):\n` + hits.map((p) => `* ${p.stat?.question_id ?? '?'}. ${p.stat?.question__title ?? '?'} [${levelName(p.difficulty?.level)}]${p.paid_only ? ' (premium)' : ''}`).join('\n');
}

// ---- muxC tools:

