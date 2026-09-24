export class TurboSquidError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TurboSquidError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.turbosquid.com"
const ACCEPT = "application/vnd.api+json; com.turbosquid.api.version=1"

function optAuth(): Record<string, string> {
  const tok = process.env.TURBOSQUID_API_TOKEN
  if (!tok) throw new TurboSquidError("Set the TURBOSQUID_API_TOKEN environment variable (TurboSquid API token).")
  return { Authorization: "Token " + tok }
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(BASE + path, { headers: { ...UA, Accept: ACCEPT, ...optAuth() } })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new TurboSquidError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function listFileFormats(): Promise<string> {
  return req("/api/file_formats")
}

export function getProduct(productId: string): Promise<string> {
  return req(`/api/products/${encodeURIComponent(productId)}`)
}

export function listDrafts(): Promise<string> {
  return req("/api/drafts")
}

export function getDraft(draftId: string): Promise<string> {
  return req(`/api/drafts/${encodeURIComponent(draftId)}`)
}
