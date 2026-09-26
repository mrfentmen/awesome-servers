export class ResendError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ResendError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.RESEND_API_KEY;
  if (!k) throw new ResendError("Set RESEND_API_KEY (Resend dashboard).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.resend.com" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new ResendError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new ResendError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 8000);
}

export function listDomains(): Promise<string> {
  return get("/domains");
}

export function getDomain(domainId: string): Promise<string> {
  return get(`/domains/${encodeURIComponent(domainId)}`);
}

export function getEmail(emailId: string): Promise<string> {
  return get(`/emails/${encodeURIComponent(emailId)}`);
}

