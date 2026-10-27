export class LagoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LagoError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
function base(): string {
  return (process.env.LAGO_BASE_URL ?? "https://api.getlago.com/api/v1").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const k = process.env.LAGO_API_KEY;
  if (!k) throw new LagoError("Set LAGO_API_KEY (Lago cloud or self-hosted).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new LagoError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new LagoError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listPlans(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/plans?per_page=${n}`);
}

export function listCustomers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/customers?per_page=${n}`);
}

export function listInvoices(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/invoices?per_page=${n}`);
}

