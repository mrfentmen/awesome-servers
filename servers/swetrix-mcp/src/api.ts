export class SwetrixError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SwetrixError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new SwetrixError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("SWETRIX_API_KEY") };
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new SwetrixError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listProjects(): Promise<string> {
  let url = `https://api.swetrix.com/v1/project`;
  const data = await req(url);
  return pretty(data);
}

export async function getProject(projectId: string): Promise<string> {
  let url = `https://api.swetrix.com/v1/project/${encodeURIComponent(String(projectId))}`;
  const data = await req(url);
  return pretty(data);
}

// ---- muxG tools:
const SW_NPM = "https://registry.npmjs.org/swetrix"
const SW_DOWNLOADS = "https://api.npmjs.org/downloads/point/last-week"
const SW_GITHUB = "https://api.github.com/repos/swetrix/swetrix"
const SW_LIST_CAP = 10

async function swJson<T>(url: string, accept = "application/json"): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": "awesome-mcp/1.0", Accept: accept }, signal: AbortSignal.timeout(40000) })
  if (res.status === 404) throw new SwetrixError(`Not found: ${url.replace(/^https:\/\//, "")}`)
  if (res.status === 403 || res.status === 429) throw new SwetrixError("GitHub or npm is rate limiting this IP. Wait a minute and try again.")
  if (!res.ok) throw new SwetrixError(`Returned ${res.status} for ${url.replace(/^https:\/\//, "")}`)
  return (await res.json()) as T
}

function swBound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

interface SwCampaign {
  raw: string
  source: string | null
  medium: string | null
  campaign: string | null
  term: string | null
  content: string | null
  path: string
  host: string
  otherParams: string[]
}

/** Parse the campaign parameters out of a set of URLs and report what is missing or malformed. */
export async function campaignParameters(args: { urls?: string; limit?: number }): Promise<string> {
  const raw = String(args?.urls ?? "").trim()
  if (!raw) throw new SwetrixError("urls is empty. Paste one URL per line.")
  if (raw.length > 30000) throw new SwetrixError(`urls is ${raw.length} characters, over the 30000 limit.`)
  const limit = swBound(args?.limit, 1, SW_LIST_CAP * 2, 12)
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) throw new SwetrixError("urls contains only blank lines.")

  const rows: SwCampaign[] = []
  const unparseable: string[] = []
  for (const line of lines) {
    let u: URL
    try {
      u = new URL(/^https?:\/\//i.test(line) ? line : `https://${line}`)
    } catch {
      unparseable.push(line)
      continue
    }
    const p = u.searchParams
    rows.push({
      raw: line,
      host: u.hostname,
      path: u.pathname || "/",
      source: p.get("utm_source"),
      medium: p.get("utm_medium"),
      campaign: p.get("utm_campaign"),
      term: p.get("utm_term"),
      content: p.get("utm_content"),
      otherParams: [...p.keys()].filter((k) => !/^utm_/i.test(k)),
    })
  }

  const withAny = rows.filter((r) => r.source || r.medium || r.campaign)
  const none = rows.filter((r) => !r.source && !r.medium && !r.campaign)
  const partial = rows.filter((r) => [r.source, r.medium, r.campaign].filter(Boolean).length < 3 && (r.source || r.medium || r.campaign))
  const campaigns = new Map<string, number>()
  const sources = new Map<string, number>()
  const mediums = new Map<string, number>()
  const hosts = new Map<string, number>()
  for (const r of withAny) {
    const key = r.campaign ?? "(no utm_campaign)"
    campaigns.set(key, (campaigns.get(key) ?? 0) + 1)
    if (r.source) sources.set(r.source, (sources.get(r.source) ?? 0) + 1)
    if (r.medium) mediums.set(r.medium, (mediums.get(r.medium) ?? 0) + 1)
    hosts.set(r.host, (hosts.get(r.host) ?? 0) + 1)
  }
  const bump = (m: Map<string, number>): string[] =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${String(v).padStart(4)}  ${k.slice(0, 70)}`)

  const out: string[] = [
    "Campaign parameter audit, computed locally from the URLs you supplied",
    `${lines.length} URL(s): ${rows.length} parsed, ${unparseable.length} could not be parsed as a URL`,
    `Carrying at least one utm_ parameter: ${withAny.length}; carrying none at all: ${none.length}; partially tagged: ${partial.length}`,
    "",
  ]

  if (withAny.length) {
    out.push(
      `Campaigns (${campaigns.size}):`,
      ...bump(campaigns),
      "",
      "Sources:",
      ...bump(sources),
      "",
      "Mediums:",
      ...bump(mediums),
      "",
    )
  }

  out.push(
    `Hosts: ${hosts.size ? "" : "none parsed"}`,
    ...bump(hosts),
    "",
  )

  const problems: string[] = []
  if (partial.length) {
    problems.push(
      `${partial.length} URL(s) are only partly tagged, so they will be split across dimensions in any report: ${partial.slice(0, 3).map((r) => `${r.path} (${[r.source, r.medium, r.campaign].filter(Boolean).join("/") || "one parameter only"})`).join("; ")}`
    )
  }
  const anyTerm = rows.filter((r) => r.term)
  if (!anyTerm.length) problems.push("no utm_term anywhere, so paid search keywords are not being captured")
  const anyContent = rows.filter((r) => r.content)
  if (!anyContent.length) problems.push("no utm_content anywhere, so you cannot separate two creatives or placements inside one campaign")
  for (const r of withAny) {
    if (r.source && r.source !== r.source.toLowerCase()) {
      problems.push(`source "${r.source}" is not lowercase, so "Google" and "google" will be counted as two sources`)
      break
    }
  }
  const mixedCaseMedium = withAny.find((r) => r.medium && r.medium !== r.medium.toLowerCase())
  if (mixedCaseMedium) problems.push(`medium "${mixedCaseMedium.medium}" is not lowercase, which splits the same channel across rows`)
  if (unparseable.length) problems.push(`${unparseable.length} line(s) were not valid URLs: ${unparseable.slice(0, 3).map((u) => u.slice(0, 60)).join("; ")}`)
  const extraParams = new Set(rows.flatMap((r) => r.otherParams))
  if (extraParams.size) problems.push(`non-utm query parameters present, which are usually session or click ids rather than campaign data: ${[...extraParams].slice(0, 6).join(", ")}`)

  out.push(
    problems.length ? "Problems found:" : "No parameter problem found in what you supplied.",
    ...problems.map((p) => `  - ${p}`),
    "",
    "Analytics tools agree on names and case, not on everything else: utm_source and utm_medium and utm_campaign are the near-universal three, while term and content are the ones most often left out. Lowercase matters because a report treats Source and source as two different values.",
    "This reads the URLs as text. It cannot tell you whether the tags are being received by your analytics tool, which is the failure that actually costs you the data.",
  )
  return out.filter(Boolean).join("\n")
}

/** The published tracker package: how often it ships, and how many people install it. */
export async function sdkReleaseFeed(args: { limit?: number }): Promise<string> {
  const limit = swBound(args?.limit, 1, SW_LIST_CAP, 6)
  const [doc, dl, releases] = await Promise.all([
    swJson<{
      "dist-tags"?: Record<string, string>
      versions?: Record<string, { dependencies?: Record<string, string> }>
      time?: Record<string, string>
      description?: string
    }>(SW_NPM),
    swJson<{ downloads?: number; start?: string; end?: string }>(`${SW_DOWNLOADS}/swetrix`),
    swJson<{ tag_name?: string; name?: string; published_at?: string; prerelease?: boolean }[]>(`${SW_GITHUB}/releases?per_page=${limit}`),
  ])

  const time = doc.time ?? {}
  const published = Object.entries(time)
    .filter(([k]) => k !== "created" && k !== "modified")
    .map(([version, date]) => ({ version, date }))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  const latest = doc["dist-tags"]?.latest ?? "no latest tag"
  const gaps: number[] = []
  for (let i = 1; i < published.length; i += 1) {
    gaps.push(Math.abs((Date.parse(published[i - 1].date) - Date.parse(published[i].date)) / 86400000))
  }
  const latestManifest = doc.versions?.[latest]
  const daysSince = published.length ? Math.round((Date.now() - Date.parse(published[0].date)) / 86400000) : null

  return [
    "Swetrix tracker package on npm",
    doc.description ?? "",
    `Latest ${latest}, ${published.length} version(s), first published ${String(time.created ?? "?").slice(0, 10)}`,
    daysSince !== null ? `Last publish ${daysSince} day(s) ago` : "",
    gaps.length ? `Median ${(gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)] ?? 0).toFixed(1)} day(s) between releases, shortest ${Math.min(...gaps).toFixed(1)}, longest ${Math.max(...gaps).toFixed(1)}` : "",
    latestManifest ? `Dependencies on latest: ${Object.keys(latestManifest.dependencies ?? {}).length}` : "",
    `Weekly downloads: ${(dl.downloads ?? 0).toLocaleString("en-US")} (${dl.start} to ${dl.end})`,
    "",
    "Most recent versions:",
    ...published.slice(0, limit).map((p) => `  ${p.version.padEnd(12)} ${p.date.slice(0, 10)}`),
    "",
    "Newest GitHub releases for the project:",
    ...(releases.length
      ? releases.map((r) => `  ${String(r.published_at ?? "?").slice(0, 10)}  ${r.tag_name ?? "?"}${r.prerelease ? " (prerelease)" : ""}`)
      : ["  the repository publishes no GitHub releases"]),
    "",
    "GitHub release tags here are named after the component they build, so they are not the same version line as the npm package. Compare a tag to a version only when the tag is the tracker itself.",
  ]
    .filter(Boolean)
    .join("\n")
}

/** The project's shape: who maintains it, what it is written in and how busy it is. */
export async function ecosystemAudit(args: { limit?: number }): Promise<string> {
  const limit = swBound(args?.limit, 1, SW_LIST_CAP, 8)
  const [repo, langs, contributors, issues] = await Promise.all([
    swJson<{
      full_name?: string
      description?: string
      stargazers_count?: number
      forks_count?: number
      open_issues_count?: number
      subscribers_count?: number
      created_at?: string
      pushed_at?: string
      archived?: boolean
      license?: { spdx_id?: string }
      topics?: string[]
    }>(SW_GITHUB),
    swJson<Record<string, number>>(`${SW_GITHUB}/languages`),
    swJson<{ login?: string; contributions?: number; type?: string }[]>(`${SW_GITHUB}/contributors?per_page=${limit}`),
    swJson<{ total_count?: number }>(`${SW_GITHUB}/issues?state=open&per_page=1`),
  ])

  const totalBytes = Object.values(langs).reduce((s, n) => s + n, 0)
  const ranked = Object.entries(langs).sort((a, b) => b[1] - a[1])
  const topShare = totalBytes ? (ranked[0]?.[1] ?? 0) / totalBytes : 0
  const totalContrib = contributors.reduce((s, c) => s + (c.contributions ?? 0), 0)
  const topContrib = contributors[0]?.contributions ?? 0
  const daysSince = repo.pushed_at ? Math.round((Date.now() - Date.parse(repo.pushed_at)) / 86400000) : null

  return [
    `${repo.full_name ?? "swetrix/swetrix"}${repo.archived ? " (ARCHIVED)" : ""}`,
    repo.description ?? "",
    `Licence ${repo.license?.spdx_id ?? "not reported"}, created ${String(repo.created_at ?? "?").slice(0, 10)}${daysSince !== null ? `, last push ${daysSince} day(s) ago` : ""}`,
    `${repo.stargazers_count?.toLocaleString("en-US") ?? "not reported"} stars, ${repo.forks_count ?? "not reported"} forks, ${repo.subscribers_count ?? "not reported"} watchers, ${issues.total_count ?? repo.open_issues_count ?? "?"} open issues and pull requests`,
    repo.topics?.length ? `Topics: ${repo.topics.join(", ")}` : "",
    "",
    `Language mix by bytes (${Math.round(totalBytes / 1024)} kB counted):`,
    ...ranked.slice(0, limit).map(([k, v]) => `  ${((v / totalBytes) * 100).toFixed(1).padStart(5)}%  ${k}`),
    "",
    `Contributors shown (${contributors.length}), ${totalContrib.toLocaleString("en-US")} commits between them; the top one is ${totalContrib ? ((topContrib / totalContrib) * 100).toFixed(0) : "?"}%`,
    ...contributors.slice(0, limit).map((c) => `  ${String(c.contributions ?? 0).padStart(6)}  ${c.login ?? "?"}${c.type === "Bot" ? " (bot)" : ""}`),
    "",
    topShare > 0.8
      ? "One language is over 80% of the codebase, which is healthy for a typed project of this size and means a contributor can be productive quickly."
      : `The top language is only ${(topShare * 100).toFixed(0)}% of the codebase, so this is a polyglot repository and a change can touch several build systems.`,
    totalContrib > 0 && topContrib / totalContrib > 0.8
      ? "One contributor accounts for most commits. For a self-hostable analytics server that is a bus-factor risk, not a quality signal."
      : "Commit counts are spread across contributors, which is a healthier sign than the star count suggests.",
  ]
    .filter(Boolean)
    .join("\n")
}
