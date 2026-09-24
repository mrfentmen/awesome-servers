export class CGTraderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CGTraderError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.cgtrader.com"

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new CGTraderError(`Set the ${name} environment variable.`)
  return v
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(BASE + path, {
    headers: { ...UA, Authorization: "Bearer " + envStrict("CGTRADER_ACCESS_TOKEN") },
  })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new CGTraderError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function listModels(page?: string): Promise<string> {
  const q = page ? `?page=${encodeURIComponent(page)}` : ""
  return req(`/v1/models${q}`)
}

export function getModel(modelId: string): Promise<string> {
  return req(`/v1/models/${encodeURIComponent(modelId)}`)
}

export function listModelFiles(modelId: string): Promise<string> {
  return req(`/v1/models/${encodeURIComponent(modelId)}/files`)
}

export function getMe(): Promise<string> {
  return req("/v1/users/me")
}
