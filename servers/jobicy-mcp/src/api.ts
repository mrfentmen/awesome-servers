const UA = 'mrfentmen-jobicy-mcp/1.0';

export interface JobsArgs {
  limit?: number;
}

export async function jobs(args: JobsArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
  const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=${limit}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Jobicy returned ${res.status}`);
  const d = (await res.json()) as { jobs?: Array<{ jobTitle?: string; companyName?: string; jobGeo?: string; jobLevel?: string; jobIndustry?: string; pubDate?: string; url?: string }> };
  const list = d.jobs ?? [];
  if (!list.length) return 'No Jobicy jobs returned.';
  return `Jobicy remote jobs (${list.length}):\n` +
    list.slice(0, limit).map((j, i) => `${i + 1}. ${j.jobTitle ?? '?'} at ${j.companyName ?? '?'} | ${j.jobGeo ?? 'remote'} | ${j.jobLevel ?? 'any'} | ${j.jobIndustry ?? '?'} | posted ${String(j.pubDate ?? '?').slice(0, 10)}`).join('\n');
}
