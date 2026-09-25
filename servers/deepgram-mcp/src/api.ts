export class DeepgramError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DeepgramError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.deepgram.com/v1";

function headers(): Record<string, string> {
  const k = process.env.DEEPGRAM_API_KEY;
  if (!k) throw new DeepgramError("Set DEEPGRAM_API_KEY (free Deepgram tier).");
  return { ...UA, Accept: "application/json", Authorization: `Token ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: headers() });
  } catch (e) {
    throw new DeepgramError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new DeepgramError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listProjects(): Promise<string> {
  return get("/projects");
}

export function getBalance(projectId: string): Promise<string> {
  return get(`/projects/${encodeURIComponent(projectId)}/balances`);
}

export function listKeys(projectId: string): Promise<string> {
  return get(`/projects/${encodeURIComponent(projectId)}/keys`);
}

