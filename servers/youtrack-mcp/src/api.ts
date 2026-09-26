const UA = "mrfentmen-youtrack-mcp/1.0"
const API = "https://gitlab.com/api/v4"

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/**
 * GitLab's public API answers without any credential. An optional GITLAB_TOKEN
 * raises the rate limit and unlocks private projects, but nothing here requires it.
 */
function headers(): Record<string, string> {
  const base: Record<string, string> = { "User-Agent": UA, Accept: "application/json" }
  const token = process.env.GITLAB_TOKEN
  if (token) base["PRIVATE-TOKEN"] = token
  return base
}

async function api<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(`${API}${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value))
  }
  const res = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(25000) })
  if (res.status === 404) throw new Error(`Not found: ${path.replace(API, "")}. Check the project path.`)
  if (res.status === 401 || res.status === 403) throw new Error("GitLab refused the request. Public projects work without a token; check the project path.")
  if (res.status === 429) throw new Error("GitLab rate limit reached (500 requests per minute without a token). Try again shortly.")
  if (!res.ok) throw new Error(`GitLab returned HTTP ${res.status}.`)
  return (await res.json()) as T
}

/** Accepts "group/project" or a numeric project id. */
function projectId(input: string): string {
  const raw = (input ?? "").trim().replace(/^https?:\/\/gitlab\.com\//, "").replace(/\.git$/, "").replace(/\/+$/, "")
  if (!raw) throw new Error("Provide a project as group/project, for example gitlab-org/cli.")
  if (/^\d+$/.test(raw)) return raw
  if (!raw.includes("/")) throw new Error(`"${input}" is not a project path. Use group/project, for example gitlab-org/cli.`)
  return encodeURIComponent(raw)
}

interface GitLabProject {
  id: number
  path_with_namespace: string
  name: string
  description: string | null
  star_count: number
  forks_count: number
  last_activity_at: string
  web_url: string
  default_branch: string
}

interface GitLabUser { username?: string; name?: string }

interface GitLabIssue {
  iid: number
  title: string
  state: string
  labels: string[]
  author?: GitLabUser
  assignees?: GitLabUser[]
  created_at: string
  updated_at: string
  closed_at: string | null
  user_notes_count?: number
  upvotes?: number
  web_url: string
  description?: string | null
}

interface GitLabMergeRequest {
  iid: number
  title: string
  state: string
  draft?: boolean
  author?: GitLabUser
  source_branch?: string
  target_branch?: string
  created_at: string
  updated_at: string
  merged_at: string | null
  user_notes_count?: number
  web_url: string
}

export async function searchProjects(args: { query: string; limit?: number }): Promise<string> {
  const query = (args.query ?? "").trim()
  if (!query) return "Provide a search term, for example mcp server."
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 30)
  const projects = await api<GitLabProject[]>("/projects", {
    search: query,
    per_page: limit,
    order_by: "star_count",
    sort: "desc",
  })
  if (!projects.length) return `No public GitLab project matched "${query}".`
  const lines = [`${projects.length} public GitLab project(s) matching "${query}", most starred first:`, ""]
  projects.forEach((p, i) => {
    const activity = p.last_activity_at ? p.last_activity_at.slice(0, 10) : "unknown"
    lines.push(`${i + 1}. ${p.path_with_namespace} — ${p.star_count} star(s), ${p.forks_count ?? 0} fork(s)`)
    lines.push(`   last activity ${activity} | default branch ${p.default_branch ?? "unknown"}`)
    lines.push(`   ${(p.description ?? "no description").replace(/\s+/g, " ").slice(0, 140)}`)
  })
  return lines.join("\n")
}

const STATE_MAP: Record<string, string> = {
  open: "opened", opened: "opened", closed: "closed", all: "all",
}

function normalizeState(value?: string): string {
  const wanted = (value ?? "opened").trim().toLowerCase()
  const state = STATE_MAP[wanted]
  if (!state) throw new Error('State must be "open", "closed" or "all".')
  return state
}

function issueLine(issue: GitLabIssue): string {
  const assignee = issue.assignees?.map((a) => a.name ?? a.username).filter(Boolean).join(", ")
  const labels = issue.labels?.length ? ` [${issue.labels.join(", ")}]` : ""
  return [
    `#${issue.iid} ${issue.title}${labels}`,
    `   ${issue.state} | opened ${issue.created_at.slice(0, 10)} by ${issue.author?.name ?? issue.author?.username ?? "unknown"}${assignee ? ` | assigned to ${assignee}` : " | unassigned"}${issue.user_notes_count ? ` | ${issue.user_notes_count} comment(s)` : ""}`,
  ].join("\n")
}

const createdAfterFilter = (issues: GitLabIssue[], days?: number): GitLabIssue[] => {
  if (!days || days <= 0) return issues
  const cutoff = Date.now() - days * 86400000
  return issues.filter((i) => new Date(i.created_at).getTime() >= cutoff)
}

export async function projectIssues(args: {
  project: string
  state?: string
  labels?: string
  search?: string
  limit?: number
}): Promise<string> {
  const project = projectId(args.project)
  const state = normalizeState(args.state)
  const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 50)

  const issues = await api<GitLabIssue[]>(`/projects/${project}/issues`, {
    state,
    labels: args.labels?.trim() || undefined,
    search: args.search?.trim() || undefined,
    per_page: limit,
    order_by: "created_at",
    sort: "desc",
  })

  const header = `Issues in ${decodeURIComponent(project)} (state: ${state}${args.labels ? `, labels: ${args.labels}` : ""}${args.search ? `, search: "${args.search}"` : ""})`
  if (!issues.length) return `${header}\n\nNo issues matched.`
  return [
    `${header} — ${issues.length} shown`,
    "",
    ...issues.map(issueLine),
    "",
    `Tip: use issue_stats for a breakdown, or issue_detail with an iid for the full description.`,
  ].join("\n")
}

export async function issueDetail(args: { project: string; iid: number }): Promise<string> {
  const project = projectId(args.project)
  const iid = Number(args.iid)
  if (!Number.isInteger(iid) || iid <= 0) return "Provide the issue's project-internal number, for example 123."
  const issue = await api<GitLabIssue>(`/projects/${project}/issues/${iid}`)
  const description = (issue.description ?? "").trim()
  return [
    `#${issue.iid} ${issue.title}`,
    `State: ${issue.state}${issue.closed_at ? ` (closed ${issue.closed_at.slice(0, 10)})` : ""}`,
    `Author: ${issue.author?.name ?? "unknown"} | Assignees: ${issue.assignees?.map((a) => a.name ?? a.username).join(", ") || "none"}`,
    `Labels: ${issue.labels?.length ? issue.labels.join(", ") : "none"}`,
    `Created: ${issue.created_at.slice(0, 10)} | Updated: ${issue.updated_at.slice(0, 10)}`,
    `Comments: ${issue.user_notes_count ?? 0} | Upvotes: ${issue.upvotes ?? 0}`,
    `URL: ${issue.web_url}`,
    "",
    description ? description.slice(0, 4000) : "No description on this issue.",
  ].join("\n")
}

export async function mergeRequests(args: { project: string; state?: string; limit?: number }): Promise<string> {
  const project = projectId(args.project)
  const state = (args.state ?? "opened").trim().toLowerCase()
  if (!["opened", "closed", "merged", "all"].includes(state)) {
    throw new Error('Merge request state must be "opened", "merged", "closed" or "all".')
  }
  const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 50)
  const mrs = await api<GitLabMergeRequest[]>(`/projects/${project}/merge_requests`, {
    state,
    per_page: limit,
    order_by: "updated_at",
    sort: "desc",
  })
  const header = `Merge requests in ${decodeURIComponent(project)} (state: ${state})`
  if (!mrs.length) return `${header}\n\nNo merge requests matched.`
  const lines = [`${header} — ${mrs.length} shown, most recently updated first`, ""]
  mrs.forEach((mr) => {
    const days = Math.round((Date.now() - new Date(mr.updated_at).getTime()) / 86400000)
    const branch = mr.source_branch && mr.target_branch ? ` | ${mr.source_branch} -> ${mr.target_branch}` : ""
    lines.push(`!${mr.iid} ${mr.draft ? "DRAFT " : ""}${mr.title}`)
    lines.push(`   ${mr.state} | by ${mr.author?.name ?? mr.author?.username ?? "unknown"} | updated ${days === 0 ? "today" : `${days} day(s) ago`}${branch}${mr.user_notes_count ? ` | ${mr.user_notes_count} comment(s)` : ""}`)
  })
  return lines.join("\n")
}

/** Cross-project issue view for a whole GitLab group, which mirrors a team's board. */
export async function groupIssues(args: {
  group: string
  state?: string
  labels?: string
  limit?: number
}): Promise<string> {
  const raw = (args.group ?? "").trim().replace(/^https?:\/\/gitlab\.com\//, "").replace(/\/+$/, "")
  if (!raw) throw new Error("Provide a group such as gitlab-org.")
  const group = encodeURIComponent(raw)
  const state = normalizeState(args.state)
  const limit = Math.min(Math.max(Number(args.limit ?? 20) || 20, 1), 50)
  const issues = await api<Array<GitLabIssue & { references?: { full?: string } }>>(`/groups/${group}/issues`, {
    state,
    labels: args.labels?.trim() || undefined,
    per_page: limit,
    order_by: "created_at",
    sort: "desc",
  })
  const header = `Issues across the group ${raw} (state: ${state}${args.labels ? `, labels: ${args.labels}` : ""})`
  if (!issues.length) return `${header}\n\nNo issues matched.`
  const lines = [`${header} — ${issues.length} newest shown`, ""]
  issues.forEach((issue) => {
    const project = issue.references?.full?.split("#")[0] ?? "unknown project"
    lines.push(issueLine(issue))
    lines.push(`   project: ${project.trim()}`)
  })
  return lines.join("\n")
}

export async function issueStats(args: { project: string; days?: number }): Promise<string> {
  const project = projectId(args.project)
  const issues = await api<GitLabIssue[]>(`/projects/${project}/issues`, {
    state: "all",
    per_page: 100,
    order_by: "created_at",
    sort: "desc",
  })
  const recent = createdAfterFilter(issues, args.days)
  const scoped = recent.length ? recent : issues
  const open = scoped.filter((i) => i.state === "opened").length
  const closed = scoped.filter((i) => i.state === "closed").length

  const labelCounts = new Map<string, number>()
  for (const issue of scoped) {
    for (const label of issue.labels ?? []) labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1)
  }
  const topLabels = [...labelCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)

  const unassigned = scoped.filter((i) => !(i.assignees ?? []).length).length
  const withComments = scoped.filter((i) => (i.user_notes_count ?? 0) > 0).length
  const stale = scoped.filter((i) => i.state === "opened" && Date.now() - new Date(i.updated_at).getTime() > 90 * 86400000).length

  const lines = [
    `Issue stats for ${decodeURIComponent(project)}`,
    args.days ? `Window: issues created in the last ${args.days} day(s) (${scoped.length} of ${issues.length} fetched)` : `Based on the ${scoped.length} most recently created issue(s)`,
    "",
    `Open: ${open} | Closed: ${closed}${scoped.length ? ` | Close rate: ${Math.round((closed / scoped.length) * 100)}%` : ""}`,
    `Unassigned: ${unassigned} | With comments: ${withComments} | Open and untouched for 90+ days: ${stale}`,
    "",
    topLabels.length ? `Most common labels:\n${topLabels.map(([label, count]) => `  ${count.toString().padStart(4)}  ${label}`).join("\n")}` : "No labels applied in this window.",
  ]
  if (unassigned > scoped.length / 2) lines.push("", "Note: most issues have no assignee, so nothing is clearly owned.")
  if (stale > 0) lines.push("", `Note: ${stale} open issue(s) have had no update in over 90 days.`)
  return lines.join("\n")
}

export async function recentIssues(args: { project: string; limit?: number }): Promise<string> {
  const project = projectId(args.project)
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 30)
  const issues = await api<GitLabIssue[]>(`/projects/${project}/issues`, {
    state: "opened",
    per_page: limit,
    order_by: "updated_at",
    sort: "desc",
  })
  if (!issues.length) return `No open issues in ${decodeURIComponent(project)}.`
  const lines = [
    `Most recently updated open issues in ${decodeURIComponent(project)}:`,
    "",
  ]
  issues.forEach((issue) => {
    const days = Math.round((Date.now() - new Date(issue.updated_at).getTime()) / 86400000)
    lines.push(`#${issue.iid} ${issue.title}`)
    lines.push(`   last update ${days === 0 ? "today" : `${days} day(s) ago`} by ${issue.author?.name ?? "unknown"} | ${issue.user_notes_count ?? 0} comment(s)${issue.labels?.length ? ` | ${issue.labels.join(", ")}` : ""}`)
  })
  return lines.join("\n")
}
