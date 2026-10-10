const BASE = "https://repo.packagist.org"
const UA = "mrfentmen-packagist-mcp/1.0 (https://github.com/mrfentmen)"
export class PackagistError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new PackagistError("Packagist rate limit hit, wait and retry")
  if (!res.ok) throw new PackagistError(`Packagist error ${res.status}`)
  return (await res.json()) as T
}

export async function packageInfo(args: { name?: string }): Promise<string> {
  const name = (args.name ?? "").trim().toLowerCase()
  if (!name) throw new PackagistError("Provide a package name like vendor/package")
  if (!name.includes("/")) throw new PackagistError("Package names look like vendor/package")
  const d = await get<any>(`${BASE}/p2/${encodeURIComponent(name)}.json`)
  const pkg = d?.packages?.[name]?.[0]
  if (!pkg) throw new PackagistError("Package not found")
  const desc = pkg?.description ?? "n/a"
  const versions = (d?.packages?.[name] ?? []).length
  return `Package: ${name}\nDescription: ${desc}\nLatest version: ${pkg.version ?? "n/a"}\nVersions listed: ${versions}\nLicense: ${Array.isArray(pkg.license) ? pkg.license.join(", ") : (pkg.license ?? "n/a")}\nHomepage: ${pkg.homepage ?? pkg.source?.url ?? "n/a"}\nRequires php: ${pkg.require?.php ?? "any"}`
}

export async function searchPackages(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new PackagistError("Provide search terms")
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any>(`https://packagist.org/search.json?q=${encodeURIComponent(q)}`)
  const results = d?.results ?? []
  if (!results.length) return "No packages found"
  return results.slice(0, limit).map((r: any, i: number) => `${i + 1}. ${r.name} ${r.description ? `\n   ${r.description.slice(0, 120)}` : ""}`).join("\n")
}

// ---- muxF tools:
const PACKAGIST = "https://packagist.org"

interface VersionRow {
  version?: string
  version_normalized?: string
  time?: string
  license?: string[] | string | null
  abandoned?: string | boolean | null
  type?: string
  require?: Record<string, string> | null
  homepage?: string
  keywords?: string[] | null
}

interface PackagePayload {
  package?: {
    name?: string
    description?: string
    type?: string
    time?: string
    repository?: string
    downloads?: { total?: number; monthly?: number; daily?: number }
    favers?: number
    github_stars?: number
    github_watchers?: number
    github_forks?: number
    github_open_issues?: number
    language?: string
    dependents?: number
    suggesters?: number
    maintainers?: Array<{ name?: string }>
    versions?: Record<string, VersionRow>
  }
}

function bound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

function or(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : 'not reported'
}

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function stable(v: VersionRow): boolean {
  return /^\d+\.\d+\.\d+$/.test(String(v.version ?? ''))
}

function nameOf(args: { name?: string }): string {
  const name = (args.name ?? '').trim().toLowerCase()
  if (!name) throw new PackagistError('Provide a package name like vendor/package')
  if (!name.includes('/')) throw new PackagistError('Package names look like vendor/package')
  return name
}

async function packagePayload(name: string): Promise<PackagePayload> {
  const d = await get<PackagePayload>(`${PACKAGIST}/packages/${encodeURIComponent(name)}.json`)
  if (!d?.package) throw new PackagistError(`Package not found: ${name}`)
  return d
}

/** Audit a package's own requirements across its releases: which versions depend on a given package and at what constraint. */
export async function requirementScan(args: { name?: string; requirement?: string; limit?: number }) {
  const name = nameOf(args)
  const requirement = (args.requirement ?? 'php').trim()
  if (!requirement) throw new PackagistError('Provide the requirement to scan for, for example php, psr/log or ext-json.')
  const limit = bound(args.limit, 5, 30, 12)
  const d = await packagePayload(name)
  const p = d.package as NonNullable<PackagePayload['package']>
  const versions = Object.values(p.versions ?? {}).filter(stable)
  if (!versions.length) throw new PackagistError(`Packagist lists no stable releases for ${name}.`)
  const ordered = [...versions].sort((a, b) => Date.parse(String(a.time ?? '')) - Date.parse(String(b.time ?? '')))
  const requires = ordered.filter((v) => Object.prototype.hasOwnProperty.call(v.require ?? {}, requirement))
  const constraints = new Map<string, number>()
  for (const v of requires) {
    const c = String((v.require ?? {})[requirement])
    constraints.set(c, (constraints.get(c) ?? 0) + 1)
  }
  const changes: string[] = []
  let last: string | null = null
  for (const v of requires) {
    const c = String((v.require ?? {})[requirement])
    if (c !== last) {
      changes.push(`${or(v.version)} -> ${c}`)
      last = c
    }
  }
  const totalDeps = ordered.map((v) => Object.keys(v.require ?? {}).length)
  const medianDeps = median(totalDeps)
  return [
    `Requirement scan of ${p.name ?? name} for "${requirement}"`,
    `Stable releases scanned: ${ordered.length}, from ${or(ordered[0]?.version)} to ${or(ordered[ordered.length - 1]?.version)}`,
    `Releases that declare it: ${requires.length} of ${ordered.length} (${ordered.length ? ((requires.length / ordered.length) * 100).toFixed(1) : '0.0'}%)`,
    constraints.size ? `Distinct constraints used: ${[...constraints.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} (${n} release(s))`).join(', ')}` : 'No stable release declares it.',
    changes.length ? `Constraint changes over the history: ${changes.slice(-limit).join(' | ')}` : 'The constraint never changed across the stable history.',
    medianDeps === null ? 'Dependencies per release: not reported' : `Dependencies per release: median ${medianDeps}, minimum ${Math.min(...totalDeps)}, maximum ${Math.max(...totalDeps)}`,
    `Widest requirement sets: ${[...ordered].sort((a, b) => Object.keys(b.require ?? {}).length - Object.keys(a.require ?? {}).length).slice(0, 3).map((v) => `${or(v.version)} (${Object.keys(v.require ?? {}).length})`).join(', ')}`,
    requires.length ? `Oldest release declaring it: ${or(requires[0]?.version)} | newest: ${or(requires[requires.length - 1]?.version)}` : 'No release declares it, so it was never a declared dependency of a stable release.',
  ].join('\n')
}
