/**
 * SourceForge REST API client, keyless.
 * Docs: https://sourceforge.net/p/forge/documentation/Allura%20API/
 */
const BASE = "https://sourceforge.net/rest"

export class SourceForgeError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "sourceforge-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new SourceForgeError("Not found on SourceForge.")
  if (!res.ok) throw new SourceForgeError(`SourceForge error ${res.status}`)
  return (await res.json()) as T
}

export interface SfProject {
  shortname: string
  name?: string
  description?: string
  url?: string
}

export async function getProject(shortname: string): Promise<SfProject> {
  if (!/^[a-z0-9-]+$/i.test(shortname.trim())) throw new SourceForgeError(`Not a project shortname: "${shortname}".`)
  const p = await getJson<Raw>(`/p/${encodeURIComponent(shortname.trim().toLowerCase())}`)
  return {
    shortname: String(p.shortname ?? shortname),
    name: p.name,
    description: p.short_description ? String(p.short_description).slice(0, 200) : undefined,
    url: `https://sourceforge.net/p/${encodeURIComponent(shortname.trim().toLowerCase())}/`,
  }
}

export function formatProject(p: SfProject): string {
  const lines = [
    `${p.name ?? p.shortname} [${p.shortname}]`,
    p.description ? `${p.description}` : "",
    p.url ? `${p.url}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxB tools:
type SfNewsPost = { title?: string; url?: string }

type SfActivity = {
  published?: number;
  verb?: string;
  tags?: string[];
  actor?: { activity_name?: string; activity_url?: string };
  obj?: { activity_name?: string; activity_url?: string; activity_extras?: { summary?: string } };
  target?: { activity_name?: string; activity_url?: string; activity_extras?: { summary?: string } };
}

function shortname(raw: string): string {
  const name = raw.trim().toLowerCase()
  if (!/^[a-z0-9-]+$/.test(name)) throw new SourceForgeError(`Not a project shortname: "${raw}".`)
  return name
}

function when(published: number | undefined): string {
  if (!published) return "date not reported"
  const d = new Date(published)
  return Number.isNaN(d.getTime()) ? "date not reported" : d.toISOString().slice(0, 10)
}

export async function listNews(args: { shortname: string; limit?: number }): Promise<string> {
  const name = shortname(args.shortname)
  const limit = Math.max(1, Math.min(Math.trunc(Number(args.limit ?? 10) || 10), 50))
  const d = await getJson<Raw>(`/p/${encodeURIComponent(name)}/news/`)
  const posts = (Array.isArray(d.posts) ? d.posts : []) as SfNewsPost[]
  if (!posts.length) throw new SourceForgeError(`No news posts on the SourceForge project ${name}.`)
  const rows = posts.slice(0, limit).map((p, i) => `${i + 1}. ${p.title ?? "untitled"}\n   ${p.url ?? "no link reported"}`)
  return `SourceForge news for ${name} (${d.count ?? posts.length} posts reported, showing ${Math.min(limit, posts.length)}):\n${rows.join("\n")}`
}

export async function listActivity(args: { shortname: string; limit?: number }): Promise<string> {
  const name = shortname(args.shortname)
  const limit = Math.max(1, Math.min(Math.trunc(Number(args.limit ?? 12) || 12), 50))
  const d = await getJson<Raw>(`/p/${encodeURIComponent(name)}/activity/`)
  const timeline = (Array.isArray(d.timeline) ? d.timeline : []) as SfActivity[]
  if (!timeline.length) throw new SourceForgeError(`No activity reported for the SourceForge project ${name}.`)
  const project = d.followee?.activity_name ?? name
  const rows = timeline.slice(0, limit).map((a, i) => {
    const summary = a.target?.activity_extras?.summary ?? a.obj?.activity_extras?.summary
    return [
      `${i + 1}. ${when(a.published)} - ${a.actor?.activity_name ?? "someone"} ${a.verb ?? "did something to"} ${a.target?.activity_name ?? a.obj?.activity_name ?? "an item"}`,
      summary ? `   ${summary.replace(/\s+/g, " ").slice(0, 160)}` : null,
      a.target?.activity_url ? `   https://sourceforge.net${a.target.activity_url}` : null,
    ].filter(Boolean).join("\n")
  })
  return `Recent activity on the SourceForge project ${project} [${name}] (${timeline.length} events reported, showing ${Math.min(limit, timeline.length)}):\n${rows.join("\n")}`
}
