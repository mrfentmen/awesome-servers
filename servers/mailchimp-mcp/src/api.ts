export class MailchimpError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MailchimpError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function conf(): { dc: string; auth: string } {
  const k = process.env.MAILCHIMP_API_KEY;
  if (!k) throw new MailchimpError("Set MAILCHIMP_API_KEY (Mailchimp API key).");
  const dc = process.env.MAILCHIMP_DC ?? (k.includes("-") ? k.split("-").pop() as string : "us1");
  return { dc, auth: `Basic ${Buffer.from(`anyuser:${k}`).toString("base64")}` };
}

async function get(path: string): Promise<string> {
  const { dc, auth } = conf();
  let res: Response;
  try {
    res = await fetch(`https://${dc}.api.mailchimp.com/3.0${path}`, {
      headers: { ...UA, Accept: "application/json", Authorization: auth },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new MailchimpError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new MailchimpError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function ping(): Promise<string> {
  return get("/ping");
}

export function listLists(count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 10) || 10, 100);
  return get(`/lists?count=${n}`);
}

export function listMembers(listId: string, count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 10) || 10, 100);
  return get(`/lists/${encodeURIComponent(listId)}/members?count=${n}`);
}

export function listCampaigns(count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 10) || 10, 100);
  return get(`/campaigns?count=${n}`);
}

