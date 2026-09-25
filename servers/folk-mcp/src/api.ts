export class FolkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FolkError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.folk.app/v1";

function headers(): Record<string, string> {
  const k = process.env.FOLK_API_KEY;
  if (!k) throw new FolkError("Set FOLK_API_KEY (free Folk tier).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: headers() });
  } catch (e) {
    throw new FolkError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new FolkError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listPeople(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/people?limit=${n}`);
}

export function getPerson(personId: string): Promise<string> {
  return get(`/people/${encodeURIComponent(personId)}`);
}

export function listGroups(): Promise<string> {
  return get("/groups");
}

