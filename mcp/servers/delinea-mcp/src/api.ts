export class DelineaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DelineaError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new DelineaError(`Set the ${name} environment variable.`)
  return v
}

async function apiBase(): Promise<string> {
  return envStrict("DELINEA_BASE_URL").replace(/\/$/, "");
}
let cachedToken = "";
async function authHeaders(): Promise<Record<string, string>> {
  if (!cachedToken) {
    const base = await apiBase();
    const res = await fetch(`${base}/oauth2/token`, {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: envStrict("DELINEA_USERNAME"), password: envStrict("DELINEA_PASSWORD"), grant_type: "password" }).toString(),
    });
    if (!res.ok) throw new DelineaError(`Delinea login failed: HTTP ${res.status}`);
    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) throw new DelineaError("Delinea login returned no token");
    cachedToken = data.access_token;
  }
  return { Authorization: "Bearer " + cachedToken };
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
    throw new DelineaError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function searchSecrets(query: string): Promise<string> {
  const base = await apiBase();
  let url = `${base}/api/v1/secrets`;
  const qs = new URLSearchParams();
  qs.append("filter.searchText", String(query));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getSecret(secretId: string): Promise<string> {
  const base = await apiBase();
  let url = `${base}/api/v1/secrets/${encodeURIComponent(String(secretId))}`;
  const data = await req(url);
  return pretty(data);
}

export async function listFolders(): Promise<string> {
  const base = await apiBase();
  let url = `${base}/api/v1/folders`;
  const data = await req(url);
  return pretty(data);
}
