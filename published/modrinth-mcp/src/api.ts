/**
 * Modrinth API v2 client — the modern Minecraft mod host.
 * Docs: https://docs.modrinth.com/  (free, no key)
 */

const BASE = "https://api.modrinth.com/v2"
const SITE = "https://modrinth.com"

export class ModrinthError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "modrinth-mcp/1.0" },
  })
  if (!res.ok) {
    throw new ModrinthError(`Modrinth API error ${res.status}: ${res.statusText}`)
  }
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectHit {
  projectId: string
  slug: string
  title: string
  description: string
  categories: string[]
  projectType: string
  downloads: number
  follows: number
  author: string
  license: { id: string; name: string }
  versions: string[]
  iconUrl?: string
  dateCreated: string
  dateModified: string
}

export interface Project {
  id: string
  slug: string
  title: string
  description: string
  body: string
  categories: string[]
  projectType: string
  downloads: number
  followers: number
  author: string
  license: { id: string; name: string }
  gameVersions: string[]
  loaders: string[]
  iconUrl?: string
  sourceUrl?: string
  issuesUrl?: string
  url: string
}

export interface Version {
  id: string
  name: string
  versionNumber: string
  gameVersions: string[]
  loaders: string[]
  downloads: number
  datePublished: string
  files: { url: string; filename: string; size: number; primary?: boolean }[]
  dependencies: { projectId?: string; versionId?: string; dependencyType?: string }[]
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function searchProjects(
  query: string,
  projectType = "mod",
  loader?: string,
  gameVersion?: string,
  limit = 10
): Promise<ProjectHit[]> {
  const facets: string[][] = [[`project_type:${projectType}`]]
  if (loader) facets.push([`categories:${loader}`])
  if (gameVersion) facets.push([`versions:${gameVersion}`])

  const params = new URLSearchParams({
    query,
    limit: String(limit),
    index: "relevance",
  })
  if (facets.length) params.set("facets", JSON.stringify(facets))

  const data = await getJson<{ hits?: any[] }>(`/search?${params}`)
  return (data.hits ?? []).map((h) => ({
    projectId: h.project_id,
    slug: h.slug,
    title: h.title,
    description: h.description ?? "",
    categories: h.categories ?? [],
    projectType: h.project_type,
    downloads: h.downloads ?? 0,
    follows: h.follows ?? 0,
    author: h.author ?? "?",
    license: h.license ?? { id: "?", name: "?" },
    versions: h.versions ?? [],
    iconUrl: h.icon_url,
    dateCreated: h.date_created,
    dateModified: h.date_modified,
  }))
}

export async function getProject(idOrSlug: string): Promise<Project | null> {
  const p = await getJson<any>(`/project/${encodeURIComponent(idOrSlug)}`)
  if (!p || !p.id) return null
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description ?? "",
    body: stripHtml(p.body ?? "").slice(0, 800),
    categories: p.categories ?? [],
    projectType: p.project_type,
    downloads: p.downloads ?? 0,
    followers: p.followers ?? 0,
    author: p.author ?? "?",
    license: p.license ?? { id: "?", name: "?" },
    gameVersions: p.game_versions ?? [],
    loaders: p.loaders ?? [],
    iconUrl: p.icon_url,
    sourceUrl: p.source_url,
    issuesUrl: p.issues_url,
    url: `${SITE}/mod/${p.slug}`,
  }
}

export async function getProjectVersions(
  idOrSlug: string,
  loader?: string,
  gameVersion?: string,
  limit = 10
): Promise<Version[]> {
  const params = new URLSearchParams()
  if (loader) params.set("loaders", JSON.stringify([loader]))
  if (gameVersion) params.set("game_versions", JSON.stringify([gameVersion]))
  const qs = params.toString()
  const versions = await getJson<any[]>(
    `/project/${encodeURIComponent(idOrSlug)}/version${qs ? `?${qs}` : ""}`
  )
  return (versions ?? []).slice(0, limit).map((v) => ({
    id: v.id,
    name: v.name ?? "?",
    versionNumber: v.version_number ?? "?",
    gameVersions: v.game_versions ?? [],
    loaders: v.loaders ?? [],
    downloads: v.downloads ?? 0,
    datePublished: v.date_published?.slice(0, 10),
    files: (v.files ?? []).map((f: any) => ({
      url: f.url,
      filename: f.filename,
      size: f.size,
      primary: f.primary,
    })),
    dependencies: (v.dependencies ?? []).map((d: any) => ({
      projectId: d.project_id,
      versionId: d.version_id,
      dependencyType: d.dependency_type,
    })),
  }))
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function fmtDownloads(n: number): string {
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}k`
      : String(n)
}

export function formatHit(h: ProjectHit, index: number): string {
  return (
    `${index}. ${h.title} by ${h.author} (${h.license.name})\n` +
    `   ${h.description.slice(0, 140)}\n` +
    `   ⬇ ${fmtDownloads(h.downloads)} | ♥ ${h.follows} | ${h.categories.slice(0, 4).join(", ") || "no tags"}\n` +
    `   ${SITE}/${h.projectType === "modpack" ? "modpack" : "mod"}/${h.slug}`
  )
}

export function formatProject(p: Project): string {
  const lines = [
    `${p.title} by ${p.author} (${p.license.name})\n${p.url}`,
    `⬇ ${fmtDownloads(p.downloads)} | ♥ ${p.followers}`,
    `Loaders: ${p.loaders.slice(0, 6).join(", ") || "?"} | Latest MC: ${p.gameVersions.slice(-1)[0] ?? "?"}`,
    `Tags: ${p.categories.slice(0, 8).join(", ") || "—"}`,
  ]
  if (p.body) lines.push(`\n${p.body}`)
  return lines.join("\n")
}

export function formatVersion(v: Version, index: number): string {
  const deps = v.dependencies
    .filter((d) => d.dependencyType === "required")
    .map((d) => d.projectId?.slice(0, 8) ?? d.versionId?.slice(0, 8) ?? "?")
  return (
    `${index}. ${v.name} (${v.versionNumber}) — ${v.datePublished ?? "?"}\n` +
    `   MC: ${v.gameVersions.slice(0, 4).join(", ")} | Loaders: ${v.loaders.join(", ")}\n` +
    `   ⬇ ${fmtDownloads(v.downloads)}${deps.length ? ` | requires: ${deps.join(", ")}` : ""}` +
    (v.files[0] ? `\n   ${v.files[0].filename}` : "")
  )
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
