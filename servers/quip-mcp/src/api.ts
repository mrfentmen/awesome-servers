export class QuipError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "QuipError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new QuipError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("QUIP_API_TOKEN") };
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new QuipError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function searchThreads(query: string): Promise<string> {
  let url = `https://platform.quip.com/1/threads/search`;
  const qs = new URLSearchParams();
  qs.append("query", String(query));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getThread(threadId: string): Promise<string> {
  let url = `https://platform.quip.com/1/threads/${encodeURIComponent(String(threadId))}`;
  const data = await req(url);
  return pretty(data);
}

export async function listFolders(): Promise<string> {
  let url = `https://platform.quip.com/1/folders`;
  const data = await req(url);
  return pretty(data);
}

export async function getUser(): Promise<string> {
  let url = `https://platform.quip.com/1/users/current`;
  const data = await req(url);
  return pretty(data);
}
