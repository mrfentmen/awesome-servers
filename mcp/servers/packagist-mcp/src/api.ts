const BASE = "https://packagist.org"

export class PackagistError extends Error {}

async function getJson(url: string, timeoutMs = 20000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "packagist-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new PackagistError("Package not found on Packagist")
    if (!res.ok) throw new PackagistError(`Packagist responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof PackagistError) throw e
    if ((e as Error).name === "AbortError") throw new PackagistError("Packagist request timed out")
    throw new PackagistError(`Packagist request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

function num(n: unknown): string {
  const v = typeof n === "number" ? n : Number(n ?? 0)
  if (!Number.isFinite(v)) return "0"
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`
  return String(v)
}

export function cleanName(name: string): string {
  const n = name.trim().toLowerCase()
  if (!/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/.test(n)) {
    throw new PackagistError(`"${name}" is not a valid package name — use vendor/package`)
  }
  return n
}

export async function searchPackages(query: string, limit: number): Promise<string> {
  const d = await getJson(`${BASE}/search.json?q=${encodeURIComponent(query)}&per_page=${limit}`)
  const rows: any[] = d.results ?? []
  if (rows.length === 0) return `No Packagist packages matched "${query}".`
  const lines = rows.map(
    (r, i) =>
      `${i + 1}. ${r.name} — ${num(r.downloads)} downloads, ${num(r.favers)} favers\n   ${(r.description || "no description").replace(/\s+/g, " ").slice(0, 160)}\n   ${r.repository ?? r.url}`
  )
  return `Packagist matches for "${query}" (${d.total ?? rows.length} total):\n\n${lines.join("\n")}`
}

function latestKey(pkg: any): string {
  const versions = pkg.versions ?? {}
  const keys = Object.keys(versions).filter((k) => !k.startsWith("dev-"))
  if (keys.length === 0) return Object.keys(versions)[0] ?? ""
  const stable = keys.filter((k) => !/-(alpha|beta|RC|dev)/i.test(k))
  return (stable.length ? stable : keys).sort((a, b) => {
    const da = versions[a].time ?? ""
    const db = versions[b].time ?? ""
    return db.localeCompare(da)
  })[0]
}

export async function packageInfo(name: string): Promise<string> {
  const d = await getJson(`${BASE}/packages/${cleanName(name)}.json`)
  const pkg = d.package
  if (!pkg) throw new PackagistError("Package payload was empty")
  const key = latestKey(pkg)
  const v = pkg.versions?.[key] ?? {}
  const rows = [
    `Package: ${pkg.name}`,
    `Description: ${(pkg.description || "none").replace(/\s+/g, " ").slice(0, 300)}`,
    `Downloads: ${num(pkg.downloads?.total)} total, ${num(pkg.downloads?.monthly)} this month, ${num(pkg.downloads?.daily)} today`,
    `Favers: ${num(pkg.favers)}   GitHub stars: ${num(pkg.github_stars)}`,
    `Latest version: ${v.version ?? key} (${v.time ? String(v.time).slice(0, 10) : "no date"})`,
    `PHP: ${v.require?.php ?? "unconstrained"}`,
    `Type: ${pkg.type ?? v.type ?? "library"}   Repository: ${pkg.repository ?? "n/a"}`,
  ]
  const lic = v.license
  if (lic) rows.push(`License: ${Array.isArray(lic) ? lic.join(", ") : lic}`)
  if (pkg.abandoned) rows.push(`Abandoned: ${pkg.abandoned === true ? "yes" : pkg.abandoned}`)
  return rows.join("\n")
}

export async function popularPackages(limit: number): Promise<string> {
  const d = await getJson(`${BASE}/explore/popular.json?per_page=${limit}`)
  const rows: any[] = d.packages ?? []
  if (rows.length === 0) return "Packagist returned no popular packages."
  const lines = rows.map(
    (r, i) => `${i + 1}. ${r.name} — ${num(r.downloads)} downloads, ${num(r.favers)} favers\n   ${(r.description || "no description").replace(/\s+/g, " ").slice(0, 140)}`
  )
  return `Popular Packagist packages:\n\n${lines.join("\n")}`
}

export async function packageVersions(name: string, limit: number): Promise<string> {
  const d = await getJson(`${BASE}/packages/${cleanName(name)}.json`)
  const versions = d.package?.versions ?? {}
  const keys = Object.keys(versions)
  if (keys.length === 0) return `No published versions for ${name}.`
  const sorted = keys.sort((a, b) => String(versions[b].time ?? "").localeCompare(String(versions[a].time ?? "")))
  const lines = sorted.slice(0, limit).map((k, i) => {
    const v = versions[k]
    return `${i + 1}. ${v.version ?? k} — ${v.time ? String(v.time).slice(0, 10) : "no date"}${v.require ? `, requires: ${Object.keys(v.require).slice(0, 6).join(", ")}` : ""}`
  })
  return `${d.package.name} — ${keys.length} versions (newest first):\n\n${lines.join("\n")}`
}

export async function packageDependencies(name: string): Promise<string> {
  const d = await getJson(`${BASE}/packages/${cleanName(name)}.json`)
  const pkg = d.package
  const key = latestKey(pkg)
  const v = pkg.versions?.[key] ?? {}
  const req = Object.entries(v.require ?? {})
  const dev = Object.entries(v.requireDev ?? v["require-dev"] ?? {})
  if (req.length === 0 && dev.length === 0) return `${pkg.name} ${v.version ?? key} declares no dependencies.`
  const fmt = (rows: [string, unknown][]) => rows.map(([k, val]) => `   ${k}: ${String(val)}`).join("\n")
  return [
    `${pkg.name} ${v.version ?? key} dependencies`,
    `Runtime (${req.length}):`,
    req.length ? fmt(req) : "   none",
    `Dev (${dev.length}):`,
    dev.length ? fmt(dev) : "   none",
  ].join("\n")
}

export async function registryTotals(): Promise<string> {
  const d = await getJson(`${BASE}/statistics.json`)
  const t = d.totals ?? {}
  return [
    "Packagist registry totals",
    `Packages: ${num(t.packages)}`,
    `Versions: ${num(t.versions)}`,
    `Downloads: ${num(t.downloads)}`,
  ].join("\n")
}

export async function comparePackages(a: string, b: string): Promise<string> {
  const [x, y] = await Promise.all([packageInfo(a), packageInfo(b)])
  const pick = (txt: string, key: string) => (txt.split("\n").find((l) => l.startsWith(key)) ?? "").replace(key, "").trim()
  return [
    `A: ${a}`,
    `B: ${b}`,
    "",
    `Downloads A ${pick(x, "Downloads:")}`,
    `          B ${pick(y, "Downloads:")}`,
    `Favers    A ${pick(x, "Favers:")}`,
    `          B ${pick(y, "Favers:")}`,
    `Latest    A ${pick(x, "Latest version:")}  |  B ${pick(y, "Latest version:")}`,
  ].join("\n")
}
