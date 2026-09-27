/**
 * PyPI JSON API client, keyless.
 * Docs: https://warehouse.pypa.io/api-reference/json.html
 */
const BASE = "https://pypi.org/pypi"

export class PypiError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "pypi-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  })
  if (res.status === 404) throw new PypiError("No such package or release on PyPI.")
  if (!res.ok) throw new PypiError(`PyPI error ${res.status}`)
  return (await res.json()) as T
}

export interface PackageInfo {
  name: string
  version: string
  summary?: string
  author?: string
  license?: string
  homePage?: string
  requiresPython?: string
  requiresDist: string[]
  releases: string[]
}

function infoOf(name: string, data: Raw): PackageInfo {
  const info: Raw = data.info ?? {}
  const releases: Raw = data.releases ?? {}
  return {
    name: String(info.name ?? name),
    version: String(info.version ?? "?"),
    summary: info.summary || undefined,
    author: info.author || undefined,
    license: info.license || undefined,
    homePage: info.home_page || info.project_url || undefined,
    requiresPython: info.requires_python || undefined,
    requiresDist: Array.isArray(info.requires_dist) ? info.requires_dist.map(String).slice(0, 12) : [],
    releases: Object.keys(releases).slice(-8),
  }
}

export async function getPackage(name: string): Promise<PackageInfo> {
  return infoOf(name, await getJson<Raw>(`/${encodeURIComponent(name.trim())}/json`))
}

export interface ReleaseFile {
  filename: string
  packagetype?: string
  pythonVersion?: string
  size?: number
  url?: string
}

export async function getReleaseFiles(name: string, version: string): Promise<ReleaseFile[]> {
  const data = await getJson<Raw>(`/${encodeURIComponent(name.trim())}/${encodeURIComponent(version.trim())}/json`)
  const urls: Raw[] = Array.isArray(data.urls) ? data.urls : []
  return urls.slice(0, 10).map((u) => ({
    filename: String(u.filename ?? "?"),
    packagetype: u.packagetype,
    pythonVersion: u.python_version && u.python_version !== "source" ? String(u.python_version) : undefined,
    size: typeof u.size === "number" ? u.size : undefined,
    url: u.url,
  }))
}

const fmtSize = (n?: number): string =>
  n === undefined ? "" : n > 1048576 ? ` (${(n / 1048576).toFixed(1)} MB)` : n > 1024 ? ` (${(n / 1024).toFixed(0)} KB)` : ""

export function formatPackage(p: PackageInfo): string {
  const lines = [
    `${p.name} ${p.version}`,
    p.summary ? `${p.summary}` : "",
    p.author ? `Author: ${p.author}` : "",
    p.license ? `License: ${p.license}` : "",
    p.homePage ? `Home: ${p.homePage}` : "",
    p.requiresPython ? `Requires Python: ${p.requiresPython}` : "",
    p.requiresDist.length ? `Requires: ${p.requiresDist.join(", ")}` : "",
    p.releases.length ? `Recent releases: ${p.releases.join(", ")}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatFiles(name: string, version: string, files: ReleaseFile[]): string {
  if (files.length === 0) return `No files for ${name} ${version}.`
  return (
    `Files for ${name} ${version}:\n\n` +
    files.map((f, i) => `${i + 1}. ${f.filename}${f.packagetype ? ` (${f.packagetype}${f.pythonVersion ? `, py${f.pythonVersion}` : ""})` : ""}${fmtSize(f.size)}${f.url ? `\n   ${f.url}` : ""}`).join("\n")
  )
}

export async function versionDetails(name: string, version: string): Promise<PackageInfo> {
  return infoOf(name, await getJson<Raw>(`/${encodeURIComponent(name.trim())}/${encodeURIComponent(version.trim())}/json`))
}

export async function fileIndex(name: string): Promise<string[]> {
  const res = await fetch(`https://pypi.org/simple/${encodeURIComponent(name.trim())}/`, {
    headers: { "User-Agent": "pypi-mcp/1.0", Accept: "text/html" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new PypiError(`PyPI simple index error ${res.status}`)
  const html = await res.text()
  const files = [...html.matchAll(/<a[^>]*>([^<]+)<\/a>/g)].map((m) => m[1].trim()).filter(Boolean)
  return files.slice(0, 30)
}

export async function projectLinks(name: string): Promise<string> {
  const p = await getPackage(name)
  const data = await getJson<Raw>(`/${encodeURIComponent(name.trim())}/json`)
  const urls = (data.info?.project_urls ?? {}) as Record<string, string>
  const entries = Object.entries(urls)
  if (!entries.length) return `No project links for ${p.name}.`
  return entries.map(([k, v]) => `${k}: ${v}`).join("\n")
}

export async function releaseHistory(name: string): Promise<string[]> {
  const p = await getPackage(name)
  return p.releases
}
