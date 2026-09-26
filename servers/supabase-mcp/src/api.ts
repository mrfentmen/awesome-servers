export class SupabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SupabaseError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.SUPABASE_URL;
  if (!b) throw new SupabaseError("Set SUPABASE_URL (project URL).");
  return b.replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const k = process.env.SUPABASE_SERVICE_KEY;
  if (!k) throw new SupabaseError("Set SUPABASE_SERVICE_KEY (service_role key).");
  return { ...UA, Accept: "application/json", apikey: k, Authorization: `Bearer ${k}` };
}

async function req(path: string, init: RequestInit = {}): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { headers: { ...headers(), ...(init.headers ?? {}) }, ...init });
  } catch (e) {
    throw new SupabaseError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new SupabaseError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function queryTable(table: string, select?: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return req(`/rest/v1/${encodeURIComponent(table)}?select=${encodeURIComponent(select ?? "*")}&limit=${n}`);
}

export function listUsers(page?: string): Promise<string> {
  const p = Number(page ?? 1) || 1;
  return req(`/auth/v1/admin/users?page=${p}&per_page=20`);
}

export function callRpc(fn: string, params?: string): Promise<string> {
  let body = "{}";
  if (params) {
    try {
      body = JSON.stringify(JSON.parse(params) as unknown);
    } catch {
      throw new SupabaseError("params must be valid JSON.");
    }
  }
  return req(`/rest/v1/rpc/${encodeURIComponent(fn)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).then((t) => t.slice(0, 8000));
}

