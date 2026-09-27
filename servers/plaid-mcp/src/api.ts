export class PlaidError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PlaidError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function creds(): { id: string; secret: string } {
  const id = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!id || !secret) throw new PlaidError("Set PLAID_CLIENT_ID and PLAID_SECRET (Plaid sandbox).");
  return { id, secret };
}

async function post(path: string, extra: Record<string, unknown> = {}): Promise<string> {
  const { id, secret } = creds();
  let res: Response;
  try {
    res = await fetch("https://sandbox.plaid.com" + path, {
      method: "POST",
      headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", "PLAID-CLIENT-ID": id, "PLAID-SECRET": secret },
      body: JSON.stringify(extra),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new PlaidError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new PlaidError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 8000);
}

export function listInstitutions(count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 10) || 10, 100);
  return post("/institutions/search", { query: "bank", products: ["transactions"], country_codes: ["US"], options: { include_optional_metadata: false } }).then((t) => {
    try {
      const d = JSON.parse(t) as { institutions?: unknown[] };
      return JSON.stringify((d.institutions ?? []).slice(0, n), null, 2);
    } catch {
      return t.slice(0, 4000);
    }
  });
}

export function listCategories(): Promise<string> {
  return post("/categories/get", {});
}

export function sandboxToken(institutionId?: string): Promise<string> {
  return post("/sandbox/public_token/create", {
    institution_id: institutionId ?? "ins_109508",
    initial_products: ["transactions"],
  });
}



export function getInstitution(institutionId: string): Promise<string> {
  return post("/institutions/get_by_id", { institution_id: institutionId });
}

export function sandboxBalance(accessToken: string): Promise<string> {
  return post("/accounts/balance/get", { access_token: accessToken });
}

export function sandboxTransactions(accessToken: string, days?: string): Promise<string> {
  const d = Math.min(Number(days ?? 30) || 30, 730);
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
  return post("/transactions/sync", { access_token: accessToken, count: 20 }).then((t) => t.slice(0, 12000));
}

export function sandboxHoldings(accessToken: string): Promise<string> {
  return post("/investments/holdings/get", { access_token: accessToken });
}

export function sandboxLiabilities(accessToken: string): Promise<string> {
  return post("/liabilities/get", { access_token: accessToken });
}

export function sandboxAuth(accessToken: string): Promise<string> {
  return post("/auth/get", { access_token: accessToken });
}

export function sandboxIdentity(accessToken: string): Promise<string> {
  return post("/identity/get", { access_token: accessToken });
}
