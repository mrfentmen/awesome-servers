export class FileRunError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FileRunError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function base(): string {
  if (!process.env.FILERUN_BASE_URL) throw new FileRunError("Set the FILERUN_BASE_URL environment variable (your FileRun server, https only).")
  return process.env.FILERUN_BASE_URL.replace(/\/$/, "")
}

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new FileRunError(`Set the ${name} environment variable.`)
  return v
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string, init: RequestInit = {}): Promise<string> {
  const res = await fetch(base() + path, {
    headers: { ...UA, Authorization: "Bearer " + envStrict("FILERUN_ACCESS_TOKEN"), ...(init.headers ?? {}) },
    ...init,
  })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new FileRunError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function browseFolder(folderPath: string): Promise<string> {
  return req(`/api.php/Drive/files/browse?path=${encodeURIComponent(folderPath)}`)
}

export function searchFiles(folderPath: string, filename?: string, contents?: string): Promise<string> {
  const body = new URLSearchParams({ path: folderPath })
  if (filename) body.set("filename", filename)
  if (contents) body.set("contents", contents)
  return req("/api.php/Drive/files/search", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
}

export function createFolder(folderPath: string, name: string): Promise<string> {
  const body = new URLSearchParams({ path: folderPath, name })
  return req("/api.php/Drive/files/createfolder", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
}
