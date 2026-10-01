export class SentryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SentryError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.SENTRY_AUTH_TOKEN;
  if (!k) throw new SentryError("Set SENTRY_AUTH_TOKEN (Sentry auth token).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://sentry.io/api/0" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new SentryError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new SentryError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listOrgs(): Promise<string> {
  return get("/organizations/");
}

export function orgProjects(org: string): Promise<string> {
  return get(`/organizations/${encodeURIComponent(org)}/projects/`);
}

export function orgIssues(org: string): Promise<string> {
  return get(`/organizations/${encodeURIComponent(org)}/issues/?statsPeriod=24h`);
}



export function issueDetails(org: string, issueId: string): Promise<string> {
  return get(`/organizations/${encodeURIComponent(org)}/issues/${encodeURIComponent(issueId)}/`);
}

export function issueEvents(org: string, issueId: string): Promise<string> {
  return get(`/organizations/${encodeURIComponent(org)}/issues/${encodeURIComponent(issueId)}/events/`);
}

export function projectDetails(org: string, project: string): Promise<string> {
  return get(`/projects/${encodeURIComponent(org)}/${encodeURIComponent(project)}/`);
}

export function teams(org: string): Promise<string> {
  return get(`/organizations/${encodeURIComponent(org)}/teams/`);
}

export function members(org: string): Promise<string> {
  return get(`/organizations/${encodeURIComponent(org)}/members/`);
}

export function releases(org: string): Promise<string> {
  return get(`/organizations/${encodeURIComponent(org)}/releases/`);
}

export function eventDetails(org: string, issueId: string, eventId: string): Promise<string> {
  return get(`/organizations/${encodeURIComponent(org)}/issues/${encodeURIComponent(issueId)}/events/${encodeURIComponent(eventId)}/`);
}

// ---- muxH tools:
// The tools above read a Sentry organisation. These two read the thing an
// error-monitoring engineer actually has to keep an eye on: whether the client
// SDK they depend on is drifting, and how fast the package they track ships.

const REGISTRY = "https://registry.npmjs.org"
const ST_UA = "sentry-mcp/1.2 (https://github.com/mcfentmen/sentry-mcp)"

interface NpmTime {
  created?: string
  modified?: string
  [version: string]: string | undefined
}

interface NpmVersion {
  version?: string
  engines?: Record<string, string>
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  dist?: { unpackedSize?: number }
  deprecated?: string
  license?: string
}

interface NpmPackument {
  name?: string
  "dist-tags"?: Record<string, string>
  time?: NpmTime
  versions?: Record<string, NpmVersion>
  description?: string
  license?: string
  homepage?: string
}

const REGISTRY_DECODE = (name: string): string => name.replace("/", "%2f")

async function packument(name: string): Promise<NpmPackument> {
  const res = await fetch(`${REGISTRY}/${REGISTRY_DECODE(name)}`, {
    headers: { Accept: "application/json", "User-Agent": ST_UA },
    signal: AbortSignal.timeout(30000),
  })
  if (res.status === 404) throw new SentryError(`The npm registry has no package called "${name}".`)
  if (!res.ok) throw new SentryError(`npm registry error ${res.status}: ${res.statusText}`)
  return (await res.json()) as NpmPackument
}

const isPrerelease = (version: string): boolean => /-(alpha|beta|rc|next|canary|dev|pre)/i.test(version)

interface ReleasePoint {
  version: string
  at: number
}

function stableReleases(pack: NpmPackument): ReleasePoint[] {
  const times = pack.time ?? {}
  return Object.keys(pack.versions ?? {})
    .filter((version) => !isPrerelease(version) && version in times)
    .map((version) => ({ version, at: Date.parse(String(times[version])) }))
    .filter((row) => Number.isFinite(row.at))
    .sort((a, b) => a.at - b.at)
}

const days = (ms: number): string => `${(ms / 86400000).toFixed(1)} days`

const size = (bytes: unknown): string =>
  typeof bytes === "number" ? `${(bytes / 1048576).toFixed(2)} MB unpacked` : "size not reported"

/**
 * The release channels a package publishes right now, how fast each one moves,
 * and what the latest release requires of the host. For a client SDK this is the
 * difference between being current and being quietly unsupported.
 */
export async function releaseFeed(args: { package: string; limit?: number }): Promise<string> {
  const name = (args.package ?? "").trim()
  if (!name) throw new SentryError("Give a package name, e.g. '@sentry/node' or 'express'.")
  const size_ = Math.min(Math.max(Number(args.limit) || 8 || 8, 1), 20)
  const pack = await packument(name)

  const tags = pack["dist-tags"] ?? {}
  if (!Object.keys(tags).length) throw new SentryError(`${name} publishes no dist-tags, so it has no release channels.`)
  const times = pack.time ?? {}
  const releases = stableReleases(pack)
  const latestVersion = tags.latest ?? releases[releases.length - 1]?.version
  const latest = latestVersion ? pack.versions?.[latestVersion] : undefined

  const channelRows = Object.entries(tags)
    .map(([channel, version]) => {
      const at = times[version] ? Date.parse(String(times[version])) : Number.NaN
      return { channel, version, at, ageDays: Number.isFinite(at) ? Math.floor((Date.now() - at) / 86400000) : null }
    })
    .sort((a, b) => (b.ageDays ?? Number.POSITIVE_INFINITY) - (a.ageDays ?? Number.POSITIVE_INFINITY))

  // Cadence over the last year of stable releases.
  const yearAgo = Date.now() - 365 * 86400000
  const recent = releases.filter((row) => row.at >= yearAgo)
  const gaps: number[] = []
  for (let i = 1; i < recent.length; i += 1) gaps.push(recent[i].at - recent[i - 1].at)
  const meanGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null

  const deprecated = Object.entries(pack.versions ?? {}).filter(([, v]) => typeof v.deprecated === "string")
  const engines = latest?.engines ?? {}

  return [
    `Release feed: ${pack.name ?? name}${pack.description ? ` — ${pack.description.slice(0, 90)}` : ""}`,
    `  licence ${pack.license ?? latest?.license ?? "not reported"}${pack.homepage ? ` | ${pack.homepage}` : ""}`,
    `  published ${String(times.created ?? "not reported").slice(0, 10)}, last touched ${String(times.modified ?? "not reported").slice(0, 10)}`,
    `  ${Object.keys(pack.versions ?? {}).length} version(s) in total, ${releases.length} of them stable`,
    "",
    "Channels:",
    ...channelRows.map((row) =>
      `  ${row.channel.padEnd(10)} ${row.version.padEnd(16)} ${Number.isFinite(row.at) ? String(times[row.version]).slice(0, 10) : "date not reported"}${row.ageDays === null ? "" : `  (${row.ageDays} day(s) old)`}`
    ),
    "",
    "Release cadence:",
    meanGap
      ? `  ${recent.length} stable release(s) in the last year, one every ${days(meanGap)} on average`
      : "  fewer than two stable releases in the last year, so the cadence cannot be computed",
    `  first stable: ${releases[0] ? `${releases[0].version} on ${String(times[releases[0].version]).slice(0, 10)}` : "none recorded"}`,
    "",
    `Latest stable, ${latestVersion}:`,
    `  host requirement: ${engines.node ? `node ${engines.node}` : Object.keys(engines).length ? JSON.stringify(engines) : "none declared"}`,
    `  package size: ${size(latest?.dist?.unpackedSize)}`,
    latest?.dependencies && Object.keys(latest.dependencies).length
      ? `  direct dependencies (${Object.keys(latest.dependencies).length}): ${Object.entries(latest.dependencies).slice(0, 10).map(([k, v]) => `${k}@${v}`).join(", ")}`
      : "  no runtime dependencies",
    latest?.peerDependencies && Object.keys(latest.peerDependencies).length
      ? `  peer dependencies: ${Object.entries(latest.peerDependencies).map(([k, v]) => `${k}@${v}`).join(", ")}`
      : "",
    latest?.deprecated ? `  DEPRECATED: ${latest.deprecated}` : "",
    "",
    "Most recent stable releases:",
    ...releases.slice(-size_).reverse().map((row) => `  ${String(times[row.version]).slice(0, 10)}  ${row.version}`),
    "",
    deprecated.length ? `  ${deprecated.length} version(s) in this package carry a deprecation notice; the list is long and is not shown.` : "  no version in this package is deprecated.",
    "Source: the public npm registry.",
  ]
    .filter((line) => line !== "")
    .join("\n")
}

/**
 * How a package's runtime dependency surface has changed across its recent
 * releases, which is what decides whether an upgrade is safe: what each release
 * added, dropped and moved, and how the transitive count has moved with it.
 */
export async function dependencyDrift(args: { package: string; releases?: number }): Promise<string> {
  const name = (args.package ?? "").trim()
  if (!name) throw new SentryError("Give a package name.")
  const count = Math.min(Math.max(Number(args.releases) || 6 || 6, 2), 20)
  const pack = await packument(name)
  const releases = stableReleases(pack).slice(-count)
  if (releases.length < 2) {
    throw new SentryError(`${name} has fewer than two stable releases, so there is no drift to measure.`)
  }

  const dependencySet = (version: string | undefined): Set<string> => new Set(Object.keys(pack.versions?.[version ?? ""]?.dependencies ?? {}))
  const lines: string[] = []
  let previous: Set<string> | null = null
  let previousVersion = ""
  const totalAtEnd = releases.map((row) => ({ version: row.version, deps: dependencySet(row.version) }))

  for (const row of totalAtEnd) {
    if (previous) {
      const added = [...row.deps].filter((d) => !previous?.has(d))
      const removed = [...previous].filter((d) => !row.deps.has(d))
      const kept = [...row.deps].filter((d) => previous?.has(d)).length
      lines.push(
        `  ${previousVersion} -> ${row.version}: ${kept} kept, ${added.length} added, ${removed.length} removed${row.deps.size !== previous.size ? `, net ${row.deps.size - previous.size > 0 ? "+" : ""}${row.deps.size - previous.size}` : ""}`
      )
      if (added.length) lines.push(`      added: ${added.join(", ")}`)
      if (removed.length) lines.push(`      removed: ${removed.join(", ")}`)
    }
    previous = row.deps
    previousVersion = row.version
  }

  const first = totalAtEnd[0]
  const last = totalAtEnd[totalAtEnd.length - 1]
  const netChange = (last?.deps.size ?? 0) - (first?.deps.size ?? 0)

  return [
    `Dependency drift in ${pack.name ?? name}`,
    `  across the last ${totalAtEnd.length} stable release(s), from ${first?.version} to ${last?.version}`,
    `  direct dependencies went ${first?.deps.size ?? 0} -> ${last?.deps.size ?? 0}, a net ${netChange >= 0 ? "increase" : "decrease"} of ${Math.abs(netChange)}`,
    "",
    "Step by step:",
    ...(lines.length ? lines : ["  no change between any two adjacent releases in this window"]),
    "",
    netChange > 0
      ? "The dependency surface is growing, so each upgrade pulls in more code than the last."
      : netChange < 0
        ? "The dependency surface is shrinking, so upgrades are getting cheaper in transitive code."
        : "The dependency surface is flat across this window, so upgrades change the package's own code only.",
    "",
    "These are direct runtime dependencies as declared in each version's manifest; what they pull in transitively is not counted.",
    "Source: the public npm registry.",
  ].join("\n")
}
