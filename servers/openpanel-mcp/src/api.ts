export class OpenpanelError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OpenpanelError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new OpenpanelError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  const id = envStrict("OPENPANEL_CLIENT_ID");
  const sec = envStrict("OPENPANEL_CLIENT_SECRET");
  return { Authorization: "Basic " + Buffer.from(`${id}:${sec}`).toString("base64") };
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
    throw new OpenpanelError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getMetrics(projectId: string, startDate?: string, endDate?: string): Promise<string> {
  let url = `https://api.openpanel.dev/insights/${encodeURIComponent(String(projectId))}/metrics`;
  const qs = new URLSearchParams();
  if (startDate !== undefined) qs.append("startDate", String(startDate));
  if (endDate !== undefined) qs.append("endDate", String(endDate));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getLive(projectId: string): Promise<string> {
  let url = `https://api.openpanel.dev/insights/${encodeURIComponent(String(projectId))}/live`;
  const data = await req(url);
  return pretty(data);
}

export async function getPages(projectId: string): Promise<string> {
  let url = `https://api.openpanel.dev/insights/${encodeURIComponent(String(projectId))}/pages`;
  const data = await req(url);
  return pretty(data);
}

export async function getReferrer(projectId: string): Promise<string> {
  let url = `https://api.openpanel.dev/insights/${encodeURIComponent(String(projectId))}/referrer`;
  const data = await req(url);
  return pretty(data);
}
