/**
 * deps.dev — Package dependency and version data across npm, PyPI, Cargo, Go and Maven. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.deps.dev.
 */
const API = "https://api.deps.dev/v3"

export class DepsDevError extends Error {}

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
      headers: { "user-agent": "deps-dev-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new DepsDevError(`deps.dev returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof DepsDevError) throw e
    if ((e as Error).name === "AbortError") throw new DepsDevError("deps.dev request timed out")
    throw new DepsDevError(`deps.dev request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function getPackage(system = "npm", name = "react"): Promise<string> {
  const pkg = name.trim()
  if (pkg === "") throw new DepsDevError("package name must not be empty")
  const body = await get<unknown>(`${API}/systems/${system}/packages/${encodeURIComponent(pkg)}`)
  const versions = rows(at(body, "versions"))
  if (versions.length === 0) return `deps.dev has no ${system} package called "${pkg}".`
  const latest = versions[versions.length - 1]
  const recent = versions.slice(-5).map((v) => `${val(at(v, "versionKey.version"))} (${val(at(v, "publishedAt")).slice(0, 10)})`)
  return [
    `${pkg} on ${system} — ${versions.length} versions`,
    "",
    `Latest: ${val(at(latest, "versionKey.version"))}`,
    `Default: ${val(at(latest, "isDefault")) === "true" ? "yes" : "no"}`,
    "",
    "Recent versions:",
    ...recent,
  ].join("\n")
}
