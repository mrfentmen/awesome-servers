export class StripeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StripeError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) throw new StripeError("Set STRIPE_SECRET_KEY (Stripe test-mode key).");
  return { ...UA, Accept: "application/json", Authorization: `Basic ${Buffer.from(`${k}:`).toString("base64")}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.stripe.com/v1" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new StripeError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new StripeError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listCharges(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/charges?limit=${n}`);
}

export function listCustomers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/customers?limit=${n}`);
}

export function getBalance(): Promise<string> {
  return get("/balance");
}

