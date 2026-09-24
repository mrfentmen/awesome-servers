export class SavvyCalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SavvyCalError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.savvycal.com"

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new SavvyCalError(`Set the ${name} environment variable.`)
  return v
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(BASE + path, {
    headers: { ...UA, Authorization: "Bearer " + envStrict("SAVVYCAL_API_TOKEN"), Accept: "application/json" },
  })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new SavvyCalError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function listLinks(): Promise<string> {
  return req("/v1/links")
}

export function getLink(linkId: string): Promise<string> {
  return req(`/v1/links/${encodeURIComponent(linkId)}`)
}

export function getCurrentUser(): Promise<string> {
  return req("/v1/me")
}

export function listEvents(): Promise<string> {
  return req("/v1/events")
}
