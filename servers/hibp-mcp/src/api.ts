export class HibpError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "HibpError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://haveibeenpwned.com/api/v3";

async function req(path: string, params: Record<string, string | number | undefined>, text = false): Promise<string> {
  void params;
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: { ...UA, Accept: text ? "text/plain" : "application/json" } });
  } catch (e) {
    throw new HibpError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new HibpError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

function headers(): Record<string, string> {
  const k = process.env.HIBP_API_KEY;
  if (!k) throw new HibpError("Set HIBP_API_KEY (free at haveibeenpwned.com/API/v3).");
  return { ...UA, "hibp-api-key": k };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: headers() });
  } catch (e) {
    throw new HibpError(`Network error: ${(e as Error).message}`);
  }
  if (res.status === 404) return "[]";
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200);
    throw new HibpError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function checkAccount(account: string): Promise<string> {
  return get(`/breachedaccount/${encodeURIComponent(account)}?truncateResponse=false`);
}

export function listBreaches(): Promise<string> {
  return get("/breaches");
}

export function checkPastes(email: string): Promise<string> {
  return get(`/pasteaccount/${encodeURIComponent(email)}`);
}

