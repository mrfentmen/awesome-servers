const BASE = "https://rubygems.org/api/v1"

export class RubyGemsError extends Error {}

async function getJson(url: string, timeoutMs = 25000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "rubygems-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new RubyGemsError("Gem not found on rubygems.org")
    if (!res.ok) throw new RubyGemsError(`rubygems.org responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof RubyGemsError) throw e
    if ((e as Error).name === "AbortError") throw new RubyGemsError("rubygems.org request timed out")
    throw new RubyGemsError(`rubygems.org request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

function num(n: unknown): string {
  const v = typeof n === "number" ? n : Number(n ?? 0)
  if (!Number.isFinite(v)) return "0"
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`
  return String(v)
}

export function gemName(name: string): string {
  const n = name.trim().toLowerCase()
  if (!/^[a-z0-9_.-]{1,80}$/.test(n)) throw new RubyGemsError(`"${name}" is not a valid gem name`)
  return n
}

export async function searchGems(query: string, limit: number): Promise<string> {
  const rows = await getJson(`${BASE}/search.json?query=${encodeURIComponent(query)}&page=1`)
  const list: any[] = Array.isArray(rows) ? rows.slice(0, limit) : []
  if (list.length === 0) return `No gems matched "${query}".`
  const lines = list.map(
    (g, i) =>
      `${i + 1}. ${g.name} ${g.version} — ${num(g.downloads)} downloads\n   ${(g.info ?? "no description").replace(/\s+/g, " ").slice(0, 150)}`
  )
  return `RubyGems matches for "${query}":\n\n${lines.join("\n")}`
}

export async function gemInfo(name: string): Promise<string> {
  const g = await getJson(`${BASE}/gems/${gemName(name)}.json`)
  const rows = [
    `Gem: ${g.name} ${g.version}`,
    `Description: ${(g.info ?? "none").replace(/\s+/g, " ").slice(0, 300)}`,
    `Downloads: ${num(g.downloads)} total, ${num(g.version_downloads)} for this version`,
    `Authors: ${Array.isArray(g.authors) ? g.authors.join(", ") : g.authors ?? "unknown"}`,
    `Licenses: ${Array.isArray(g.licenses) ? g.licenses.join(", ") : g.license ?? "unknown"}`,
    `This version released: ${String(g.version_created_at ?? "").slice(0, 10)}`,
    `Homepage: ${g.homepage_uri ?? "n/a"}`,
    `Source: ${g.source_code_uri ?? "n/a"}`,
    `Documentation: ${g.documentation_uri ?? "n/a"}`,
    `Required Ruby: ${g.required_ruby_version ?? "any"}`,
  ]
  return rows.join("\n")
}

export async function gemVersions(name: string): Promise<string> {
  const rows = await getJson(`${BASE}/versions/${gemName(name)}.json`)
  const list: any[] = Array.isArray(rows) ? rows : []
  if (list.length === 0) return `No published versions for ${name}.`
  const sorted = [...list].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  const lines = sorted.slice(0, 15).map(
    (v, i) =>
      `${i + 1}. ${v.number} — ${String(v.created_at ?? "").slice(0, 10)}${v.prerelease ? " (prerelease)" : ""}${v.platform && v.platform !== "ruby" ? ` [${v.platform}]` : ""}${v.ruby_version ? `, ruby ${v.ruby_version}` : ""}`
  )
  return `${name} — newest ${lines.length} of ${list.length} versions:\n\n${lines.join("\n")}`
}

export async function latestReleases(limit: number): Promise<string> {
  const rows = await getJson(`${BASE}/activity/latest.json`)
  const list: any[] = Array.isArray(rows) ? rows.slice(0, limit) : []
  if (list.length === 0) return "RubyGems returned no recent releases."
  const lines = list.map(
    (g, i) =>
      `${i + 1}. ${g.name} ${g.version} — released ${String(g.version_created_at ?? "").slice(0, 10)}, ${num(g.downloads)} downloads\n   ${(g.info ?? "no description").replace(/\s+/g, " ").slice(0, 130)}`
  )
  return `Newest gems on rubygems.org (${list.length} shown):\n\n${lines.join("\n")}`
}

export async function reverseDependencies(name: string, limit: number): Promise<string> {
  const rows = await getJson(`${BASE}/gems/${gemName(name)}/reverse_dependencies.json`)
  const list: string[] = Array.isArray(rows) ? rows : []
  if (list.length === 0) return `No gems depend on ${name}.`
  const shown = list.slice(0, limit)
  return `Gems depending on ${name} (${list.length} total):\n\n${shown.map((g, i) => `${i + 1}. ${g}`).join("\n")}`
}

export async function gemOwners(name: string): Promise<string> {
  const rows = await getJson(`${BASE}/gems/${gemName(name)}/owners.json`)
  const list: any[] = Array.isArray(rows) ? rows : []
  if (list.length === 0) return `${name} has no listed owners.`
  return `${name} owners (${list.length}):\n\n${list.map((o, i) => `${i + 1}. ${o.handle ?? o.email ?? "unknown"}${o.email ? ` <${o.email}>` : ""}`).join("\n")}`
}
