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



export function listApiKeys(): Promise<string> {
  return get("/api-keys/list");
}

export function listAudiences(): Promise<string> {
  return get("/audiences");
}

export function getAudience(audienceId: string): Promise<string> {
  return get(`/audiences/${encodeURIComponent(audienceId)}`);
}

export function listContacts(audienceId: string): Promise<string> {
  return get(`/audiences/${encodeURIComponent(audienceId)}/contacts`);
}

export function listBroadcasts(): Promise<string> {
  return get("/broadcasts");
}

export function getBroadcast(broadcastId: string): Promise<string> {
  return get(`/broadcasts/${encodeURIComponent(broadcastId)}`);
}

export function createContact(audienceId: string, email: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch(`https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts`, {
        method: "POST",
        headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new ResendError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new ResendError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 4000);
  })();
}

export function addDomain(name: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch("https://api.resend.com/domains", {
        method: "POST",
        headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ name }),
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new ResendError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new ResendError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 4000);
  })();
}
