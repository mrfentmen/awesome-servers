export class DopplerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DopplerError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new DopplerError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("DOPPLER_API_KEY") }
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
    throw new DopplerError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listProjects(): Promise<string> {
  let url = `https://api.doppler.com/v3/projects`;
  const data = await req(url);
  return pretty(data);
}

export async function listConfigs(project: string): Promise<string> {
  let url = `https://api.doppler.com/v3/configs`;
  const qs = new URLSearchParams();
  qs.append("project", String(project));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function listSecrets(project: string, config: string, secrets?: string): Promise<string> {
  let url = `https://api.doppler.com/v3/configs/config/secrets`;
  const qs = new URLSearchParams();
  qs.append("project", String(project));
  qs.append("config", String(config));
  if (secrets !== undefined) qs.append("secrets", String(secrets));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function downloadSecrets(project: string, config: string, format?: string): Promise<string> {
  let url = `https://api.doppler.com/v3/configs/config/secrets/download`;
  const qs = new URLSearchParams();
  qs.append("project", String(project));
  qs.append("config", String(config));
  if (format !== undefined) qs.append("format", String(format));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}
