const BASE = "https://rubygems.org/api/v1"
const UA = "mrfentmen-rubygems-mcp/1.0 (https://github.com/mrfentmen)"
export class GemsError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new GemsError("RubyGems rate limit hit, wait and retry")
  if (!res.ok) throw new GemsError(`RubyGems error ${res.status}`)
  return (await res.json()) as T
}

export async function gemInfo(args: { name?: string }): Promise<string> {
  const name = (args.name ?? "").trim().toLowerCase()
  if (!name) throw new GemsError("Provide a gem name")
  const d = await get<any>(`${BASE}/gems/${encodeURIComponent(name)}.json`)
  return `Gem: ${d.name ?? name}\nDescription: ${d.info ?? "n/a"}\nLatest version: ${d.version ?? "n/a"}\nDownloads: ${(d.downloads ?? 0).toLocaleString()} (this version: ${(d.version_downloads ?? 0).toLocaleString()})\nHomepage: ${d.homepage_uri ?? d.source_code_uri ?? "n/a"}\nLicenses: ${(d.licenses ?? []).join(", ") || "n/a"}`
}

export async function searchGems(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new GemsError("Provide search terms")
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any[]>(`${BASE}/search.json?query=${encodeURIComponent(q)}`)
  const gems = (Array.isArray(d) ? d : []).slice(0, limit)
  if (!gems.length) return "No gems found"
  return gems.map((g: any, i: number) => `${i + 1}. ${g.name} ${g.version ?? ""}\n   ${(g.info ?? "").slice(0, 120)} | ${(g.downloads ?? 0).toLocaleString()} downloads`).join("\n\n")
}

// ---- muxB tools:

const gemField = (row: any, key: string, fallback = "not reported"): string => {
  const value = row?.[key]
  return value != null && String(value) !== "" ? String(value) : fallback
}

export interface GemVersionsArgs {
  name: string
  limit?: number
  includePrerelease?: boolean
}

export interface RecentGemsArgs {
  limit?: number
}

export interface GemDependenciesArgs {
  name: string
}

export async function gemDependencies(args: GemDependenciesArgs): Promise<string> {
  const name = (args.name ?? "").trim().toLowerCase()
  if (!name) throw new GemsError("Provide a gem name")
  const d = await get<any>(`${BASE}/gems/${encodeURIComponent(name)}.json`)
  const deps = d.dependencies && typeof d.dependencies === "object" ? d.dependencies : {}
  const runtime: any[] = Array.isArray(deps.runtime) ? deps.runtime : []
  const development: any[] = Array.isArray(deps.development) ? deps.development : []
  const show = (rows: any[], max: number) =>
    rows.length
      ? rows.slice(0, max).map((r) => `  ${gemField(r, "name")} ${gemField(r, "requirements")}`).join("\n")
      : "  none declared"
  return [
    `Dependencies of ${gemField(d, "name", name)} ${gemField(d, "version")}`,
    `${runtime.length} runtime, ${development.length} development`,
    "",
    "Runtime:",
    show(runtime, 40),
    "",
    "Development:",
    show(development, 25),
  ].join("\n")
}
