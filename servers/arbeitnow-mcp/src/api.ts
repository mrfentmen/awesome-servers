const UA = 'mrfentmen-arbeitnow-mcp/1.0';

export interface JobsArgs {
  limit?: number;
}

export async function jobs(args: JobsArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
  const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Arbeitnow returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<{ slug?: string; company_name?: string; title?: string; location?: string; remote?: boolean; tags?: string[]; created_at?: string }> };
  const list = d.data ?? [];
  if (!list.length) return 'No Arbeitnow jobs returned.';
  return `Arbeitnow jobs (${list.length} total, showing ${Math.min(limit, list.length)}):\n` +
    list.slice(0, limit).map((j, i) => `${i + 1}. ${j.title ?? '?'} at ${j.company_name ?? '?'} | ${j.location ?? '?'}${j.remote ? ' (remote)' : ''} | ${(j.tags ?? []).slice(0, 3).join(', ') || '?'} | posted ${String(j.created_at ?? '?').slice(0, 10)}`).join('\n');
}
