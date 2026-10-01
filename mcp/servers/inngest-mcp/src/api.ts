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

function days(a: string, b: string): number {
  return (Date.parse(b) - Date.parse(a)) / 86400000
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

