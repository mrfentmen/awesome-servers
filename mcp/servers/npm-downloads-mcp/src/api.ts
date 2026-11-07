/**
 * npm Downloads — Weekly download counts for any npm package. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.npmjs.org.
 */
const API = "https://api.npmjs.org/downloads"

export class NpmDownloadsError extends Error {}

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
      headers: { "user-agent": "npm-downloads-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new NpmDownloadsError(`npm Downloads returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof NpmDownloadsError) throw e
    if ((e as Error).name === "AbortError") throw new NpmDownloadsError("npm Downloads request timed out")
    throw new NpmDownloadsError(`npm Downloads request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function weeklyDownloads(packageName: string): Promise<string> {
  const pkg = packageName.trim()
  if (pkg === "") throw new NpmDownloadsError("package name must not be empty")
  const body = await get<unknown>(`${API}/point/last-week/${encodeURIComponent(pkg)}`)
  const count = at(body, "downloads")
  if (count === undefined) return `npm has no download data for "${pkg}".`
  return [
    `${val(at(body, "package"))} — last week`,
    "",
    `Downloads: ${Number(val(count)).toLocaleString("en-US")}`,
    `From: ${val(at(body, "start"))}`,
    `To: ${val(at(body, "end"))}`,
  ].join("\n")
}
