const BASE = "https://crates.io/api/v1"
const UA = "crates-io-mcp/1.0 (https://github.com/mrfentmen/awesome-servers)"

export class CratesError extends Error {}

async function getJson(url: string, timeoutMs = 25000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": UA, accept: "application/json" },
    })
    if (res.status === 404) throw new CratesError("Crate not found on crates.io")
    if (!res.ok) throw new CratesError(`crates.io responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof CratesError) throw e
    if ((e as Error).name === "AbortError") throw new CratesError("crates.io request timed out")
    throw new CratesError(`crates.io request failed: ${(e as Error).message}`)
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

export function crateName(name: string): string {
  const n = name.trim().toLowerCase()
  if (!/^[a-z0-9_-]{1,64}$/.test(n)) throw new CratesError(`"${name}" is not a valid crate name`)
  return n
}

export async function searchCrates(query: string, limit: number, sort: string): Promise<string> {
  const url = `${BASE}/crates?q=${encodeURIComponent(query)}&per_page=${limit}&sort=${encodeURIComponent(sort)}`
  const d = await getJson(url)
  const rows: any[] = d.crates ?? []
  if (rows.length === 0) return `No crates matched "${query}".`
  const lines = rows.map(
    (c, i) =>
      `${i + 1}. ${c.name} ${c.max_version ?? ""} — ${num(c.downloads)} downloads (${num(c.recent_downloads)} recent)\n   ${(c.description ?? "no description").replace(/\s+/g, " ").slice(0, 150)}`
  )
  return `crates.io matches for "${query}" (${num(d.meta?.total)} total):\n\n${lines.join("\n")}`
}

export async function crateInfo(name: string): Promise<string> {
  const d = await getJson(`${BASE}/crates/${crateName(name)}`)
  const c = d.crate ?? {}
  const rows = [
    `Crate: ${c.name} ${c.max_version ?? ""}`,
    `Description: ${(c.description ?? "none").replace(/\s+/g, " ").slice(0, 300)}`,
    `Downloads: ${num(c.downloads)} total, ${num(c.recent_downloads)} in the last 90 days`,
    `Versions: ${c.num_versions ?? "?"}   Created: ${String(c.created_at ?? "").slice(0, 10)}   Updated: ${String(c.updated_at ?? "").slice(0, 10)}`,
    `Repository: ${c.repository ?? "n/a"}`,
    `Homepage: ${c.homepage ?? "n/a"}`,
  ]
  if (Array.isArray(c.keywords) && c.keywords.length) rows.push(`Keywords: ${c.keywords.join(", ")}`)
  if (Array.isArray(c.categories) && c.categories.length) rows.push(`Categories: ${c.categories.join(", ")}`)
  if (c.yanked) rows.push("Status: YANKED")
  return rows.join("\n")
}

export async function crateVersions(name: string, limit: number): Promise<string> {
  const d = await getJson(`${BASE}/crates/${crateName(name)}/versions?per_page=${limit}`)
  const rows: any[] = d.versions ?? []
  if (rows.length === 0) return `No published versions for ${name}.`
  const lines = rows.map(
    (v, i) =>
      `${i + 1}. ${v.num} — ${String(v.created_at ?? "").slice(0, 10)}, ${num(v.downloads)} downloads${v.yanked ? ", YANKED" : ""}${v.rust_version ? `, rust ${v.rust_version}` : ""}`
  )
  return `${name} — newest ${rows.length} of ${d.meta?.total ?? rows.length} versions:\n\n${lines.join("\n")}`
}

export async function crateOwners(name: string): Promise<string> {
  const d = await getJson(`${BASE}/crates/${crateName(name)}/owners`)
  const users: any[] = d.users ?? []
  if (users.length === 0) return `${name} has no listed owners.`
  const lines = users.map((u, i) => `${i + 1}. ${u.login ?? u.name ?? "unknown"} — ${u.name ?? ""}${u.url ? ` (${u.url})` : ""}`)
  return `${name} owners (${users.length}):\n\n${lines.join("\n")}`
}

export async function crateDependencies(name: string, version?: string): Promise<string> {
  const crate = crateName(name)
  let v = version?.trim()
  if (v && !/^[A-Za-z0-9.+_-]+$/.test(v)) throw new CratesError(`"${version}" is not a valid version`)
  if (!v) {
    const info = await getJson(`${BASE}/crates/${crate}`)
    v = info.crate?.max_version ?? info.crate?.default_version
    if (!v) throw new CratesError(`Could not determine the latest version of ${crate}`)
  }
  const d = await getJson(`${BASE}/crates/${crate}/${encodeURIComponent(v)}/dependencies`)
  const rows: any[] = d.dependencies ?? []
  if (rows.length === 0) return `${crate} ${v} declares no dependencies.`
  const kindOrder = ["normal", "build", "dev"]
  const lines: string[] = []
  for (const kind of kindOrder) {
    const group = rows.filter((r) => (r.kind ?? "normal") === kind)
    if (group.length === 0) continue
    lines.push(`${kind} (${group.length}):`)
    for (const r of group) {
      lines.push(`   ${r.crate_id} ${r.req ?? "*"}${r.optional ? " (optional)" : ""}${r.default_features === false ? " (no default features)" : ""}`)
    }
  }
  return `${crate} ${v} dependencies:\n\n${lines.join("\n")}`
}

export async function downloadTrend(name: string): Promise<string> {
  const d = await getJson(`${BASE}/crates/${crateName(name)}/downloads`)
  const rows: any[] = d.version_downloads ?? []
  if (rows.length === 0) return `No download data for ${name}.`
  const byDate = new Map<string, number>()
  for (const r of rows) {
    const day = String(r.date ?? "").slice(0, 10)
    byDate.set(day, (byDate.get(day) ?? 0) + Number(r.downloads ?? 0))
  }
  const days = [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30)
  if (days.length === 0) return `No download data for ${name}.`
  const total = days.reduce((a, [, v]) => a + v, 0)
  const newest = days[0]
  const oldest = days[days.length - 1]
  return [
    `${name} — daily downloads, newest ${days.length} days on record`,
    `Most recent day (${newest[0]}): ${num(newest[1])}`,
    `Oldest in window (${oldest[0]}): ${num(oldest[1])}`,
    `Total across window: ${num(total)}`,
    "",
    ...days.slice(0, 10).map(([day, v]) => `   ${day}: ${num(v)}`),
  ].join("\n")
}
