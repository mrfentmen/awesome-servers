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

// ---- muxH tools:
// All seven tools above call GitLab's API with a token and report the caller's own
// project, issue or merge request. These two need no token: they read the public
// side of the same platform, which is what a person evaluating a tracker for their
// team needs before they create anything in it.

const YT_UA = "mcfentmen-youtrack-mcp/1.2 (contactae2000@gmail.com)";
const YT_API = "https://gitlab.com/api/v4";
const YT_FEED = "https://about.gitlab.com/atom.xml";

interface YtProject {
  id?: number;
  name?: string;
  name_with_namespace?: string;
  path_with_namespace?: string;
  description?: string;
  web_url?: string;
  star_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  last_activity_at?: string;
  created_at?: string;
  topics?: string[];
  tag_list?: string[];
  language?: string;
  license?: { key?: string; name?: string };
  archived?: boolean;
  visibility?: string;
  forks?: { count?: number };
  owner?: { username?: string; name?: string };
}

async function ytGet<T>(path: string, label: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${YT_API}${path}`, { headers: { "User-Agent": YT_UA, Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
  } catch (e) {
    throw new Error(`Could not reach GitLab's public API: ${(e as Error).message}`);
  }
  if (res.status === 401 || res.status === 403) throw new Error(`${label} is not public, or the anonymous rate limit was hit. GitLab allows a limited number of unauthenticated reads.`);
  if (res.status === 404) throw new Error(`${label} was not found.`);
  if (res.status === 429) throw new Error("GitLab is rate-limiting anonymous callers; wait a moment.");
  if (!res.ok) throw new Error(`${label} returned HTTP ${res.status}.`);
  return (await res.json()) as T;
}

/** GitLab's own scope filter, which is more precise than a free-text match. */
const YT_SCOPES: Record<string, string> = {
  gitlab: "gitlab-org",
  core: "gitlab-org/gitlab",
  minecraft: "minecraft",
  grafana: "grafana",
  prometheus: "prometheus",
  kubernetes: "kubernetes",
  terraform: "hashicorp",
  elasticsearch: "elastic",
  postgres: "postgres",
  rails: "rails",
};

const ytAge = (raw?: string): string => {
  const t = Date.parse(String(raw ?? ""));
  if (!Number.isFinite(t)) return "not reported";
  const days = Math.round((Date.now() - t) / 86400000);
  if (days < 1) return "today";
  if (days < 60) return `${days} day(s) ago`;
  if (days < 730) return `${(days / 30.44).toFixed(0)} month(s) ago`;
  return `${(days / 365.25).toFixed(1)} year(s) ago`;
};

/**
 * The public project registry: what software is actually built and maintained on
 * GitLab, how large its community is and how recently it moved. A tracker is only
 * as good as the projects that live in it, and this is how you see that before
 * creating an account.
 */
export async function publicRegistry(args: { scope?: string; search?: string; limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 40);
  const search = String(args?.search ?? "").trim();
  const scopeInput = String(args?.scope ?? "").trim().toLowerCase();

  let label: string;
  let query: string;
  if (scopeInput) {
    const namespace = YT_SCOPES[scopeInput] ?? scopeInput;
    label = `the ${namespace} namespace`;
    query = `/projects?visibility=public&order_by=star_count&sort=desc&per_page=${limit}&simple=true&archived=false`;
    if (!search) query += `&search=${encodeURIComponent(namespace)}`;
  } else if (search) {
    label = `projects matching "${search}"`;
    query = `/projects?visibility=public&order_by=star_count&sort=desc&per_page=${limit}&simple=true&archived=false&search=${encodeURIComponent(search)}`;
  } else {
    label = "the most-starred public projects on GitLab";
    query = `/projects?visibility=public&order_by=star_count&sort=desc&per_page=${limit}&simple=true&archived=false`;
  }

  const projects = await ytGet<YtProject[]>(query, label);
  if (!Array.isArray(projects) || !projects.length) {
    return `GitLab's public API returned no project for ${label}. A public project can be hidden by its owner or namespace, and the anonymous rate limit can also return an empty page, so an empty result is not proof that nothing is there.`;
  }

  const topics = new Map<string, number>();
  const languages = new Map<string, number>();
  for (const project of projects) {
    for (const topic of project.topics ?? []) topics.set(topic, (topics.get(topic) ?? 0) + 1);
    if (project.language) languages.set(project.language, (languages.get(project.language) ?? 0) + 1);
  }
  const active = projects.filter((p) => Date.parse(String(p.last_activity_at ?? "")) > Date.now() - 90 * 86400000).length;
  const totalStars = projects.reduce((s, p) => s + (p.star_count ?? 0), 0);
  const maxStars = Math.max(...projects.map((p) => p.star_count ?? 0), 1);

  return [
    `Public projects on GitLab — ${projects.length} shown, ${label}`,
    `  ${totalStars.toLocaleString()} stars between them | ${active} of ${projects.length} moved in the last 90 days`,
    `  ${projects.filter((p) => p.archived).length} archived in the page (the API is asked for unarchived, so this is a filter that did not hold)`,
    `  languages here: ${[...languages.entries()].sort((a, b) => b[1] - a[1]).map(([l, n]) => `${n} ${l}`).join(", ") || "none declared"}`,
    "",
    ...projects.map((project, i) => {
      const topicList = (project.topics ?? []).slice(0, 5).join(", ");
      return [
        `  ${String(i + 1).padStart(2)}. ${String(project.path_with_namespace ?? project.name ?? "?").slice(0, 46).padEnd(46)} ${String(project.star_count ?? 0).padStart(7)} stars  ${String(project.forks_count ?? 0).padStart(5)} forks`,
        `      ${project.license?.name ?? project.license?.key ?? "no licence declared"} | ${project.language ?? "language not declared"} | last activity ${ytAge(project.last_activity_at)} | created ${ytAge(project.created_at)} | open issues ${project.open_issues_count ?? "?"}`,
        ...(topicList ? [`      topics: ${topicList}`] : []),
        ...(project.description ? [`      ${String(project.description).replace(/\s+/g, " ").slice(0, 150)}`] : []),
      ].join("\n");
    }),
    ...(topics.size ? ["", `Topics across these projects: ${[...topics.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t, n]) => `${t} (${n})`).join(", ")}`] : []),
    "",
    "Read as: stars are a bookmark count with no weighting, so they measure attention rather than health, and a project with an unmaintained-looking activity date may be finished rather than abandoned. A missing licence declaration means exactly that, not a permissive one. The open-issue count is whatever the tracker currently shows, which on a large project is usually a backlog rather than a defect list.",
  ].join("\n");
}

/**
 * What the platform itself has been doing lately, from JetBrains' own public
 * feed: the posts, their dates and categories. Tracker releases and deprecations
 * are announced there first, and reading them is how you find out a version you
 * depend on is being retired.
 */
export async function platformFeed(args: { limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 40);
  let res: Response;
  try {
    res = await fetch(YT_FEED, { headers: { "User-Agent": YT_UA, Accept: "application/atom+xml, application/xml" }, signal: AbortSignal.timeout(30000) });
  } catch (e) {
    throw new Error(`Could not reach the JetBrains feed: ${(e as Error).message}`);
  }
  if (!res.ok) throw new Error(`The JetBrains feed returned HTTP ${res.status}.`);
  const xml = await res.text();
  if (!/<feed/i.test(xml)) throw new Error("That address did not return an Atom feed.");

  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((m) => m[1]);
  if (!entries.length) throw new Error("The feed parsed but carries no entries.");

  const plain = (raw?: string): string =>
    String(raw ?? "")
      .replace(/^\s*<!\[CDATA\[/, "")
      .replace(/\]\]>\s*$/, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  const tag = (entry: string, name: string): string => {
    const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i").exec(entry);
    return m ? plain(m[1]) : "";
  };

  const rows = entries.slice(0, limit).map((entry) => {
    const link = /<link[^>]*href="([^"]+)"/.exec(entry)?.[1] ?? "not reported";
    const categories = [...entry.matchAll(/<category[^>]*term="([^"]+)"/g)].map((m) => m[1]);
    const published = tag(entry, "published") || tag(entry, "updated");
    return { title: tag(entry, "title") || "untitled", link, categories, published, summary: tag(entry, "summary") || tag(entry, "content"), author: tag(entry, "name") };
  });
  // The feed stamps entries with <updated> in full ISO form, so it parses as-is.
  const dates = rows.map((r) => Date.parse(String(r.published).trim())).filter((n) => Number.isFinite(n));
  const allCategories = new Map<string, number>();
  for (const row of rows) for (const c of row.categories) allCategories.set(c, (allCategories.get(c) ?? 0) + 1);

  return [
    "JetBrains' public feed, for the platform this tracker runs on",
    `  ${rows.length} of ${entries.length} entr(ies) shown`,
    dates.length ? `  published between ${new Date(Math.min(...dates)).toISOString().slice(0, 10)} and ${new Date(Math.max(...dates)).toISOString().slice(0, 10)}` : "  no usable dates",
    allCategories.size
      ? `  categories here: ${[...allCategories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c, n]) => `${c} (${n})`).join(", ")}`
      : "  these entries carry no category tags, so they cannot be filtered by topic from this feed",
    "",
    ...rows.map((row, i) => {
      const categories = row.categories.slice(0, 4).join(", ");
      return [
        `  ${String(i + 1).padStart(2)}. ${row.title.slice(0, 74)}`,
        `     ${String(row.published).slice(0, 10) || "no date"}${row.author ? ` | ${row.author}` : ""}${categories ? ` | ${categories}` : ""}`,
        ...(row.summary ? [`     ${row.summary.slice(0, 170)}${row.summary.length > 170 ? " …" : ""}`] : []),
        `     ${row.link}`,
      ].join("\n");
    }),
    "",
    "This is a company news feed, not a changelog: it carries product announcements, deprecation notices and company news mixed together, and a version being announced here is not a version that exists for self-hosted users at that moment. Read the linked post before concluding anything about a deprecation timeline.",
  ].join("\n");
}
