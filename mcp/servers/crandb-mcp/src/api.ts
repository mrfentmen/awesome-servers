/**
 * CRAN — R package metadata from the CRAN database. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against crandb.r-pkg.org.
 */
const API = "https://crandb.r-pkg.org"

export class CrandbError extends Error {}

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
      headers: { "user-agent": "crandb-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new CrandbError(`CRAN returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof CrandbError) throw e
    if ((e as Error).name === "AbortError") throw new CrandbError("CRAN request timed out")
    throw new CrandbError(`CRAN request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function packageInfo(name: string): Promise<string> {
  const pkg = name.trim()
  if (pkg === "") throw new CrandbError("name must not be empty")
  const body = await get<unknown>(`${API}/${encodeURIComponent(pkg)}`)
  const title = val(at(body, "Title"))
  if (title === "" && val(at(body, "error")) !== "") throw new CrandbError(`CRAN has no package called "${pkg}"`)
  return [
    `${val(at(body, "Package"))} ${val(at(body, "Version"))}`.trim(),
    "",
    title,
    "",
    `Maintainer: ${val(at(body, "Maintainer"))}`,
    `Licence: ${val(at(body, "License"))}`,
    `Published: ${val(at(body, "Date/Publication"))}`,
    `Depends: ${val(at(body, "Depends"))}`,
  ]
    .filter((line) => line !== "")
    .join("\n")
}
