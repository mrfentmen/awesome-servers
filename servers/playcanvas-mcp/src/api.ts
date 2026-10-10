export class PlayCanvasError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PlayCanvasError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://playcanvas.com/api"

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new PlayCanvasError(`Set the ${name} environment variable.`)
  return v
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(BASE + path, {
    signal: AbortSignal.timeout(30000),
    headers: { ...UA, Authorization: "Bearer " + envStrict("PLAYCANVAS_ACCESS_TOKEN") },
  })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new PlayCanvasError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function listProjectAssets(projectId: string, branchId: string, limit?: string): Promise<string> {
  const p = new URLSearchParams({ branchId })
  if (limit) p.set("limit", limit)
  return req(`/projects/${encodeURIComponent(projectId)}/assets?${p.toString()}`)
}

export function getAsset(assetId: string, branchId: string): Promise<string> {
  return req(`/assets/${encodeURIComponent(assetId)}?branchId=${encodeURIComponent(branchId)}`)
}

export function getRateLimits(): Promise<string> {
  return req("/ratelimits")
}

// ---- muxH tools:
// The tools above read one project's assets behind a PlayCanvas access token.
// These two read the public side instead: what the engine has shipped and how
// fast it moves, from the npm registry and the release notes.

const ENGINE_NPM = "https://registry.npmjs.org/playcanvas"
const ENGINE_GH = "https://api.github.com/repos/playcanvas/engine"
const ENGINE_UA = "playcanvas-mcp/1.2 (https://github.com/mrfentmen/playcanvas-mcp)"

interface NpmVersion {
  version?: string
  description?: string
  license?: string
  time?: string
  engines?: Record<string, string>
  dist?: { unpackedSize?: number; fileCount?: number }
  dependencies?: Record<string, string>
  keywords?: string[]
}

interface NpmPackument {
  "dist-tags"?: Record<string, string>
  time?: Record<string, string>
  versions?: Record<string, NpmVersion>
}

interface GhRelease {
  tag_name?: string
  name?: string
  published_at?: string
  prerelease?: boolean
  body?: string
  html_url?: string
}

let packumentCache: NpmPackument | null = null

async function enginePackument(): Promise<NpmPackument> {
  if (!packumentCache) {
    const res = await fetch(ENGINE_NPM, {
      headers: { Accept: "application/json", "User-Agent": ENGINE_UA },
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) throw new PlayCanvasError(`npm registry error ${res.status} for playcanvas.`)
    packumentCache = (await res.json()) as NpmPackument
  }
  return packumentCache
}

async function engineReleases(perPage: number): Promise<GhRelease[]> {
  const res = await fetch(`${ENGINE_GH}/releases?per_page=${perPage}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": ENGINE_UA },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 403) throw new PlayCanvasError("The GitHub API rate-limited this host for unauthenticated release reads.")
  if (!res.ok) throw new PlayCanvasError(`GitHub API error ${res.status}: ${res.statusText}`)
  const body = (await res.json()) as GhRelease[] | { message?: string }
  if (!Array.isArray(body)) throw new PlayCanvasError(`GitHub returned no release list: ${body.message ?? "unknown reason"}`)
  return body
}

const isoDay = (value: string | undefined): string => (value ? value.slice(0, 10) : "not reported")

const megabytes = (bytes: unknown): string =>
  typeof bytes === "number" ? `${(bytes / 1048576).toFixed(1)} MB unpacked` : "size not reported"

const isStable = (version: string): boolean => !/-(alpha|beta|preview|dev|rc)/i.test(version)

/**
 * The engine's current release channels: what latest, lts, beta and preview all
 * point at, and how old each of those is. This is the version-picking question
 * a project has to answer before it upgrades anything.
 */
export async function engineReleaseChannels(args: { includePrerelease?: boolean }): Promise<string> {
  const pack = await enginePackument()
  const tags = pack["dist-tags"] ?? {}
  if (!Object.keys(tags).length) throw new PlayCanvasError("The npm packument for playcanvas published no dist-tags.")

  const times = pack.time ?? {}
  const versions = pack.versions ?? {}
  const rows = Object.entries(tags)
    .map(([channel, version]) => ({
      channel,
      version,
      date: isoDay(times[version]),
      days: version in times ? Math.floor((Date.now() - Date.parse(times[version])) / 86400000) : null,
      size: versions[version]?.dist?.unpackedSize,
      license: versions[version]?.license ?? "not reported",
    }))
    .sort((a, b) => (b.days ?? 0) - (a.days ?? 0))

  const stableVersions = Object.keys(versions).filter(isStable)
  const dated = stableVersions
    .map((v) => ({ v, t: times[v] }))
    .filter((row) => typeof row.t === "string")
    .sort((a, b) => (a.t < b.t ? 1 : -1))

  const lines: string[] = [
    `PlayCanvas engine release channels (npm registry)`,
    `  ${stableVersions.length} stable version(s) published in total`,
    "",
    "Channel      Version                        Published    Age        Package",
    ...rows.map((r) =>
      `  ${r.channel.padEnd(11)} ${r.version.padEnd(28)} ${r.date.padEnd(12)} ${r.days === null ? "unknown" : `${r.days}d`.padEnd(10)} ${megabytes(r.size)}`
    ),
  ]

  if (dated.length >= 2) {
    const newest = dated[0]
    const previous = dated[1]
    const gapDays = Math.round((Date.parse(previous.t as string) - Date.parse(newest.t as string)) / 86400000)
    const lts = tags.lts ? times[tags.lts] : undefined
    lines.push("")
    lines.push(`  newest stable ${newest.v} on ${isoDay(newest.t)}, ${gapDays} day(s) after ${previous.v}.`)
    lines.push(lts ? `  the lts tag points at ${tags.lts}, published ${isoDay(lts)}.` : "  no lts tag is published.")
  }
  if (args.includePrerelease === false) {
    lines.push("")
    lines.push("  dist-tags only; set include_prerelease to enumerate the alpha and beta trains.")
  }

  return lines.join("\n")
}

/**
 * The engine's release notes: what changed in each published release, pulled
 * from the GitHub release body, so a changelog can be read without a browser.
 */
export async function engineReleaseNotes(args: { limit?: number; includePrerelease?: boolean }): Promise<string> {
  const size = Math.min(Math.max(Math.trunc(args.limit ?? 6), 1), 15)
  const all = await engineReleases(size * 2)
  const rows = (args.includePrerelease ? all : all.filter((r) => r.prerelease !== true)).slice(0, size)
  if (!rows.length) throw new PlayCanvasError("No PlayCanvas engine release matched that filter.")

  return [
    `PlayCanvas engine release notes (${rows.length} release(s) from playcanvas/engine)`,
    "",
    ...rows.map((release, i) => {
      const body = String(release.body ?? "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/https:\/\/github\.com\/playcanvas\/engine\/\S+/g, "")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !/^\*\*Full Changelog/i.test(line))
        .slice(0, 8)
        .map((line) => `      ${line}`)
      return [
        `${String(i + 1).padStart(2)}. ${release.tag_name ?? release.name ?? "untagged"}${release.prerelease ? " (prerelease)" : ""} — published ${isoDay(release.published_at)}`,
        ...body,
        ...(body.length === 0 ? ["      no release notes published"] : []),
        release.html_url ? `      ${release.html_url}` : "",
      ].filter((line) => line !== "")
    }),
    "",
    "Source: GitHub releases for playcanvas/engine, read unauthenticated.",
  ].join("\n")
}
