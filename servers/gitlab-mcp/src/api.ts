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



export function listIssues(): Promise<string> {
  return get("/issues?scope=all&per_page=20&state=opened");
}

export function listMergeRequests(): Promise<string> {
  return get("/merge_requests?scope=all&per_page=20&state=opened");
}

export function projectDetails(projectId: string): Promise<string> {
  return get(`/projects/${encodeURIComponent(projectId)}`);
}

export function projectPipelines(projectId: string): Promise<string> {
  return get(`/projects/${encodeURIComponent(projectId)}/pipelines?per_page=10`);
}

export function groupProjects(groupId: string): Promise<string> {
  return get(`/groups/${encodeURIComponent(groupId)}/projects?per_page=20`);
}

export function renderMarkdown(markdown: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch(base() + "/markdown", {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ text: markdown.slice(0, 2000) }),
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new GitlabError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new GitlabError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 4000);
  })();
}

export function publicSnippets(): Promise<string> {
  return get("/snippets/public?per_page=10");
}
