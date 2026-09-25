export class BaserowError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BaserowError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  return (process.env.BASEROW_URL ?? "https://api.baserow.io").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const k = process.env.BASEROW_TOKEN;
  if (!k) throw new BaserowError("Set BASEROW_TOKEN (database token).");
  return { ...UA, Accept: "application/json", Authorization: `Token ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { headers: headers() });
  } catch (e) {
    throw new BaserowError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new BaserowError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 8000);
}

export function getDashboard(): Promise<string> {
  return get("/api/user/dashboard/");
}

export function listTables(databaseId: string): Promise<string> {
  return get(`/api/database/tables/database/${encodeURIComponent(databaseId)}/`);
}

