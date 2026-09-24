const UA = 'mrfentmen-workable-mcp/1.0';

export async function boards(_args?: unknown): Promise<string> {
  // Workable doesn't list boards globally; document known format.
  return 'Workable public boards are per-company. Provide a board account name to list jobs, e.g. jobs({ board: "facebook" }).';
}

export interface JobsArgs {
  board: string;
}

export async function jobs(args: JobsArgs): Promise<string> {
  const board = (args.board ?? '').trim();
  if (!board) return 'Provide a board account name.';
  const res = await fetch(`https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(board)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Workable returned ${res.status}`);
  const d = (await res.json()) as { name?: string; jobs?: Array<{ title?: string; shortlink?: string; country?: string; city?: string; department?: string }> };
  const jobs = d.jobs ?? [];
  if (!jobs.length) return `No jobs for board "${board}".`;
  return `Workable board "${d.name ?? board}" (${jobs.length} jobs):\n` +
    jobs.slice(0, 20).map((j, i) => `${i + 1}. ${j.title ?? '?'} [${j.department ?? ''}] ${j.city ?? j.country ?? ''}`.trim()).join('\n');
}
