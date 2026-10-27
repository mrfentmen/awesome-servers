export class VercelError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "VercelError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.VERCEL_TOKEN;
  if (!k) throw new VercelError("Set VERCEL_TOKEN (Vercel account token).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.vercel.com" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new VercelError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new VercelError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listProjects(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/v9/projects?limit=${n}`);
}

export function getProject(projectId: string): Promise<string> {
  return get(`/v9/projects/${encodeURIComponent(projectId)}`);
}

export function listDeployments(projectId?: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  const q = projectId ? `&projectId=${encodeURIComponent(projectId)}` : "";
  return get(`/v6/deployments?limit=${n}${q}`);
}



export function deploymentDetails(deployId: string): Promise<string> {
  return get(`/v13/deployments/${encodeURIComponent(deployId)}`);
}

export function listAliases(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/v4/aliases?limit=${n}`);
}

export function listDomains(): Promise<string> {
  return get("/v5/domains?limit=50");
}

export function domainInfo(domain: string): Promise<string> {
  return get(`/v5/domains/${encodeURIComponent(domain)}`);
}

export function listTeams(): Promise<string> {
  return get("/v2/teams?limit=20");
}

export function projectEnv(projectId: string): Promise<string> {
  return get(`/v9/projects/${encodeURIComponent(projectId)}/env`);
}

export function getAlias(alias: string): Promise<string> {
  return get(`/v4/aliases/${encodeURIComponent(alias)}`);
}
