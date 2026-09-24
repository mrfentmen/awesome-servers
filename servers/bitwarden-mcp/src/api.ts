export class BitwardenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BitwardenError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new BitwardenError(`Set the ${name} environment variable.`)
  return v
}

let cachedToken = ""
let tokenExpiresAt = 0
async function authHeaders(): Promise<Record<string, string>> {
  const now = Date.now()
  if (!cachedToken || now >= tokenExpiresAt) {
    const identity = process.env.BITWARDEN_IDENTITY_URL ?? "https://identity.bitwarden.com"
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      scope: "api",
      client_id: envStrict("BITWARDEN_CLIENT_ID"),
      client_secret: envStrict("BITWARDEN_CLIENT_SECRET"),
    })
    const res = await fetch(`${identity}/connect/token`, {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
    if (!res.ok) throw new BitwardenError(`Bitwarden login failed: HTTP ${res.status}`)
    const data = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!data.access_token) throw new BitwardenError("Bitwarden login returned no access token")
    cachedToken = data.access_token
    tokenExpiresAt = now + (data.expires_in ?? 3600) * 1000 - 60000
  }
  return { Authorization: "Bearer " + cachedToken }
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new BitwardenError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listMembers(): Promise<string> {
  const api = process.env.BITWARDEN_API_URL ?? "https://api.bitwarden.com";
  let url = `${api}/public/members`;
  const data = await req(url);
  return pretty(data);
}

export async function listCollections(): Promise<string> {
  const api = process.env.BITWARDEN_API_URL ?? "https://api.bitwarden.com";
  let url = `${api}/public/collections`;
  const data = await req(url);
  return pretty(data);
}

export async function listGroups(): Promise<string> {
  const api = process.env.BITWARDEN_API_URL ?? "https://api.bitwarden.com";
  let url = `${api}/public/groups`;
  const data = await req(url);
  return pretty(data);
}

export async function getEvents(start?: string, end?: string): Promise<string> {
  const api = process.env.BITWARDEN_API_URL ?? "https://api.bitwarden.com";
  let url = `${api}/public/events`;
  const qs = new URLSearchParams();
  if (start !== undefined) qs.append("start", String(start));
  if (end !== undefined) qs.append("end", String(end));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}
