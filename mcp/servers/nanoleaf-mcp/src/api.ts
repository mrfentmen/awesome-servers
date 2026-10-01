export class NanoleafError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NanoleafError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new NanoleafError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return {};
}
async function nlBase(): Promise<string> {
  return `${envStrict("NANOLEAF_HOST").replace(/\/$/, "")}/api/v1/${envStrict("NANOLEAF_TOKEN")}`;
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
    throw new NanoleafError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getInfo(): Promise<string> {
  const base = await nlBase();
  let url = `${base}/`;
  const data = await req(url);
  return pretty(data);
}

export async function getState(): Promise<string> {
  const base = await nlBase();
  let url = `${base}/state/`;
  const data = await req(url);
  return pretty(data);
}

export async function setPower(on: boolean): Promise<string> {
  const base = await nlBase();
  let url = `${base}/state/`;
  const data = await req(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on: { value: on } }) });
  return pretty(data);
}

export async function getEffects(): Promise<string> {
  const base = await nlBase();
  let url = `${base}/effects/`;
  const data = await req(url);
  return pretty(data);
}
