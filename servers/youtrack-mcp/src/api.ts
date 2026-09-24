export class YoutrackError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "YoutrackError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new YoutrackError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("YOUTRACK_API_TOKEN") }
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
    throw new YoutrackError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function searchIssues(query: string, limit?: number): Promise<string> {
  const base = (envStrict("YOUTRACK_BASE_URL")).replace(/\/$/, "");
  let url = `${base}/api/issues`;
  const qs = new URLSearchParams();
  qs.append("query", String(query));
  if (limit !== undefined) qs.append("$top", String(limit));
  qs.append("fields", "idReadable,summary,description,customFields(name,value(name))");
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getIssue(issueId: string): Promise<string> {
  const base = (envStrict("YOUTRACK_BASE_URL")).replace(/\/$/, "");
  let url = `${base}/api/issues/${encodeURIComponent(String(issueId))}`;
  const qs = new URLSearchParams();
  qs.append("fields", "idReadable,summary,description,customFields(name,value(name)),commentsCount");
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function listProjects(): Promise<string> {
  const base = (envStrict("YOUTRACK_BASE_URL")).replace(/\/$/, "");
  let url = `${base}/api/admin/projects`;
  const qs = new URLSearchParams();
  qs.append("fields", "id,name,shortName");
  qs.append("$top", "100");
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getIssueComments(issueId: string, limit?: number): Promise<string> {
  const base = (envStrict("YOUTRACK_BASE_URL")).replace(/\/$/, "");
  let url = `${base}/api/issues/${encodeURIComponent(String(issueId))}/comments`;
  const qs = new URLSearchParams();
  qs.append("fields", "id,text,author(login),created");
  if (limit !== undefined) qs.append("$top", String(limit));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}
