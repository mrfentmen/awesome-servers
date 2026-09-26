export class GitlabError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GitlabError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  return (process.env.GITLAB_BASE_URL ?? "https://gitlab.com/api/v4").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const k = process.env.GITLAB_PRIVATE_TOKEN;
  if (!k) throw new GitlabError("Set GITLAB_PRIVATE_TOKEN (GitLab PAT).");
  return { ...UA, Accept: "application/json", "PRIVATE-TOKEN": k };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new GitlabError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new GitlabError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function me(): Promise<string> {
  return get("/user");
}

export function listProjects(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/projects?membership=true&per_page=${n}&order_by=last_activity_at`);
}

export function listGroups(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/groups?per_page=${n}`);
}

export async function searchPublic(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  let res: Response;
  try {
    res = await fetch(`${base()}/projects?search=${encodeURIComponent(query)}&per_page=${n}&order_by=last_activity_at`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new GitlabError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new GitlabError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

