/**
 * PyPI — Python package metadata, versions and release files from PyPI. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against pypi.org.
 */
const API = "https://pypi.org/pypi"

export class PypiError extends Error {}

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
      headers: { "user-agent": "pypi-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new PypiError(`PyPI returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof PypiError) throw e
    if ((e as Error).name === "AbortError") throw new PypiError("PyPI request timed out")
    throw new PypiError(`PyPI request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function getPackage(name: string): Promise<string> {
  const pkg = name.trim()
  if (pkg === "") throw new PypiError("package name must not be empty")
  const body = await get<unknown>(`${API}/${encodeURIComponent(pkg)}/json`)
  const info = at(body, "info")
  if (!info) throw new PypiError(`PyPI has no package called "${pkg}"`)
  const releases = Object.keys((at(body, "releases") ?? {}) as Record<string, unknown>)
  return [
    `${val(at(info, "name"))} ${val(at(info, "version"))}`,
    "",
    `Summary: ${val(at(info, "summary"))}`,
    `Author: ${val(at(info, "author"))}`,
    `Licence: ${val(at(info, "license"))}`,
    `Python: ${val(at(info, "requires_python"))}`,
    `Releases: ${releases.length}`,
    `Home: ${val(at(info, "home_page")) || val(at(info, "project_url"))}`,
  ].join("\n")
}
