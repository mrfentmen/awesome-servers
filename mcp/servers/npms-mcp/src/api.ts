/**
 * npms.io API client, keyless.
 * Docs: https://api-docs.npms.io/
 * Scores package quality/popularity/maintenance — use before adding a dependency.
 */
const BASE = "https://api.npms.io/v2"

export class NpmsError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "npms-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new NpmsError("No such package on npms.io.")
  if (!res.ok) throw new NpmsError(`npms.io error ${res.status}`)
  return (await res.json()) as T
}

export interface ScoredPackage {
  name: string
  version?: string
  description?: string
  final?: number
  quality?: number
  popularity?: number
  maintenance?: number
  links?: string
}

function scored(name: string, collected: Raw, score: Raw): ScoredPackage {
  const d = (score.detail ?? {}) as Raw
  const links = (collected.links ?? {}) as Raw
  const meta = (collected.metadata ?? {}) as Raw
  const common = (collected.common ?? {}) as Raw
  return {
    name,
    version: meta.version || common?.tags?.latest,
    description: collected.description,
    final: score.final,
    quality: d.quality,
    popularity: d.popularity,
    maintenance: d.maintenance,
    links: links.repository || links.homepage || links.npm,
  }
}

export async function searchPackages(query: string, limit = 5): Promise<ScoredPackage[]> {
  const data = await getJson<Raw>(`/search?q=${encodeURIComponent(query)}&size=${Math.min(Math.max(limit, 1), 25)}`)
  const rows: Raw[] = Array.isArray(data.results) ? data.results : []
  return rows.slice(0, limit).map((r) => scored(String(r.package?.name ?? "?"), r.package ?? {}, r.score ?? {}))
}

export async function getPackage(name: string): Promise<ScoredPackage> {
  const data = await getJson<Raw>(`/package/${encodeURIComponent(name.trim())}`)
  return scored(String(data.collected?.name ?? name), data.collected ?? {}, data.score ?? {})
}

const pct = (n?: number): string => (n === undefined ? "?" : `${Math.round(n * 100)}%`)

export function formatScored(p: ScoredPackage, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}${p.name}${p.version ? ` ${p.version}` : ""} — score ${pct(p.final)} (quality ${pct(p.quality)} / popularity ${pct(p.popularity)} / maintenance ${pct(p.maintenance)})`,
    p.description ? `${p.description}` : "",
    p.links ? `${p.links}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxC tools:

interface NpmsDownloads {
  analyzedAt?: string
  collected?: {
    metadata?: { name?: string; version?: string }
    npm?: {
      downloads?: Array<{ from?: string; to?: string; count?: number }>
      starsCount?: number
    }
    github?: {
      homepage?: string
      starsCount?: number
      forksCount?: number
      subscribersCount?: number
      issues?: { count?: number; openCount?: number; distribution?: Record<string, number> }
    }
    source?: {
      files?: { readmeSize?: number; testsSize?: number; hasChangelog?: boolean }
      linters?: string[]
      coverage?: number
      outdatedDependencies?: string | number
    }
  }
}

async function npmsPackage(name: string): Promise<{ pkg: NpmsDownloads; label: string }> {
  const clean = (name ?? "").trim()
  if (!clean) throw new NpmsError("Provide a package name, e.g. express")
  const d = await getJson<NpmsDownloads>(`/package/${encodeURIComponent(clean)}`)
  return { pkg: d, label: d?.collected?.metadata?.name ?? clean }
}

