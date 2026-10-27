export class FigmaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FigmaError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.FIGMA_ACCESS_TOKEN;
  if (!k) throw new FigmaError("Set FIGMA_ACCESS_TOKEN (Figma personal token).");
  return { ...UA, Accept: "application/json", "X-Figma-Token": k };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.figma.com/v1" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new FigmaError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new FigmaError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function me(): Promise<string> {
  return get("/me");
}

export function getFile(fileKey: string): Promise<string> {
  return get(`/files/${encodeURIComponent(fileKey)}`);
}

export function projectFiles(projectId: string): Promise<string> {
  return get(`/projects/${encodeURIComponent(projectId)}/files`);
}



export function teamProjects(teamId: string): Promise<string> {
  return get(`/teams/${encodeURIComponent(teamId)}/projects`);
}

export function fileComments(fileKey: string): Promise<string> {
  return get(`/files/${encodeURIComponent(fileKey)}/comments`);
}

export function fileVersions(fileKey: string): Promise<string> {
  return get(`/files/${encodeURIComponent(fileKey)}/versions`);
}

export function fileComponents(fileKey: string): Promise<string> {
  return get(`/files/${encodeURIComponent(fileKey)}/components`);
}

export function fileStyles(fileKey: string): Promise<string> {
  return get(`/files/${encodeURIComponent(fileKey)}/styles`);
}

export function fileNodes(fileKey: string, nodeIds: string): Promise<string> {
  return get(`/files/${encodeURIComponent(fileKey)}/nodes?ids=${encodeURIComponent(nodeIds)}`);
}

export function fileImages(fileKey: string, nodeIds: string): Promise<string> {
  return get(`/files/${encodeURIComponent(fileKey)}/images?ids=${encodeURIComponent(nodeIds)}&format=png`);
}
