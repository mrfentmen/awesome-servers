export class CustomerioError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CustomerioError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const id = process.env.CUSTOMERIO_SITE_ID;
  const k = process.env.CUSTOMERIO_API_KEY;
  if (!id || !k) throw new CustomerioError("Set CUSTOMERIO_SITE_ID and CUSTOMERIO_API_KEY.");
  return { ...UA, Accept: "application/json", Authorization: `Basic ${Buffer.from(`${id}:${k}`).toString("base64")}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.customer.io/v1" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new CustomerioError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CustomerioError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listCustomers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/customers?limit=${n}`);
}

export function getCustomer(identifier: string): Promise<string> {
  return get(`/customers/${encodeURIComponent(identifier)}`);
}

export function listSegments(): Promise<string> {
  return get("/segments");
}



export function segmentDetails(segmentId: string): Promise<string> {
  return get(`/segments/${encodeURIComponent(segmentId)}`);
}

export function campaigns(): Promise<string> {
  return get("/campaigns");
}

export function campaignDetails(campaignId: string): Promise<string> {
  return get(`/campaigns/${encodeURIComponent(campaignId)}`);
}

export function newsletters(): Promise<string> {
  return get("/newsletters");
}

export function activities(): Promise<string> {
  return get("/activities");
}

export function customerActivities(identifier: string): Promise<string> {
  return get(`/customers/${encodeURIComponent(identifier)}/activities`);
}

export function customerMessages(identifier: string): Promise<string> {
  return get(`/customers/${encodeURIComponent(identifier)}/messages`);
}
