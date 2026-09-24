const UA = 'mrfentmen-smartrecruiters-mcp/1.0';

export interface JobsArgs {
  company: string;
}

export async function jobs(args: JobsArgs): Promise<string> {
  const company = (args.company ?? '').trim();
  if (!company) return 'Provide a company id like example.';
  const res = await fetch(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`SmartRecruiters returned ${res.status}`);
  const d = (await res.json()) as { totalFound?: number; content?: Array<{ name?: string; location?: { city?: string; country?: string; region?: string }; releasedDate?: string; employmentType?: string }> };
  const list = d.content ?? [];
  if (!list.length) return `No SmartRecruiters postings for "${company}".`;
  const loc = (l: { city?: string; country?: string; region?: string } | undefined) => [l?.city, l?.region, l?.country].filter(Boolean).join(', ') || '?';
  return `SmartRecruiters postings for "${company}" (${d.totalFound ?? list.length} total, showing ${Math.min(10, list.length)}):\n` +
    list.slice(0, 10).map((j, i) => `${i + 1}. ${j.name ?? '?'} | ${loc(j.location)} | ${j.employmentType ?? '?'} | released ${String(j.releasedDate ?? '?').slice(0, 10)}`).join('\n');
}
