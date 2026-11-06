/**
 * Go Proxy — List published versions of a Go module from proxy.golang.org. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against proxy.golang.org.
 */
const API = "https://proxy.golang.org"

export class GoProxyError extends Error {}

type Row = Record<string, unknown>

const val = (v: unknown): string => {
  if (typeof v === "string") return v
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : ""
  if (Array.isArray(v)) return v.length > 0 ? val(v[0]) : ""
  if (v && typeof v === "object") {
    const o = v as Row
    if ("en" in o) return val(o.en)
    const first = Object.values(o)[0]
    return first === undefined ? "" : val(first)
  }
  return ""
}

const at = (o: unknown, path: string): unknown =>
  path === "" ? o : path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Row)[k] : undefined), o)

const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : [])

async function get<T>(url: string, init?: RequestInit, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "user-agent": "goproxy-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new GoProxyError(`Go Proxy returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof GoProxyError) throw e
    if ((e as Error).name === "AbortError") throw new GoProxyError("Go Proxy request timed out")
    throw new GoProxyError(`Go Proxy request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

async function getText(url: string, timeoutMs = 30000): Promise<string> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "goproxy-mcp", accept: "*/*" } })
    if (!res.ok) throw new GoProxyError(`Go Proxy returned HTTP ${res.status}`)
    return await res.text()
  } catch (e) {
    if (e instanceof GoProxyError) throw e
    if ((e as Error).name === "AbortError") throw new GoProxyError("Go Proxy request timed out")
    throw new GoProxyError(`Go Proxy request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function versions(module: string): Promise<string> {
  const path = module.trim()
  if (!/^[a-zA-Z0-9._\-/]+$/.test(path)) throw new GoProxyError("module must be a valid Go module path")
  const text = await getText(`${API}/${path}/@v/list`)
  const all = text.split("\n").map((l) => l.trim()).filter((l) => l !== "")
  if (all.length === 0) throw new GoProxyError(`no published versions for ${path}`)
  const shown = all.slice(-15).reverse()
  return [`${path} — ${all.length} versions published`, "", ...shown.map((v, i) => `${i + 1}. ${v}`)].join("\n")
}
