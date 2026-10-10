const TOKEN = process.env.GITHUB_TOKEN
const BASE = "https://api.github.com"
const UA = "mrfentmen-github-intel-mcp/1.0 (https://github.com/mrfentmen)"
export class GithubError extends Error {}

async function request<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { "User-Agent": UA, Accept: "application/vnd.github+json" }
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`
  const res = await fetch(`${BASE}${path}`, { headers, signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new GithubError(`GitHub error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

export async function searchRepos(args: { query?: string; limit?: number }): Promise<string> {
  const q = encodeURIComponent(args.query ?? "")
  const limit = Math.min(args.limit ?? 10, 25)
  const d = await request<any>(`/search/repositories?q=${q}&sort=stars&order=desc&per_page=${limit}`)
  const rows = d.items ?? []
  return rows.map((r: any, i: number) =>
    `${i + 1}. ${r.full_name ?? ""} | ${r.stargazers_count ?? 0} stars\n   ${r.language ?? ""} | ${r.description ?? ""}`
  ).join("\n\n") || "No repos found"
}

export async function repo(args: { owner?: string; repo?: string }): Promise<string> {
  const owner = encodeURIComponent(args.owner ?? "")
  const name = encodeURIComponent(args.repo ?? "")
  if (!owner || !name) throw new GithubError("Provide owner and repo")
  const r = await request<any>(`/repos/${owner}/${name}`)
  return [
    `${r.full_name} | ${r.stargazers_count} stars | ${r.forks_count} forks`,
    r.language ?? "",
    r.description ?? "",
    `License: ${r.license?.spdx_id ?? "none"} | Updated ${(r.updated_at ?? "").slice(0, 10)}`,
    r.homepage ?? "",
  ].filter(Boolean).join("\n")
}

export async function userRepos(args: { username?: string; limit?: number }): Promise<string> {
  const user = encodeURIComponent(args.username ?? "")
  if (!user) throw new GithubError("Provide a username")
  const limit = Math.min(args.limit ?? 15, 50)
  const rows = await request<any[]>(`/users/${user}/repos?per_page=${limit}&sort=updated`)
  return rows.map((r: any) =>
    `${r.name ?? ""} | ${r.stargazers_count ?? 0} stars | ${r.language ?? ""}\n  ${r.description ?? ""}`
  ).join("\n\n")
}

// ---- muxF tools:
interface GhLanguages {
  [language: string]: number
}

interface GhRelease {
  tag_name?: string
  name?: string
  published_at?: string | null
  created_at?: string | null
  prerelease?: boolean
  draft?: boolean
  html_url?: string
  body?: string | null
  assets?: Array<{ name?: string; size?: number; download_count?: number }>
}

interface GhContributor {
  login?: string
  contributions?: number
  type?: string
  html_url?: string
}

interface GhUser {
  login?: string
  name?: string | null
  bio?: string | null
  company?: string | null
  location?: string | null
  blog?: string | null
  public_repos?: number
  followers?: number
  following?: number
  created_at?: string
  type?: string
  html_url?: string
}

function num(value: unknown, max = 100000): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(n, max))
}

function kib(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${bytes} B`
}

function said(value: unknown, chars: number): string {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
  if (!text) return "not reported"
  return text.length > chars ? `${text.slice(0, chars)}...` : text
}

/** The real language mix of a repository, by bytes, with the share each language holds. */
export async function repoLanguages(args: { owner?: string; repo?: string }): Promise<string> {
  const owner = encodeURIComponent(args.owner ?? "")
  const name = encodeURIComponent(args.repo ?? "")
  if (!owner || !name) throw new GithubError("Provide owner and repo")
  const bytes = await request<GhLanguages>(`/repos/${owner}/${name}/languages`)
  const entries = Object.entries(bytes ?? {})
  if (!entries.length) return `GitHub reports no language bytes for ${owner}/${name}.`
  const total = entries.reduce((sum, [, size]) => sum + num(size, 1e12), 0)
  const meta = await request<{ language?: string | null; size?: number }>(`/repos/${owner}/${name}`)
  const sorted = entries.sort((a, b) => b[1] - a[1])
  return [
    `Language mix of ${owner}/${name}, by bytes GitHub counts`,
    `Total bytes counted: ${total.toLocaleString()} (${kib(total)})`,
    `GitHub repository size field: ${num(meta.size, 1e9).toLocaleString()} KiB`,
    `GitHub primary language field: ${meta.language ?? "not reported"}`,
    `Languages reported: ${entries.length}`,
    ...sorted.slice(0, 20).map(([language, size]) => `- ${language}: ${num(size, 1e12).toLocaleString()} bytes (${((size / total) * 100).toFixed(2)}%)`),
    entries.length > 20 ? `... and ${entries.length - 20} more language(s).` : "",
    "The share is computed against the total of the bytes GitHub reports for this repository only.",
  ].filter(Boolean).join("\n")
}

/** Recent releases of a repository: tag, date, prerelease flag, asset count and the first lines of the notes. */
export async function repoReleases(args: { owner?: string; repo?: string; limit?: number; notes?: number }): Promise<string> {
  const owner = encodeURIComponent(args.owner ?? "")
  const name = encodeURIComponent(args.repo ?? "")
  if (!owner || !name) throw new GithubError("Provide owner and repo")
  const limit = Math.max(1, Math.min(args.limit ?? 8, 25))
  const notes = Math.max(0, Math.min(args.notes ?? 400, 2000))
  const rows = await request<GhRelease[]>(`/repos/${owner}/${name}/releases?per_page=${limit}`)
  if (!rows.length) return `${owner}/${name} has no published releases on GitHub.`
  const out = [`Releases of ${owner}/${name} (${rows.length} most recent):`]
  for (const r of rows) {
    const assets = r.assets ?? []
    const totalDownloads = assets.reduce((sum, a) => sum + num(a.download_count, 1e9), 0)
    out.push(
      `- ${r.tag_name ?? "tag not reported"}${r.name && r.name !== r.tag_name ? ` (${said(r.name, 60)})` : ""}` +
        ` published ${String(r.published_at ?? r.created_at ?? "date not reported").slice(0, 10)}` +
        `${r.prerelease ? " [prerelease]" : ""}${r.draft ? " [draft]" : ""}` +
        `, ${assets.length} asset(s)${assets.length ? `, ${totalDownloads.toLocaleString()} download(s)` : ""}`,
    )
    if (notes > 0) {
      const body = said(r.body, notes)
      out.push(`  notes: ${body === "not reported" ? "no release notes published" : body}`)
    }
    out.push(`  ${r.html_url ?? "no release page reported"}`)
  }
  return out.join("\n")
}

/** Who actually carries a repository: the top contributors by commit count, with the share the top two hold. */
export async function repoContributors(args: { owner?: string; repo?: string; limit?: number }): Promise<string> {
  const owner = encodeURIComponent(args.owner ?? "")
  const name = encodeURIComponent(args.repo ?? "")
  if (!owner || !name) throw new GithubError("Provide owner and repo")
  const limit = Math.max(1, Math.min(args.limit ?? 15, 50))
  const rows = await request<GhContributor[]>(`/repos/${owner}/${name}/contributors?per_page=${limit}&anon=0`)
  if (!rows.length) return `GitHub reports no contributors for ${owner}/${name}.`
  const total = rows.reduce((sum, c) => sum + num(c.contributions, 1e9), 0)
  const top = rows[0]
  const second = rows[1]
  const topTwo = (num(top?.contributions, 1e9) + num(second?.contributions, 1e9)) / (total || 1)
  return [
    `Top contributors to ${owner}/${name}`,
    `Contributors in this page: ${rows.length}, holding ${total.toLocaleString()} commit(s) between them`,
    ...rows.slice(0, limit).map((c, i) =>
      `- ${i + 1}. ${c.login ?? "login not reported"} (${c.type ?? "type not reported"}): ${num(c.contributions, 1e9).toLocaleString()} commits, ${((num(c.contributions, 1e9) / (total || 1)) * 100).toFixed(1)}% of this page`,
    ),
    `The leading contributor holds ${((num(top?.contributions, 1e9) / (total || 1)) * 100).toFixed(1)}% of the commits in this page; the top two together hold ${(topTwo * 100).toFixed(1)}%.`,
    "Shares are over the page GitHub returned, not over every commit in the repository's history.",
  ].join("\n")
}

/** A user account in full: the profile fields GitHub exposes and how the account compares in size. */
export async function userProfile(args: { username?: string }): Promise<string> {
  const user = encodeURIComponent(args.username ?? "")
  if (!user) throw new GithubError("Provide a username")
  const u = await request<GhUser>(`/users/${user}`)
  const joined = u.created_at ? String(u.created_at).slice(0, 10) : "not reported"
  const ageDays = u.created_at ? Math.floor((Date.now() - Date.parse(u.created_at)) / 86400000) : null
  const repos = num(u.public_repos, 1e6)
  const followers = num(u.followers, 1e7)
  return [
    `GitHub profile: ${u.login ?? "login not reported"}`,
    `Display name: ${u.name ?? "not reported"}`,
    `Account type: ${u.type ?? "not reported"}`,
    `Joined: ${joined}${ageDays === null ? "" : ` (about ${Math.floor(ageDays / 365.25)} years ago)`}`,
    `Public repositories: ${repos.toLocaleString()}`,
    `Followers: ${followers.toLocaleString()}`,
    `Following: ${num(u.following, 1e6).toLocaleString()}`,
    `Company: ${u.company ?? "not reported"}`,
    `Location: ${u.location ?? "not reported"}`,
    `Website: ${u.blog ?? "not reported"}`,
    `Bio: ${said(u.bio, 240)}`,
    `Profile: ${u.html_url ?? "not reported"}`,
  ].join("\n")
}
