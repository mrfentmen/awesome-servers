/**
 * npm Registry — keyless public API client.
 */
const BASE = "https://registry.npmjs.org"
const SOURCE = "npm Registry"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "npm-registry-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

const DOWNLOADS = "https://api.npmjs.org/downloads"

function checkName(value: string): string {
  const name = clean(value).toLowerCase()
  if (!/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)) {
    throw new SourceError(`"${value}" is not a valid npm package name`)
  }
  return name
}

async function fetchJson(url: string, accept = "application/json", timeoutMs = 20000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept, "user-agent": "npm-registry-mcp" } })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    const body = await res.text()
    try {
      return JSON.parse(body)
    } catch {
      throw new SourceError(`${SOURCE} returned malformed JSON`)
    }
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

async function weeklyDownloads(name: string): Promise<string> {
  try {
    const body = await fetchJson(`${DOWNLOADS}/point/last-week/${encodeURIComponent(name)}`, "application/json", 12000)
    return typeof body?.downloads === "number" ? body.downloads.toLocaleString("en-US") : ""
  } catch {
    return ""
  }
}

export async function packageInfo(a: { name: string }): Promise<string> {
  const name = checkName(a.name)
  const body = await fetchJson(`${BASE}/${name}`)
  const latest = body?.["dist-tags"]?.latest
  if (!latest) throw new SourceError(`${name} has no latest tag — the package may be unpublished`)
  const version = body.versions?.[latest] ?? {}
  const downloads = await weeklyDownloads(name)
  const deps = Object.keys(version.dependencies ?? {}).length
  const maintainers: any[] = body.maintainers ?? []
  const time = body.time?.[latest]
  return [
    `${name} ${latest}`,
    "",
    bullet("description", version.description),
    bullet("license", version.license),
    bullet("published", time),
    bullet("dependencies", deps),
    bullet("dist files", version.dist?.fileCount),
    bullet("unpacked size", version.dist?.unpackedSize ? `${Math.round(version.dist.unpackedSize / 1024)} kB` : ""),
    bullet("maintainers", maintainers.map((m) => m.name).slice(0, 5).join(", ")),
    bullet("weekly downloads", downloads),
    bullet("homepage", version.homepage),
    bullet("repository", typeof version.repository === "string" ? version.repository : version.repository?.url),
    bullet("versions published", Object.keys(body.versions ?? {}).length),
  ]
    .filter(Boolean)
    .join("\n")
}

export async function searchPackages(a: { query: string; limit?: number }): Promise<string> {
  const query = clean(a.query)
  if (query.length < 2) throw new SourceError("query must be at least 2 characters")
  const size = clampLimit(a.limit, 10, 25)
  const body = await fetchJson(`${BASE}/-/v1/search?text=${encodeURIComponent(query)}&size=${size}`)
  const rows: any[] = Array.isArray(body?.objects) ? body.objects : []
  if (!rows.length) throw new SourceError(`no npm packages match "${query}"`)
  return [
    `${body.total ?? rows.length} package(s) match "${query}" (showing ${rows.length}):`,
    "",
    ...rows.map((row: any, i: number) => {
      const pkg = row.package ?? {}
      const score = row.score?.final ? ` · score ${row.score.final.toFixed(2)}` : ""
      return `${String(i + 1).padStart(3)}. ${pkg.name}@${pkg.version}${score}\n     ${String(pkg.description ?? "").slice(0, 120)}`
    }),
  ].join("\n")
}

export async function packageVersions(a: { name: string; limit?: number }): Promise<string> {
  const name = checkName(a.name)
  const limit = clampLimit(a.limit, 12, 50)
  const body = await fetchJson(`${BASE}/${name}`)
  const time: Record<string, string> = body?.time ?? {}
  const versions = Object.keys(body?.versions ?? {})
  if (!versions.length) throw new SourceError(`${name} has no published versions`)
  const recent = versions
    .map((v) => ({ version: v, at: time[v] ?? "" }))
    .sort((x, y) => (x.at < y.at ? 1 : -1))
    .slice(0, limit)
  return [
    `${versions.length} version(s) of ${name}, newest ${recent.length}:`,
    "",
    ...recent.map((r) => `${r.version.padEnd(18)} ${r.at}`),
    "",
    bullet("created", time.created),
    bullet("modified", time.modified),
  ]
    .filter(Boolean)
    .join("\n")
}
