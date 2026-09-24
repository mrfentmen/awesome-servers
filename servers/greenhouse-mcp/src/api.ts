const UA = 'mrfentmen-greenhouse-mcp/1.0';

export interface JobsArgs {
  board: string;
}

export async function jobs(args: JobsArgs): Promise<string> {
  const board = (args.board ?? '').trim();
  if (!board) return 'Provide a board token like example.';
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Greenhouse returned ${res.status}`);
  const d = (await res.json()) as { jobs?: Array<{ title?: string; location?: { name?: string }; absolute_url?: string; updated_at?: string; employment_type?: string }> };
  const list = d.jobs ?? [];
  if (!list.length) return `No Greenhouse jobs for board "${board}".`;
  return `Greenhouse jobs for "${board}" (${list.length}):\n` +
    list.slice(0, 15).map((j, i) => `${i + 1}. ${j.title ?? '?'} | ${j.location?.name ?? '?'} | ${j.employment_type ?? '?'} | updated ${String(j.updated_at ?? '?').slice(0, 10)}`).join('\n');
}
