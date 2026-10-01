const UA = 'mrfentmen-gitea-mcp/1.0';
const BASE = 'https://gitea.com/api/v1';

export interface SearchArgs {
  query: string;
  limit?: number;
}
export interface RepoArg {
  owner: string;
  repo: string;
}

export async function searchRepos(args: SearchArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
  const res = await fetch(`${BASE}/repos/search?q=${encodeURIComponent(args.query)}&limit=${limit}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Gitea returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<{ full_name?: string; description?: string; stars_count?: number; forks_count?: number; language?: string; updated_at?: string; html_url?: string }> };
  const repos = d.data ?? [];
  if (!repos.length) return `No repos matching "${args.query}".`;
  return `Gitea repos matching "${args.query}" (${repos.length}):\n` + repos.slice(0, limit).map((r, i) => `${i + 1}. ${r.full_name ?? '?'} | ${r.language ?? '?'} | ${r.stars_count ?? 0} stars | ${r.forks_count ?? 0} forks\n   ${(r.description ?? '').slice(0, 120)}`).join('\n');
}

export async function repoDetail(args: RepoArg): Promise<string> {
  const res = await fetch(`${BASE}/repos/${encodeURIComponent(args.owner)}/${encodeURIComponent(args.repo)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Gitea returned ${res.status}`);
  const d = (await res.json()) as { full_name?: string; description?: string; stars_count?: number; forks_count?: number; open_issues_count?: number; language?: string; default_branch?: string; updated_at?: string; html_url?: string };
  if (!d.full_name) throw new Error('No repo returned.');
  return `Repo ${d.full_name}\n${d.description ?? 'No description'}\nLanguage: ${d.language ?? '?'} | Default branch: ${d.default_branch ?? '?'}\nStars: ${d.stars_count ?? 0} | Forks: ${d.forks_count ?? 0} | Open issues: ${d.open_issues_count ?? 0}\nUpdated: ${d.updated_at ?? '?'}\n${d.html_url ?? ''}`;
}

// ---- muxC tools:

interface GiteaUser {
  id?: number
  login?: string
  full_name?: string
  email?: string
  avatar_url?: string
  html_url?: string
  followers?: number
  following?: number
  starred_repos_count?: number
  language?: string
  last_login?: string
  created?: string
  restricted?: boolean
  active?: boolean
}

