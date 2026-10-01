export class KopiaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "KopiaError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function base(): string {
  return (process.env.KOPIA_BASE_URL ?? "http://localhost:51515").replace(/\/$/, "")
}

function authHeaders(): Record<string, string> {
  const u = process.env.KOPIA_USERNAME
  const p = process.env.KOPIA_PASSWORD
  if (!u || !p) throw new KopiaError("Set KOPIA_USERNAME and KOPIA_PASSWORD (kopia server user).")
  const b64 = typeof Buffer !== "undefined" ? Buffer.from(`${u}:${p}`).toString("base64") : btoa(`${u}:${p}`)
  return { Authorization: "Basic " + b64 }
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(base() + path, { headers: { ...UA, ...authHeaders() } })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new KopiaError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function listSources(): Promise<string> {
  return req("/api/v1/sources")
}

export function listSnapshots(): Promise<string> {
  return req("/api/v1/snapshots")
}

export function getRepoStatus(): Promise<string> {
  return req("/api/v1/repo/status")
}

export function getCurrentUser(): Promise<string> {
  return req("/api/v1/current-user")
}

export function getTasksSummary(): Promise<string> {
  return req("/api/v1/tasks-summary")
}
