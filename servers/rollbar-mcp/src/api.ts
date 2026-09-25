export class RollbarError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RollbarError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function token(): string {
  const k = process.env.ROLLBAR_ACCESS_TOKEN;
  if (!k) throw new RollbarError("Set ROLLBAR_ACCESS_TOKEN (free Rollbar tier).");
  return k;
}

async function get(path: string): Promise<string> {
  const sep = path.includes("?") ? "&" : "?";
  let res: Response;
  try {
    res = await fetch(`https://api.rollbar.com/api/1${path}${sep}access_token=${encodeURIComponent(token())}`, {
      headers: { ...UA, Accept: "application/json" },
    });
  } catch (e) {
    throw new RollbarError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new RollbarError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listProjects(): Promise<string> {
  return get("/projects/");
}

export function listItems(projectId: string): Promise<string> {
  return get(`/projects/${encodeURIComponent(projectId)}/items/`);
}

export function getItem(projectId: string, itemId: string): Promise<string> {
  return get(`/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/`);
}

