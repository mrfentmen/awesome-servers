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

