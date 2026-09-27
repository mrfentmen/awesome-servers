export class FreshdeskError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FreshdeskError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function conf(): { domain: string; auth: string } {
  const domain = process.env.FRESHDESK_DOMAIN;
  const k = process.env.FRESHDESK_API_KEY;
  if (!domain || !k) throw new FreshdeskError("Set FRESHDESK_DOMAIN and FRESHDESK_API_KEY.");
  return { domain, auth: `Basic ${Buffer.from(`${k}:X`).toString("base64")}` };
}

async function get(path: string): Promise<string> {
  const { domain, auth } = conf();
  let res: Response;
  try {
    res = await fetch(`https://${domain}.freshdesk.com/api/v2${path}`, {
      headers: { ...UA, Accept: "application/json", Authorization: auth },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new FreshdeskError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new FreshdeskError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listTickets(): Promise<string> {
  return get("/tickets?per_page=20");
}

export function getTicket(ticketId: string): Promise<string> {
  return get(`/tickets/${encodeURIComponent(ticketId)}`);
}

export function listContacts(): Promise<string> {
  return get("/contacts?per_page=20");
}



export function contactDetails(contactId: string): Promise<string> {
  return get(`/contacts/${encodeURIComponent(contactId)}`);
}

export function agents(): Promise<string> {
  return get("/agents?per_page=20");
}

export function companies(): Promise<string> {
  return get("/companies?per_page=20");
}

export function groups(): Promise<string> {
  return get("/groups?per_page=20");
}

export function conversations(ticketId: string): Promise<string> {
  return get(`/tickets/${encodeURIComponent(ticketId)}/conversations`);
}

export function satisfaction(): Promise<string> {
  return get("/surveys/satisfaction_ratings?per_page=10");
}

export function canned(): Promise<string> {
  return get("/canned_response_folders?per_page=10").then((t) => t.slice(0, 4000));
}
