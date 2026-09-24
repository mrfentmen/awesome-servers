export class ShootProofError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ShootProofError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.shootproof.com/studio"

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new ShootProofError(`Set the ${name} environment variable.`)
  return v
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(BASE + path, {
    headers: {
      ...UA,
      Authorization: "Bearer " + envStrict("SHOOTPROOF_ACCESS_TOKEN"),
      Accept: "application/vnd.shootproof+json",
    },
  })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new ShootProofError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function getServiceDescription(): Promise<string> {
  return req("")
}

export function getMe(): Promise<string> {
  return req("/me")
}

export function listBrands(): Promise<string> {
  return req("/brand")
}

export function listBrandEvents(brandId: string): Promise<string> {
  return req(`/brand/${encodeURIComponent(brandId)}/event`)
}

export function listBrandOrders(brandId: string): Promise<string> {
  return req(`/brand/${encodeURIComponent(brandId)}/order`)
}
