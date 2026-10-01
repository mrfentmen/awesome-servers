export class GithubError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GithubError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.GITHUB_TOKEN;
  if (!k) throw new GithubError("Set GITHUB_TOKEN (free GitHub PAT).");
  return { ...UA, Accept: "application/vnd.github+json", Authorization: `Bearer ${k}`, "X-GitHub-Api-Version": "2022-11-28" };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.github.com" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new GithubError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new GithubError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function me(): Promise<string> {
  return get("/user");
}

export function listRepos(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/user/repos?per_page=${n}&sort=updated`);
}

export function getRepo(owner: string, repo: string): Promise<string> {
  return get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
}

export function searchRepos(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/search/repositories?q=${encodeURIComponent(query)}&per_page=${n}`);
}



export function userIssues(): Promise<string> {
  return get("/user/issues?per_page=20&state=open");
}

export function repoIssues(owner: string, repo: string): Promise<string> {
  return get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?per_page=20&state=open`);
}

export function repoPulls(owner: string, repo: string): Promise<string> {
  return get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?per_page=20&state=open`);
}

export function repoCommits(owner: string, repo: string): Promise<string> {
  return get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=10`);
}

export function getUser(username: string): Promise<string> {
  return get(`/users/${encodeURIComponent(username)}`);
}

export function searchCode(query: string): Promise<string> {
  return get(`/search/code?q=${encodeURIComponent(query)}&per_page=10`);
}

export function listWorkflows(owner: string, repo: string): Promise<string> {
  return get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows?per_page=20`);
}

// ---- muxG tools:
const GH_PUB = 'https://api.github.com'

type GhRow = Record<string, unknown>

interface GhRelease {
  tag_name?: string
  name?: string
  draft?: boolean
  prerelease?: boolean
  published_at?: string
  html_url?: string
  body?: string
  assets?: Array<{ name?: string; size?: number; download_count?: number }>
}

interface GhContributor {
  login?: string
  contributions?: number
  type?: string
  html_url?: string
}

/** Public endpoints, so a release or contributor lookup works without a token. */
async function ghPublic<T>(path: string): Promise<T> {
  const res = await fetch(`${GH_PUB}${path}`, {
    headers: { ...UA, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new Error('GitHub has nothing at that path (404).')
  if (res.status === 403) throw new Error('GitHub refused the request (403) - the unauthenticated rate limit of 60 an hour is small.')
  if (!res.ok) throw new Error(`GitHub returned ${res.status}.`)
  const body = await res.text()
  if (!body.trim()) throw new Error('GitHub returned an empty body.')
  return JSON.parse(body) as T
}

function ownerRepo(owner: string, repo: string): string {
  const o = (owner ?? '').trim()
  const r = (repo ?? '').trim()
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(o)) throw new Error(`"${owner}" is not a valid owner or organisation name.`)
  if (!/^[A-Za-z0-9._-]{1,120}$/.test(r)) throw new Error(`"${repo}" is not a valid repository name.`)
  return `${encodeURIComponent(o)}/${encodeURIComponent(r)}`
}

export async function repoReleases(args: { owner: string; repo: string; limit?: string }): Promise<string> {
  const slug = ownerRepo(args.owner, args.repo)
  const limit = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), 20)
  const rows = await ghPublic<GhRelease[]>(`/repos/${slug}/releases?per_page=${limit}`)
  if (!Array.isArray(rows)) throw new Error('GitHub did not return a release list.')
  if (!rows.length) return `${slug} has no published releases.`
  const drafts = rows.filter((r) => r.draft === true).length
  const lines = [
    `${slug}: ${rows.length} release(s) returned${drafts ? `, ${drafts} of them a draft` : ''}`,
  ]
  for (const [i, row] of rows.slice(0, limit).entries()) {
    const flags = [row.draft ? 'draft' : '', row.prerelease ? 'prerelease' : ''].filter(Boolean).join(', ') || 'stable'
    lines.push(`  ${i + 1}. ${row.tag_name ?? 'tag not reported'} — ${row.name || '(no release name)'} [${flags}]`)
    lines.push(`     published ${row.published_at ?? 'not reported'}`)
    if (row.body) lines.push(`     ${String(row.body).replace(/\r+/g, ' ').slice(0, 300)}`)
    const assets = row.assets ?? []
    if (assets.length) {
      lines.push(`     assets: ${assets.slice(0, 5).map((a) => `${a.name ?? '?'} (${a.download_count ?? 0} downloads)`).join(', ')}`)
    }
    if (row.html_url) lines.push(`     ${row.html_url}`)
  }
  return lines.join('\n')
}

export async function repoContributors(args: { owner: string; repo: string; limit?: string }): Promise<string> {
  const slug = ownerRepo(args.owner, args.repo)
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 50)
  const rows = await ghPublic<GhContributor[]>(`/repos/${slug}/contributors?per_page=${limit}&anon=0`)
  if (!Array.isArray(rows)) throw new Error('GitHub did not return a contributor list.')
  if (!rows.length) return `${slug} reports no contributors on its contributor list.`
  const shown = rows.slice(0, limit)
  const total = shown.reduce((sum, row) => sum + (Number(row.contributions) || 0), 0)
  const share = total ? ((Number(shown[0].contributions) || 0) / total) * 100 : 0
  const lines = [
    `${slug}: ${shown.length} contributor(s) on the first page, ${total.toLocaleString()} commits between them`,
    `Top contributor holds ${share.toFixed(1)}% of those commits.`,
  ]
  for (const [i, row] of shown.entries()) {
    lines.push(`  ${i + 1}. ${row.login ?? 'login not reported'} (${row.type ?? 'type not reported'}) — ${(row.contributions ?? 0).toLocaleString()} commits`)
  }
  if (rows.length >= limit) lines.push(`  GitHub returned a full page, so more contributors may exist beyond the first ${limit}.`)
  return lines.join('\n')
}
