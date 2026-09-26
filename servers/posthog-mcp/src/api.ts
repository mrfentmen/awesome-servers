export class PosthogError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PosthogError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  return (process.env.POSTHOG_BASE_URL ?? "https://us.posthog.com").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const k = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!k) throw new PosthogError("Set POSTHOG_PERSONAL_API_KEY (PostHog personal key).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new PosthogError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new PosthogError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function me(): Promise<string> {
  return get("/api/users/@me/");
}

export function listProjects(): Promise<string> {
  return get("/api/projects/");
}

export function listInsights(projectId: string): Promise<string> {
  return get(`/api/projects/${encodeURIComponent(projectId)}/insights/?limit=20`);
}

