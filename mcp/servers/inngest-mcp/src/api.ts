/**
 * Inngest API client. Event ingestion needs INNGEST_EVENT_KEY
 * (dashboard > Manage > Event Keys). App listing needs INNGEST_SIGNING_KEY.
 * Docs: https://www.inngest.com/docs/reference/
 */
const EVENT_BASE = process.env.INNGEST_EVENT_URL ?? "https://inn.gs"
const API_BASE = "https://api.inngest.com"

export class InngestError extends Error {}

function eventKey(): string {
  const k = process.env.INNGEST_EVENT_KEY
  if (!k) throw new InngestError("Set INNGEST_EVENT_KEY first (dashboard > Manage > Event Keys).")
  return k
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

export async function sendEvent(name: string, data: Raw): Promise<string> {
  if (!name.trim()) throw new InngestError("Event name is empty.")
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new InngestError("Event data must be a JSON object.")
  }
  const res = await fetch(`${EVENT_BASE}/e/${eventKey()}`, {
    method: "POST",
    headers: { "User-Agent": "inngest-mcp/1.0", "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim(), data }),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new InngestError("Inngest rejected the event key (401/403).")
  if (!res.ok) throw new InngestError(`Inngest error ${res.status}`)
  const out = (await res.json()) as Raw
  const ids: Raw = out.ids ?? {}
  const idList = Object.values(ids).map(String).slice(0, 5)
  return idList.length ? `Event sent: ${idList.join(", ")}` : "Event sent."
}

export interface App {
  id?: string
  name?: string
  url?: string
}

export async function listApps(): Promise<App[]> {
  const key = process.env.INNGEST_SIGNING_KEY
  if (!key) throw new InngestError("Set INNGEST_SIGNING_KEY first (dashboard > Manage > Signing Key).")
  const res = await fetch(`${API_BASE}/v1/apps`, {
    headers: { "User-Agent": "inngest-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new InngestError("Inngest refused (401/403). Check INNGEST_SIGNING_KEY.")
  if (!res.ok) throw new InngestError(`Inngest error ${res.status}`)
  const data = (await res.json()) as Raw
  const rows: Raw[] = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
  return rows.slice(0, 20).map((a) => ({ id: a.id ?? a.app_id, name: a.name ?? a.title, url: a.url }))
}

// ---- muxF tools:
const NPM = "https://registry.npmjs.org"
const DOWNLOADS = "https://api.npmjs.org/downloads/point/last-week"
const STATUSPAGE = "https://status.inngest.com/api/v2"
const GITHUB = "https://api.github.com/repos/inngest/inngest"

async function npmJson<T>(path: string): Promise<T> {
  const res = await fetch(`${NPM}${path}`, {
    headers: { "User-Agent": "inngest-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 404) throw new InngestError(`npm has no package at ${path.replace(/^\//, "")}.`)
  if (!res.ok) throw new InngestError(`npm registry returned ${res.status}`)
  return (await res.json()) as T
}

async function weeklyDownloads(pkg: string): Promise<number | null> {
  try {
    const res = await fetch(`${DOWNLOADS}/${encodeURIComponent(pkg)}`, {
      headers: { "User-Agent": "inngest-mcp/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const d = (await res.json()) as { downloads?: number }
    return typeof d.downloads === "number" ? d.downloads : null
  } catch {
    return null
  }
}

function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function days(a: string, b: string): number {
  return (Date.parse(b) - Date.parse(a)) / 86400000
}

function short(text: string | undefined | null, max = 400): string {
  const clean = String(text ?? "").replace(/\r/g, "").replace(/<!--[\s\S]*?-->/g, "").trim()
  if (!clean) return "(no release notes)"
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean)
  return lines.length > 8 ? `${lines.slice(0, 8).join("\n")}${lines.length > 8 ? `\n... (${lines.length - 8} more note lines)` : ""}` : clean
}

/** The published Inngest SDK surface: what is out there, how big it is, and how it is doing. */
export async function sdkMatrix(args: { "package"?: string }): Promise<string> {
  const pkg = String(args?.package ?? "inngest").trim() || "inngest"
  const d = await npmJson<{
    name?: string
    description?: string
    "dist-tags"?: Record<string, string>
    versions?: Record<string, { engines?: Record<string, string>; dependencies?: Record<string, string>; peerDependencies?: Record<string, string> }>
    maintainers?: { name?: string }[]
  }>(`/${encodeURIComponent(pkg)}?write=true`)

  const versions = Object.keys(d.versions ?? {})
  if (!versions.length) throw new InngestError(`npm returned no published versions for ${pkg}.`)
  const tags = d["dist-tags"] ?? {}
  const latest = tags.latest
  const latestManifest = latest ? d.versions?.[latest] : undefined
  const downloads = await weeklyDownloads(pkg)
  const prereleaseTags = Object.entries(tags).filter(([tag, v]) => tag !== "latest" && /-(alpha|beta|rc|next|pr-|pre)/.test(tag) || /-(alpha|beta|rc)/.test(v))
  const stableVersions = versions.filter((v) => !/-(alpha|beta|rc|next|pre|dev)/.test(v))

  return [
    `Inngest SDK on npm: ${d.name ?? pkg}`,
    d.description ? `Description: ${d.description}` : "",
    `Latest: ${latest ?? "no latest tag"}${latestManifest?.engines?.node ? ` (needs Node ${latestManifest.engines.node})` : ""}`,
    `Published versions: ${versions.length} total, ${stableVersions.length} without a prerelease suffix`,
    `Dist-tags: ${Object.entries(tags).map(([k, v]) => `${k} -> ${v}`).join(", ")}`,
    prereleaseTags.length ? `Prerelease tags on the board: ${prereleaseTags.slice(0, 10).map(([k, v]) => `${k}=${v}`).join(", ")}${prereleaseTags.length > 10 ? ", ..." : ""}` : "",
    latestManifest ? `Latest dependency count: ${Object.keys(latestManifest.dependencies ?? {}).length} runtime, ${Object.keys(latestManifest.peerDependencies ?? {}).length} peer` : "",
    downloads !== null ? `Weekly downloads (last 7 days): ${downloads.toLocaleString("en-US")}` : "Weekly downloads: not available from npm right now",
    d.maintainers?.length ? `Maintainers listed on the package: ${d.maintainers.map((m) => m.name).filter(Boolean).slice(0, 6).join(", ")}` : "",
    "",
    "The npm package version and the Inngest platform release train are separate; release_feed shows the platform side.",
  ].filter(Boolean).join("\n")
}

/** The platform release train, and whether the SDK on npm has moved past it. */
export async function releaseFeed(args: { releases?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(20, Math.floor(Number(args?.releases ?? 6)) || 6))
  const res = await fetch(`${GITHUB}/releases?per_page=${limit}`, {
    headers: { "User-Agent": "inngest-mcp/1.0", Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new InngestError("The inngest/inngest repository was not found.")
  if (res.status === 403) throw new InngestError("GitHub is rate limiting this IP (60 requests an hour unauthenticated). Try again shortly.")
  if (!res.ok) throw new InngestError(`GitHub returned ${res.status}`)
  const releases = (await res.json()) as {
    tag_name?: string
    name?: string
    published_at?: string
    prerelease?: boolean
    draft?: boolean
    body?: string
    html_url?: string
    assets?: { name?: string; download_count?: number }[]
  }[]
  if (!releases.length) throw new InngestError("GitHub returned no releases for inngest/inngest.")

  const repo = await fetch(GITHUB, {
    headers: { "User-Agent": "inngest-mcp/1.0", Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(20000),
  })
  const meta = repo.ok ? ((await repo.json()) as { stargazers_count?: number; open_issues_count?: number; pushed_at?: string; description?: string }) : {}

  const gaps: number[] = []
  for (let i = 1; i < releases.length; i += 1) {
    const a = releases[i].published_at
    const b = releases[i - 1].published_at
    if (a && b) gaps.push(Math.abs(days(a, b)))
  }
  const stable = releases.filter((r) => !r.prerelease && !r.draft)
  type Tags = { "dist-tags"?: Record<string, string> }
  const npm: Tags = await npmJson<Tags>("/inngest?write=true").catch((): Tags => ({}))
  const npmLatest = npm["dist-tags"]?.latest

  return [
    `Inngest platform releases: latest ${releases[0].tag_name ?? "?"} published ${(releases[0].published_at ?? "?").slice(0, 10)}`,
    `${stable.length} stable of the ${releases.length} most recent${gaps.length ? `, ${median(gaps).toFixed(1)} days median between them` : ""}`,
    meta.stargazers_count !== undefined ? `Repository: ${meta.stargazers_count.toLocaleString("en-US")} stars, ${meta.open_issues_count ?? "?"} open issues, last push ${(meta.pushed_at ?? "?").slice(0, 10)}` : "",
    npmLatest ? `SDK on npm is at ${npmLatest}; the platform train is at ${String(releases[0].tag_name ?? "").replace(/^v/, "")}. They version independently, so compare the numbers, not the strings.` : "",
    "",
    ...releases.map((r) => [
      `${r.tag_name ?? "?"}${r.prerelease ? " (prerelease)" : ""}${r.draft ? " (draft)" : ""} - ${(r.published_at ?? "?").slice(0, 10)}${r.assets?.length ? `, ${r.assets.length} release assets, ${r.assets.reduce((s, a) => s + (a.download_count ?? 0), 0).toLocaleString("en-US")} downloads` : ""}`,
      short(r.body, 400),
      r.html_url ?? "",
    ].filter(Boolean).join("\n")),
  ].filter(Boolean).join("\n\n")
}

/** Reliability record of the durable execution platform: component health and incident history. */
export async function incidentHistory(args: { limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(25, Math.floor(Number(args?.limit ?? 8)) || 8))
  const [summaryRes, incidentRes] = await Promise.all([
    fetch(`${STATUSPAGE}/summary.json`, { headers: { "User-Agent": "inngest-mcp/1.0", Accept: "application/json" }, signal: AbortSignal.timeout(20000) }),
    fetch(`${STATUSPAGE}/incidents.json`, { headers: { "User-Agent": "inngest-mcp/1.0", Accept: "application/json" }, signal: AbortSignal.timeout(20000) }),
  ])
  if (!summaryRes.ok) throw new InngestError(`Inngest status page returned ${summaryRes.status}`)
  if (!incidentRes.ok) throw new InngestError(`Inngest status page returned ${incidentRes.status} for incidents`)

  const summary = (await summaryRes.json()) as {
    status?: { indicator?: string; description?: string }
    components?: { name?: string; status?: string; description?: string | null; updated_at?: string }[]
  }
  const incidents = (await incidentRes.json()) as {
    incidents?: {
      name?: string
      status?: string
      impact?: string
      created_at?: string
      updated_at?: string
      resolved_at?: string | null
      incident_updates?: { body?: string; created_at?: string; status?: string }[]
    }[]
  }
  const rows = incidents.incidents ?? []
  const open = rows.filter((i) => i.status !== "resolved")

  const byImpact = new Map<string, number>()
  for (const i of rows) byImpact.set(i.impact ?? "unknown", (byImpact.get(i.impact ?? "unknown") ?? 0) + 1)
  const durations = rows.filter((i) => i.created_at && i.resolved_at).map((i) => days(i.created_at as string, i.resolved_at as string))
  const longest = durations.length ? Math.max(...durations) : 0

  return [
    `Inngest status: ${summary.status?.description ?? "not reported"} (indicator ${summary.status?.indicator ?? "?"})`,
    ...(summary.components ?? []).map((c) => `  ${c.name ?? "?"}: ${c.status ?? "?"}${c.description ? ` - ${c.description}` : ""}`),
    "",
    `Incidents on record: ${rows.length}, of which ${open.length} not resolved`,
    `By impact: ${[...byImpact.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`,
    durations.length ? `Time to resolve: median ${median(durations).toFixed(1)} hours, longest ${longest.toFixed(1)} hours, over ${durations.length} resolved incidents` : "No resolved incidents carry both a start and an end time.",
    "",
    ...rows.slice(0, limit).map((i) => {
      const span = i.resolved_at && i.created_at ? `, took ${days(i.created_at, i.resolved_at).toFixed(1)} hours` : ", still open"
      return [
        `${i.status === "resolved" ? "Resolved" : "OPEN"} [${i.impact ?? "?"} impact] ${i.name ?? "(unnamed)"}`,
        `  raised ${(i.created_at ?? "?").slice(0, 16).replace("T", " ")}${span}, last update ${(i.updated_at ?? "?").slice(0, 16).replace("T", " ")}`,
        i.incident_updates?.length ? `  latest update: ${short(i.incident_updates[i.incident_updates.length - 1].body, 220).split("\n")[0]}` : "",
      ].filter(Boolean).join("\n")
    }),
  ].filter(Boolean).join("\n")
}
