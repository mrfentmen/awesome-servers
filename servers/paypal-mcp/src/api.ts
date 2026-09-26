export class PaypalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PaypalError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

let cached: { token: string; expiresAt: number } | null = null;

function creds(): { id: string; secret: string } {
  const id = process.env.PAYPAL_SANDBOX_CLIENT_ID;
  const secret = process.env.PAYPAL_SANDBOX_SECRET;
  if (!id || !secret) throw new PaypalError("Set PAYPAL_SANDBOX_CLIENT_ID and PAYPAL_SANDBOX_SECRET.");
  return { id, secret };
}

async function token(): Promise<string> {
  const { id, secret } = creds();
  if (cached && Date.now() < cached.expiresAt) return cached.token;
  let res: Response;
  try {
    res = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: { ...UA, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new PaypalError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new PaypalError(`Token error HTTP ${res.status}: ${body}`);
  }
  const d = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!d.access_token) throw new PaypalError("Token error: no access_token.");
  cached = { token: d.access_token, expiresAt: Date.now() + (d.expires_in ?? 3600) * 1000 - 60000 };
  return d.access_token;
}

async function get(path: string): Promise<string> {
  const t = await token();
  let res: Response;
  try {
    res = await fetch("https://api-m.sandbox.paypal.com" + path, {
      headers: { ...UA, Accept: "application/json", Authorization: `Bearer ${t}` },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new PaypalError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new PaypalError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 8000);
}

export function getOrder(orderId: string): Promise<string> {
  return get(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
}

export function getCapture(captureId: string): Promise<string> {
  return get(`/v2/payments/captures/${encodeURIComponent(captureId)}`);
}

export function listPlans(): Promise<string> {
  return get("/v1/billing/plans?page_size=10");
}

