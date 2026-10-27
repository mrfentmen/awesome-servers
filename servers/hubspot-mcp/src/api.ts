export class HubspotError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "HubspotError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!k) throw new HubspotError("Set HUBSPOT_ACCESS_TOKEN (HubSpot private app).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.hubapi.com" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new HubspotError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new HubspotError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listContacts(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/crm/v3/objects/contacts?limit=${n}`);
}

export function listCompanies(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/crm/v3/objects/companies?limit=${n}`);
}

export function listDeals(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/crm/v3/objects/deals?limit=${n}`);
}



export function listTickets(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/crm/v3/objects/tickets?limit=${n}`);
}

export function listOwners(): Promise<string> {
  return get("/crm/v3/owners?limit=50");
}

export function getContact(contactId: string): Promise<string> {
  return get(`/crm/v3/objects/contacts/${encodeURIComponent(contactId)}`);
}

export function getCompany(companyId: string): Promise<string> {
  return get(`/crm/v3/objects/companies/${encodeURIComponent(companyId)}`);
}

export function getDeal(dealId: string): Promise<string> {
  return get(`/crm/v3/objects/deals/${encodeURIComponent(dealId)}`);
}

export function searchContacts(email: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
        method: "POST",
        headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` },
        body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }], limit: 5 }),
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new HubspotError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new HubspotError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 8000);
  })();
}

export function dealPipelines(): Promise<string> {
  return get("/crm/v3/pipelines/deals");
}
