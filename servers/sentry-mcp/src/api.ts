export class SentryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SentryError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.SENTRY_AUTH_TOKEN;
  if (!k) throw new SentryError("Set SENTRY_AUTH_TOKEN (Sentry auth token).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://sentry.io/api/0" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new SentryError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new SentryError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listOrgs(): Promise<string> {
  return get("/organizations/");
}

export function orgProjects(org: string): Promise<string> {
  return get(`/organizations/${encodeURIComponent(org)}/projects/`);
}

export function orgIssues(org: string): Promise<string> {
  return get(`/organizations/${encodeURIComponent(org)}/issues/?statsPeriod=24h`);
}

