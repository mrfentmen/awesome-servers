export class AppwriteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AppwriteError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.APPWRITE_ENDPOINT;
  if (!b) throw new AppwriteError("Set APPWRITE_ENDPOINT (e.g. https://cloud.appwrite.io/v1).");
  return b.replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const project = process.env.APPWRITE_PROJECT;
  const k = process.env.APPWRITE_API_KEY;
  if (!project || !k) throw new AppwriteError("Set APPWRITE_PROJECT and APPWRITE_API_KEY.");
  return { ...UA, Accept: "application/json", "X-Appwrite-Project": project, "X-Appwrite-Key": k };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new AppwriteError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new AppwriteError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listUsers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/users?queries[]=${encodeURIComponent(`limit(${n})`)}`);
}

export function listDatabases(): Promise<string> {
  return get("/databases");
}

