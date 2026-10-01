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
      signal: AbortSignal.timeout(30000),
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

// ---- muxH tools:
// Rollbar records what broke. The question that always follows is whether it
// broke because of a known vulnerable dependency, and OSV answers that
// keylessly across every ecosystem, with the exact version ranges affected.

interface OsvAffected {
  package?: { name?: string; ecosystem?: string; purl?: string }
  ranges?: Array<{ type?: string; events?: Array<{ introduced?: string; fixed?: string; last_affected?: string }> }>
  versions?: string[]
  database_specific?: Record<string, unknown>
  ecosystem_specific?: Record<string, unknown>
}

interface OsvVuln {
  id?: string
  aliases?: string[]
  summary?: string
  details?: string
  published?: string
  modified?: string
  withdrawn?: string
  severity?: Array<{ type?: string; score?: string }>
  affected?: OsvAffected[]
  references?: Array<{ type?: string; url?: string }>
  database_specific?: Record<string, unknown>
}

