export class KlaviyoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "KlaviyoError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.KLAVIYO_API_KEY;
  if (!k) throw new KlaviyoError("Set KLAVIYO_API_KEY (Klaviyo private key).");
  return { ...UA, Accept: "application/json", Authorization: `Klaviyo-API-Key ${k}`, revision: "2024-10-15" };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://a.klaviyo.com/api" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new KlaviyoError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new KlaviyoError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listProfiles(): Promise<string> {
  return get("/profiles/?page[size]=10");
}

export function listLists(): Promise<string> {
  return get("/lists/?page[size]=20");
}

export function listCampaigns(): Promise<string> {
  return get("/campaigns/?page[size]=10");
}



export function profileDetails(profileId: string): Promise<string> {
  return get(`/profiles/${encodeURIComponent(profileId)}/`);
}

export function listDetails(listId: string): Promise<string> {
  return get(`/lists/${encodeURIComponent(listId)}/`);
}

export function campaignDetails(campaignId: string): Promise<string> {
  return get(`/campaigns/${encodeURIComponent(campaignId)}/`);
}

export function metrics(): Promise<string> {
  return get("/metrics/?page[size]=20");
}

export function events(): Promise<string> {
  return get("/events/?page[size]=10");
}

export function flows(): Promise<string> {
  return get("/flows/?page[size]=10");
}

export function segments(): Promise<string> {
  return get("/segments/?page[size]=20");
}
