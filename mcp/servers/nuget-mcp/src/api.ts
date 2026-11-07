/**
 * NuGet — .NET package metadata and versions from the NuGet registry. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.nuget.org.
 */
const API = "https://api.nuget.org/v3/registration5-semver1"

export class NuGetError extends Error {}

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
      headers: { "user-agent": "nuget-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new NuGetError(`NuGet returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof NuGetError) throw e
    if ((e as Error).name === "AbortError") throw new NuGetError("NuGet request timed out")
    throw new NuGetError(`NuGet request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


type Catalog = { catalogEntry?: Record<string, unknown> }

export async function getPackage(packageId: string): Promise<string> {
  const id = packageId.trim()
  if (id === "") throw new NuGetError("package id must not be empty")
  const body = await get<Record<string, unknown>>(`${API}/${encodeURIComponent(id.toLowerCase())}/index.json`)
  const pages = rows(body.items)
  let entries: Catalog[] = pages.flatMap((p) => rows(p.items) as Catalog[])
  if (entries.length === 0 && pages.length > 0) {
    const pageUrl = val(pages[pages.length - 1][ "@id" ])
    if (pageUrl !== "") {
      const page = await get<Record<string, unknown>>(pageUrl)
      entries = rows(page.items) as Catalog[]
    }
  }
  if (entries.length === 0) throw new NuGetError(`NuGet has no package called "${id}"`)
  const latest = entries[entries.length - 1].catalogEntry ?? {}
  return [
    `${val(latest.id)} ${val(latest.version)}`,
    "",
    `Description: ${val(latest.description).slice(0, 300)}`,
    `Authors: ${val(latest.authors)}`,
    `Published: ${val(latest.published)}`,
    `Versions: ${entries.length}`,
    `Project: ${val(latest.projectUrl)}`,
  ].join("\n")
}
