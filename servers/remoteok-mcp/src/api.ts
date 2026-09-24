const BASE = 'https://remoteok.com/api';
const UA = 'mrfentmen-remoteok-mcp/1.0';

export interface JobsArgs {
  limit?: number;
}

export interface SearchArgs {
  query: string;
  limit?: number;
}

interface Job {
  id?: string;
  company?: string;
  position?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  tags?: string[];
  date?: string;
  url?: string;
}

export async function jobs(args: JobsArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
  const res = await fetch(`${BASE}?tags=`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`RemoteOK returned ${res.status}`);
  const d = (await res.json()) as Job[];
  if (!Array.isArray(d) || !d.length) return 'No jobs returned.';
  const list = d.slice(1, limit + 1);
  return `RemoteOK jobs (latest ${list.length}):\n` +
    list.map((j, i) => `${i + 1}. ${j.position ?? '?'} @ ${j.company ?? '?'} - ${j.salary_max ? `$${j.salary_min ?? '?'}-$${j.salary_max} ` : ''}${(j.tags ?? []).slice(0, 4).join(', ')}`.trim()).join('\n');
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 25);
  const res = await fetch(`${BASE}?tags=${encodeURIComponent(query)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`RemoteOK returned ${res.status}`);
  const d = (await res.json()) as Job[];
  if (!Array.isArray(d) || !d.length) return `No jobs for "${query}".`;
  const list = d.slice(1, limit + 1);
  return `RemoteOK jobs tagged "${query}" (${list.length}):\n` +
    list.map((j, i) => `${i + 1}. ${j.position ?? '?'} @ ${j.company ?? '?'} - ${(j.tags ?? []).slice(0, 4).join(', ')}`.trim()).join('\n');
}
