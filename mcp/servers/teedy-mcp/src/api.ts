export class TeedyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TeedyError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function base(): string {
  return (process.env.TEEDY_BASE_URL ?? "https://demo.teedy.io").replace(/\/$/, "")
}

function authHeaders(): Record<string, string> {
  const tok = process.env.TEEDY_AUTH_TOKEN
  if (!tok) throw new TeedyError("Set the TEEDY_AUTH_TOKEN environment variable (auth_token from login).")
  return { Cookie: "auth_token=" + tok }
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string, init: RequestInit = {}): Promise<{ data: string; cookies: string[] }> {
  const res = await fetch(base() + path, { headers: { ...UA, ...authHeaders(), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new TeedyError(`HTTP ${res.status}: ${detail}`)
  }
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : []
  return { data: pretty(data), cookies: raw }
}

export async function login(username: string, password: string): Promise<string> {
  const body = new URLSearchParams({ username, password })
  const res = await fetch(base() + "/api/user/login", {
    method: "POST",
    headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
  const text = await res.text()
  if (!res.ok) throw new TeedyError(`HTTP ${res.status}: ${text.slice(0, 300)}`)
  const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : []
  const auth = cookies.map((c) => c.split(";")[0]).find((c) => c.startsWith("auth_token="))
  return pretty({ response: safeJson(text), set_TEEDY_AUTH_TOKEN_to: auth ? auth.slice("auth_token=".length) : null })
}

function safeJson(t: string): unknown {
  try { return JSON.parse(t) } catch { return t.slice(0, 500) }
}

export async function listDocuments(search?: string): Promise<string> {
  const q = search ? `?search=${encodeURIComponent(search)}` : ""
  return (await req(`/api/document/list${q}`)).data
}

export async function getDocument(docId: string): Promise<string> {
  return (await req(`/api/document/${encodeURIComponent(docId)}`)).data
}

export async function listDocumentFiles(docId: string): Promise<string> {
  return (await req(`/api/file/list?id=${encodeURIComponent(docId)}`)).data
}
