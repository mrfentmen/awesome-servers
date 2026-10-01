export class KnmiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "KnmiError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.dataplatform.knmi.nl/open-data/v1"

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new KnmiError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  const __KNMI_API_KEY = envStrict("KNMI_API_KEY")
  return { "Authorization": __KNMI_API_KEY }
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
    throw new KnmiError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listDatasets(): Promise<string> {
  let url = BASE + `/datasets`;
  const data = await req(url);
  return pretty(data);
}

export async function listVersions(dataset: string): Promise<string> {
  let url = BASE + `/datasets/${encodeURIComponent(String(dataset))}/versions`;
  const data = await req(url);
  return pretty(data);
}

export async function listFiles(dataset: string, version: string, maxKeys?: number): Promise<string> {
  let url = BASE + `/datasets/${encodeURIComponent(String(dataset))}/versions/${encodeURIComponent(String(version))}/files`;
  const qs = new URLSearchParams();
  if (maxKeys !== undefined) qs.append("maxKeys", String(maxKeys));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getFile(dataset: string, version: string, filename: string): Promise<string> {
  let url = BASE + `/datasets/${encodeURIComponent(String(dataset))}/versions/${encodeURIComponent(String(version))}/files/${encodeURIComponent(String(filename))}/url`;
  const meta = await req(url) as { temporaryDownloadUrl?: string };
  const dl = meta.temporaryDownloadUrl;
  if (!dl) throw new KnmiError("No download URL returned for that file.")
  const res = await fetch(dl, { headers: { ...UA } });
  if (!res.ok) throw new KnmiError(`Download failed: HTTP ${res.status}`)
  const txt = await res.text();
  return pretty(txt);
}
