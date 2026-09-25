export class MercuryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MercuryError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.mercury.com/api/v1";

function headers(): Record<string, string> {
  const k = process.env.MERCURY_API_KEY;
  if (!k) throw new MercuryError("Set MERCURY_API_KEY (Mercury sandbox).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: headers() });
  } catch (e) {
    throw new MercuryError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new MercuryError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listAccounts(): Promise<string> {
  return get("/accounts");
}

export function getAccount(accountId: string): Promise<string> {
  return get(`/account/${encodeURIComponent(accountId)}`);
}

export function listTransactions(accountId: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/account/${encodeURIComponent(accountId)}/transactions?limit=${n}`);
}

