export class SeafileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SeafileError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function base(): string {
  return (process.env.SEAFILE_BASE_URL ?? "https://cloud.seafile.com").replace(/\/$/, "")
}

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new SeafileError(`Set the ${name} environment variable.`)
  return v
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(base() + path, {
    headers: { ...UA, Authorization: "Token " + envStrict("SEAFILE_API_TOKEN") },
  })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new SeafileError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function listLibraries(): Promise<string> {
  return req("/api2/repos/")
}

export function getLibraryInfo(repoId: string): Promise<string> {
  return req(`/api2/repos/${encodeURIComponent(repoId)}/`)
}

export function getDefaultLibrary(): Promise<string> {
  return req("/api2/default-repo/")
}

export function getFileDetail(repoId: string, filePath: string): Promise<string> {
  return req(`/api2/repos/${encodeURIComponent(repoId)}/file/detail/?p=${encodeURIComponent(filePath)}`)
}
