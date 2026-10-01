const UA = 'mrfentmen-repology-mcp/1.0';
const BASE = 'https://repology.org/api/v1';

export interface ProjectArgs {
  name: string;
}
export interface PatternArgs {
  pattern: string;
}

export async function project(args: ProjectArgs): Promise<string> {
  const name = String(args.name).trim().toLowerCase();
  if (!name) throw new Error('Provide a package name.');
  const res = await fetch(`${BASE}/project/${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Repology returned ${res.status}`);
  const d = (await res.json()) as Array<{ repo?: string; version?: string; status?: string; newest?: string; family?: string }> | { error?: string };
  if (!Array.isArray(d)) throw new Error(`Repology: ${(d as { error?: string }).error ?? 'unknown'}`);
  if (!d.length) return `No packages found for "${args.name}".`;
  const byRepo = d.slice(0, 15).map((p) => `* ${p.repo ?? '?'}: ${p.version ?? '?'} [${p.status ?? '?'}]${p.newest ? ` (newest ${p.newest})` : ''}`);
  return `Repology "${args.name}" (${d.length} repos):\n` + byRepo.join('\n');
}

export async function projects(args: PatternArgs): Promise<string> {
  const pattern = String(args.pattern).trim();
  if (!pattern) throw new Error('Provide a pattern.');
  const res = await fetch(`${BASE}/projects/?pattern=${encodeURIComponent(pattern)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Repology returned ${res.status}`);
  const d = (await res.json()) as Array<{ name?: string; num_repos?: number; num_families?: number; num_packages?: number }> | { error?: string };
  if (!Array.isArray(d)) throw new Error(`Repology: ${(d as { error?: string }).error ?? 'unknown'}`);
  if (!d.length) return `No projects matching "${args.pattern}".`;
  return `Projects matching "${args.pattern}" (${d.length}):\n` + d.slice(0, 15).map((p, i) => `${i + 1}. ${p.name ?? '?'} (${p.num_repos ?? 0} repos, ${p.num_families ?? 0} families)`).join('\n');
}
