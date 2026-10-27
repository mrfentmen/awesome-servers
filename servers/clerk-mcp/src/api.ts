export class ClerkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ClerkError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.CLERK_SECRET_KEY;
  if (!k) throw new ClerkError("Set CLERK_SECRET_KEY (Clerk dashboard).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.clerk.com/v1" + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new ClerkError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new ClerkError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listUsers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/users?limit=${n}`);
}

export function getUser(userId: string): Promise<string> {
  return get(`/users/${encodeURIComponent(userId)}`);
}

