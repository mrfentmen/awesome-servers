export class SuperNotesError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SuperNotesError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.supernotes.app"

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new SuperNotesError(`Set the ${name} environment variable.`)
  return v
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string, init: RequestInit = {}): Promise<string> {
  const res = await fetch(BASE + path, {
    headers: { ...UA, "Api-Key": envStrict("SUPERNOTES_API_KEY"), "Content-Type": "application/json", ...(init.headers ?? {}) },
    ...init,
  })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new SuperNotesError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function getCard(cardId: string): Promise<string> {
  return req(`/v1/cards/${encodeURIComponent(cardId)}`)
}

export function selectCards(search?: string, limit?: string): Promise<string> {
  const body: Record<string, unknown> = {}
  if (search) body.search = search
  if (limit) body.limit = Number(limit)
  return req("/v1/cards/get/select", { method: "POST", body: JSON.stringify(body) })
}

export function simpleCreateCard(name?: string, markup?: string): Promise<string> {
  const body: Record<string, unknown> = {}
  if (name) body.name = name
  if (markup) body.markup = markup
  return req("/v1/cards/simple", { method: "POST", body: JSON.stringify(body) })
}

export function checkAuth(): Promise<string> {
  return req("/v1/user/token")
}
