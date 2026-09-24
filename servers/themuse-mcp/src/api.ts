const UA = 'mrfentmen-themuse-mcp/1.0';

export interface JobsArgs {
  page?: number;
  limit?: number;
}

export async function jobs(args: JobsArgs): Promise<string> {
  const page = Math.max(Number(args?.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
  const res = await fetch(`https://www.themuse.com/api/public/jobs?page=${page}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`The Muse returned ${res.status}`);
  const d = (await res.json()) as { page_count?: number; results?: Array<{ name?: string; company?: { name?: string }; locations?: Array<{ name?: string }>; levels?: Array<{ name?: string }>; publication_date?: string }> };
  const list = d.results ?? [];
  if (!list.length) return `No Muse jobs on page ${page}.`;
  return `The Muse jobs (page ${page} of ${d.page_count ?? '?'}, showing ${Math.min(limit, list.length)}):\n` +
    list.slice(0, limit).map((j, i) => `${i + 1}. ${j.name ?? '?'} at ${j.company?.name ?? '?'} | ${(j.locations ?? []).map((l) => l.name).join(', ') || 'remote?'} | ${(j.levels ?? []).map((l) => l.name).join(', ') || 'any level'} | posted ${String(j.publication_date ?? '?').slice(0, 10)}`).join('\n');
}
