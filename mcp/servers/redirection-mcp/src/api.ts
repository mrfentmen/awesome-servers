const DEFAULT_BASE_URL = "https://api.redirection.io/api/v1"

export class RedirectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RedirectionError"
  }
}

function baseUrl(): string {
  const raw = process.env.REDIRECTION_BASE_URL?.trim()
  if (!raw) return DEFAULT_BASE_URL
  return raw.replace(/\/+$/, "")
}

function apiToken(): string {
  const token = process.env.REDIRECTION_API_TOKEN?.trim()
  if (!token) {
    throw new RedirectionError(
      "REDIRECTION_API_TOKEN is not set. Create an API token in your redirection.io account (https://redirection.io) and export it."
    )
  }
  return token
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface RequestOptions {
  body?: Record<string, unknown>
  query?: Record<string, string | number | boolean | undefined>
}

function asObj(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asArr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function bool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

/** redirection.io wraps collections differently per endpoint; probe the usual keys. */
function collection(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload
  const obj = asObj(payload)
  for (const key of keys) {
    const value = obj[key]
    if (Array.isArray(value)) return value
  }
  const data = obj.data
  if (Array.isArray(data)) return data
  return asArr(obj.items)
}

function queryString(query: RequestOptions["query"]): string {
  if (!query) return ""
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

function firstLine(text: string): string {
  const line = text.split("\n")[0].trim()
  return line.length > 200 ? `${line.slice(0, 200)}…` : line
}

async function errorDetail(res: Response): Promise<string> {
  const raw = await res.text().catch(() => "")
  if (!raw.trim()) return res.statusText || `HTTP ${res.status}`
  try {
    const body = asObj(JSON.parse(raw) as unknown)
    const message = str(body.message) ?? str(body.error) ?? str(body.detail)
    if (message) return firstLine(message)
  } catch {
    // Body was not JSON — fall through to the raw text.
  }
  return firstLine(raw)
}

async function request(
  method: HttpMethod,
  path: string,
  opts: RequestOptions = {}
): Promise<unknown> {
  const url = `${baseUrl()}${path}${queryString(opts.query)}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiToken()}`,
    Accept: "application/json",
  }
  if (opts.body) headers["Content-Type"] = "application/json"

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    throw new RedirectionError(`Cannot reach redirection.io at ${baseUrl()}: ${detail}`)
  }

  if (!res.ok) {
    throw new RedirectionError(`redirection.io ${res.status} on ${method} ${path}: ${await errorDetail(res)}`)
  }
  if (res.status === 204) return null

  const raw = await res.text()
  if (!raw.trim()) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    throw new RedirectionError(`redirection.io returned non-JSON for ${method} ${path}`)
  }
}

// ---------------------------------------------------------------- models

export interface Project {
  id: string
  name: string
  description?: string
  hostname?: string
  createdAt?: string
  updatedAt?: string
}

export interface Rule {
  id: string
  projectId?: string
  action?: string
  value?: string
  note?: string
  enabled?: boolean
  position?: number
}

export interface RuleChange {
  id: string
  projectId?: string
  ruleId?: string
  action?: string
  value?: string
  note?: string
  status?: string
  createdAt?: string
}

export interface RuleSetVersion {
  id: string
  projectId?: string
  number?: number
  status?: string
  publishedAt?: string
  createdAt?: string
}

export interface Crawl {
  id: string
  projectId?: string
  status?: string
  startedAt?: string
  finishedAt?: string
  urlCount?: number
}

export interface CrawlUrl {
  id: string
  crawlId?: string
  url?: string
  statusCode?: number
  redirectCount?: number
}

export interface ImportJob {
  id: string
  projectId?: string
  status?: string
  format?: string
  createdAt?: string
  importedCount?: number
}

export interface UrlExplanation {
  id: string
  url?: string
  status?: string
  matchedRules?: string[]
}

export interface ImpactAnalysis {
  id: string
  status?: string
  affectedRuleCount?: number
  affectedUrlCount?: number
}

export interface Instance {
  id: string
  name?: string
  type?: string
  status?: string
  version?: string
  lastSeenAt?: string
}

export interface AggregateLog {
  id: string
  projectId?: string
  periodStart?: string
  periodEnd?: string
  hits?: number
  misses?: number
}

export interface Invitation {
  id: string
  email?: string
  role?: string
  status?: string
  createdAt?: string
}

export interface AgentRule {
  id: string
  projectId?: string
  action?: string
  value?: string
}

// ---------------------------------------------------------------- parsers

function parseProject(v: unknown): Project {
  const o = asObj(v)
  return {
    id: str(o.id) ?? str(o.project_id) ?? "(unknown)",
    name: str(o.name) ?? str(o.title) ?? "(unnamed project)",
    description: str(o.description),
    hostname: str(o.hostname) ?? str(o.host),
    createdAt: str(o.created_at) ?? str(o.createdAt),
    updatedAt: str(o.updated_at) ?? str(o.updatedAt),
  }
}

function parseRule(v: unknown): Rule {
  const o = asObj(v)
  return {
    id: str(o.id) ?? "(unknown)",
    projectId: str(o.project_id) ?? str(o.projectId),
    action: str(o.action) ?? str(o.type),
    value: str(o.value) ?? str(o.target),
    note: str(o.note) ?? str(o.description),
    enabled: bool(o.enabled) ?? bool(o.active),
    position: num(o.position),
  }
}

function parseRuleChange(v: unknown): RuleChange {
  const o = asObj(v)
  return {
    id: str(o.id) ?? "(unknown)",
    projectId: str(o.project_id) ?? str(o.projectId),
    ruleId: str(o.rule_id) ?? str(o.ruleId),
    action: str(o.action) ?? str(o.type),
    value: str(o.value) ?? str(o.target),
    note: str(o.note),
    status: str(o.status) ?? str(o.state),
    createdAt: str(o.created_at) ?? str(o.createdAt),
  }
}

function parseRuleSetVersion(v: unknown): RuleSetVersion {
  const o = asObj(v)
  return {
    id: str(o.id) ?? "(unknown)",
    projectId: str(o.project_id) ?? str(o.projectId),
    number: num(o.number) ?? num(o.version),
    status: str(o.status) ?? str(o.state),
    publishedAt: str(o.published_at) ?? str(o.publishedAt),
    createdAt: str(o.created_at) ?? str(o.createdAt),
  }
}

function parseCrawl(v: unknown): Crawl {
  const o = asObj(v)
  return {
    id: str(o.id) ?? "(unknown)",
    projectId: str(o.project_id) ?? str(o.projectId),
    status: str(o.status) ?? str(o.state),
    startedAt: str(o.started_at) ?? str(o.startedAt),
    finishedAt: str(o.finished_at) ?? str(o.finishedAt),
    urlCount: num(o.url_count) ?? num(o.urlCount) ?? num(o.urls),
  }
}

function parseCrawlUrl(v: unknown): CrawlUrl {
  const o = asObj(v)
  return {
    id: str(o.id) ?? str(o.url) ?? "(unknown)",
    crawlId: str(o.crawl_id) ?? str(o.crawlId),
    url: str(o.url) ?? str(o.location),
    statusCode: num(o.status_code) ?? num(o.statusCode),
    redirectCount: num(o.redirect_count) ?? num(o.redirectCount),
  }
}

function parseImport(v: unknown): ImportJob {
  const o = asObj(v)
  return {
    id: str(o.id) ?? "(unknown)",
    projectId: str(o.project_id) ?? str(o.projectId),
    status: str(o.status) ?? str(o.state),
    format: str(o.format) ?? str(o.type),
    createdAt: str(o.created_at) ?? str(o.createdAt),
    importedCount: num(o.imported_count) ?? num(o.importedCount),
  }
}

function parseExplanation(v: unknown): UrlExplanation {
  const o = asObj(v)
  const rules = asArr(o.matched_rules ?? o.matchedRules ?? o.rules)
    .map((item) => str(asObj(item).id) ?? str(item))
    .filter((item): item is string => item !== undefined)
  return {
    id: str(o.id) ?? str(o.url) ?? "(unknown)",
    url: str(o.url),
    status: str(o.status) ?? str(o.result),
    matchedRules: rules,
  }
}

function parseImpact(v: unknown): ImpactAnalysis {
  const o = asObj(v)
  return {
    id: str(o.id) ?? "(unknown)",
    status: str(o.status) ?? str(o.state),
    affectedRuleCount: num(o.affected_rule_count) ?? num(o.affectedRuleCount) ?? num(o.rules),
    affectedUrlCount: num(o.affected_url_count) ?? num(o.affectedUrlCount) ?? num(o.urls),
  }
}

function parseInstance(v: unknown): Instance {
  const o = asObj(v)
  return {
    id: str(o.id) ?? "(unknown)",
    name: str(o.name) ?? str(o.hostname),
    type: str(o.type) ?? str(o.kind),
    status: str(o.status) ?? str(o.state),
    version: str(o.version),
    lastSeenAt: str(o.last_seen_at) ?? str(o.lastSeenAt),
  }
}

function parseAggregateLog(v: unknown): AggregateLog {
  const o = asObj(v)
  return {
    id: str(o.id) ?? "(unknown)",
    projectId: str(o.project_id) ?? str(o.projectId),
    periodStart: str(o.period_start) ?? str(o.periodStart) ?? str(o.from),
    periodEnd: str(o.period_end) ?? str(o.periodEnd) ?? str(o.to),
    hits: num(o.hits) ?? num(o.matched),
    misses: num(o.misses) ?? num(o.unmatched),
  }
}

function parseInvitation(v: unknown): Invitation {
  const o = asObj(v)
  return {
    id: str(o.id) ?? str(o.token) ?? "(unknown)",
    email: str(o.email),
    role: str(o.role),
    status: str(o.status) ?? str(o.state),
    createdAt: str(o.created_at) ?? str(o.createdAt),
  }
}

function parseAgentRule(v: unknown): AgentRule {
  const o = asObj(v)
  return {
    id: str(o.id) ?? "(unknown)",
    projectId: str(o.project_id) ?? str(o.projectId),
    action: str(o.action) ?? str(o.type),
    value: str(o.value) ?? str(o.target),
  }
}

// ---------------------------------------------------------------- endpoints

export async function listProjects(limit?: number, page?: number): Promise<Project[]> {
  const payload = await request("GET", "/projects", { query: { limit, page } })
  return collection(payload, ["projects"]).map(parseProject)
}

export async function createProject(body: Record<string, unknown>): Promise<Project> {
  const payload = await request("POST", "/projects", { body })
  return parseProject(asObj(payload).project ?? payload)
}

export async function getProject(id: string): Promise<Project> {
  const payload = await request("GET", `/projects/${encodeURIComponent(id)}`)
  return parseProject(asObj(payload).project ?? payload)
}

export async function updateProject(id: string, body: Record<string, unknown>): Promise<Project> {
  const payload = await request("PUT", `/projects/${encodeURIComponent(id)}`, { body })
  return parseProject(asObj(payload).project ?? payload)
}

export async function deleteProject(id: string): Promise<void> {
  await request("DELETE", `/projects/${encodeURIComponent(id)}`)
}

export async function listRules(limit?: number, page?: number): Promise<Rule[]> {
  const payload = await request("GET", "/rules", { query: { limit, page } })
  return collection(payload, ["rules"]).map(parseRule)
}

export async function getRule(id: string): Promise<Rule> {
  const payload = await request("GET", `/rules/${encodeURIComponent(id)}`)
  return parseRule(asObj(payload).rule ?? payload)
}

export async function listRuleChanges(limit?: number, page?: number): Promise<RuleChange[]> {
  const payload = await request("GET", "/rule-changes", { query: { limit, page } })
  return collection(payload, ["rule_changes", "ruleChanges", "changes"]).map(parseRuleChange)
}

export async function createRuleChange(body: Record<string, unknown>): Promise<RuleChange> {
  const payload = await request("POST", "/rule-changes", { body })
  return parseRuleChange(asObj(payload).rule_change ?? asObj(payload).ruleChange ?? payload)
}

export async function getRuleChange(id: string): Promise<RuleChange> {
  const payload = await request("GET", `/rule-changes/${encodeURIComponent(id)}`)
  return parseRuleChange(asObj(payload).rule_change ?? asObj(payload).ruleChange ?? payload)
}

export async function deleteRuleChange(id: string): Promise<void> {
  await request("DELETE", `/rule-changes/${encodeURIComponent(id)}`)
}

export async function listRuleSetVersions(limit?: number, page?: number): Promise<RuleSetVersion[]> {
  const payload = await request("GET", "/rule-set-versions", { query: { limit, page } })
  return collection(payload, ["rule_set_versions", "ruleSetVersions", "versions"]).map(parseRuleSetVersion)
}

export async function getRuleSetVersion(id: string): Promise<RuleSetVersion> {
  const payload = await request("GET", `/rule-set-versions/${encodeURIComponent(id)}`)
  return parseRuleSetVersion(payload)
}

export async function publishRuleSetVersion(id: string): Promise<RuleSetVersion> {
  const payload = await request("POST", `/rule-set-versions/${encodeURIComponent(id)}/publish`)
  return parseRuleSetVersion(payload)
}

export async function clearRuleSetVersion(id: string): Promise<RuleSetVersion> {
  const payload = await request("POST", `/rule-set-versions/${encodeURIComponent(id)}/clear`)
  return parseRuleSetVersion(payload)
}

export async function exportRules(): Promise<unknown> {
  return request("GET", "/export-rules")
}

export async function getRuleStatistics(id?: string): Promise<unknown> {
  const path = id ? `/rule-statistics/${encodeURIComponent(id)}` : "/rule-statistics"
  return request("GET", path)
}

export async function listCrawls(limit?: number, page?: number): Promise<Crawl[]> {
  const payload = await request("GET", "/crawls", { query: { limit, page } })
  return collection(payload, ["crawls"]).map(parseCrawl)
}

export async function createCrawl(body: Record<string, unknown>): Promise<Crawl> {
  const payload = await request("POST", "/crawls", { body })
  return parseCrawl(asObj(payload).crawl ?? payload)
}

export async function getCrawl(id: string): Promise<Crawl> {
  const payload = await request("GET", `/crawls/${encodeURIComponent(id)}`)
  return parseCrawl(asObj(payload).crawl ?? payload)
}

export async function cancelCrawl(id: string): Promise<Crawl> {
  const payload = await request("POST", `/crawls/${encodeURIComponent(id)}/cancel`)
  return parseCrawl(asObj(payload).crawl ?? payload)
}

export async function listCrawlUrls(limit?: number, page?: number): Promise<CrawlUrl[]> {
  const payload = await request("GET", "/crawl-urls", { query: { limit, page } })
  return collection(payload, ["crawl_urls", "crawlUrls", "urls"]).map(parseCrawlUrl)
}

export async function listImports(limit?: number, page?: number): Promise<ImportJob[]> {
  const payload = await request("GET", "/imports", { query: { limit, page } })
  return collection(payload, ["imports"]).map(parseImport)
}

export async function createImport(body: Record<string, unknown>): Promise<ImportJob> {
  const payload = await request("POST", "/imports", { body })
  return parseImport(asObj(payload).import ?? payload)
}

export async function getImport(id: string): Promise<ImportJob> {
  const payload = await request("GET", `/imports/${encodeURIComponent(id)}`)
  return parseImport(asObj(payload).import ?? payload)
}

export async function explainUrls(body: Record<string, unknown>): Promise<UrlExplanation[]> {
  const payload = await request("POST", "/explain-urls", { body })
  return collection(payload, ["explanations", "urls"]).map(parseExplanation)
}

export async function getUrlExplanation(id: string): Promise<UrlExplanation> {
  const payload = await request("GET", `/explain-urls/${encodeURIComponent(id)}`)
  return parseExplanation(asObj(payload).explanation ?? payload)
}

export async function impactOfRuleChanges(body: Record<string, unknown>): Promise<ImpactAnalysis> {
  const payload = await request("POST", "/impact-rule-changes", { body })
  return parseImpact(asObj(payload).impact ?? payload)
}

export async function getImpactAnalysis(id: string): Promise<ImpactAnalysis> {
  const payload = await request("GET", `/impact-rule-changes/${encodeURIComponent(id)}`)
  return parseImpact(asObj(payload).impact ?? payload)
}

export async function listInstances(limit?: number, page?: number): Promise<Instance[]> {
  const payload = await request("GET", "/instances", { query: { limit, page } })
  return collection(payload, ["instances"]).map(parseInstance)
}

export async function getInstance(id: string): Promise<Instance> {
  const payload = await request("GET", `/instances/${encodeURIComponent(id)}`)
  return parseInstance(asObj(payload).instance ?? payload)
}

export async function updateInstance(id: string, body: Record<string, unknown>): Promise<Instance> {
  const payload = await request("PUT", `/instances/${encodeURIComponent(id)}`, { body })
  return parseInstance(asObj(payload).instance ?? payload)
}

export async function listAggregateLogs(limit?: number, page?: number): Promise<AggregateLog[]> {
  const payload = await request("GET", "/aggregate-logs", { query: { limit, page } })
  return collection(payload, ["aggregate_logs", "aggregateLogs", "logs"]).map(parseAggregateLog)
}

export async function getAggregateLog(id: string): Promise<AggregateLog> {
  const payload = await request("GET", `/aggregate-logs/${encodeURIComponent(id)}`)
  return parseAggregateLog(asObj(payload).log ?? payload)
}

export async function listInvitations(limit?: number, page?: number): Promise<Invitation[]> {
  const payload = await request("GET", "/invitations", { query: { limit, page } })
  return collection(payload, ["invitations"]).map(parseInvitation)
}

export async function createInvitation(body: Record<string, unknown>): Promise<Invitation> {
  const payload = await request("POST", "/invitations", { body })
  return parseInvitation(asObj(payload).invitation ?? payload)
}

export async function listAgentRules(limit?: number, page?: number): Promise<AgentRule[]> {
  const payload = await request("GET", "/agent-rules", { query: { limit, page } })
  return collection(payload, ["rules", "agent_rules", "agentRules"]).map(parseAgentRule)
}

export async function listAgentRuleStraights(limit?: number, page?: number): Promise<AgentRule[]> {
  const payload = await request("GET", "/agent-rule-straights", { query: { limit, page } })
  return collection(payload, ["rules", "straights"]).map(parseAgentRule)
}

export async function listAgentRuleComplexes(limit?: number, page?: number): Promise<AgentRule[]> {
  const payload = await request("GET", "/agent-rule-complexes", { query: { limit, page } })
  return collection(payload, ["rules", "complexes"]).map(parseAgentRule)
}

// ---------------------------------------------------------------- formatters

function yesNo(value: boolean | undefined): string {
  return value === undefined ? "unknown" : value ? "enabled" : "disabled"
}

function orDash(value: string | number | undefined): string {
  return value === undefined ? "—" : String(value)
}

export function formatProject(project: Project): string {
  const lines = [`${project.name} · id ${project.id}`]
  if (project.hostname) lines.push(`Host: ${project.hostname}`)
  if (project.description) lines.push(`About: ${project.description}`)
  if (project.createdAt) lines.push(`Created: ${project.createdAt}`)
  return lines.join("\n")
}

export function formatProjects(projects: Project[]): string {
  if (projects.length === 0) return "No projects found."
  return projects.map((project, i) => `${i + 1}. ${formatProject(project)}`).join("\n\n")
}

export function formatRule(rule: Rule): string {
  const lines = [`Rule ${rule.id}`]
  if (rule.action) lines.push(`Action: ${rule.action}`)
  if (rule.value) lines.push(`Value: ${rule.value}`)
  lines.push(`Status: ${yesNo(rule.enabled)}`)
  if (rule.note) lines.push(`Note: ${rule.note}`)
  return lines.join("\n")
}

export function formatRules(rules: Rule[]): string {
  if (rules.length === 0) return "No rules found."
  return rules.map((rule, i) => `${i + 1}. ${formatRule(rule)}`).join("\n\n")
}

export function formatRuleChange(change: RuleChange): string {
  const lines = [`Change ${change.id} · ${orDash(change.status)}`]
  if (change.ruleId) lines.push(`Rule: ${change.ruleId}`)
  if (change.action) lines.push(`Action: ${change.action}`)
  if (change.value) lines.push(`Value: ${change.value}`)
  if (change.note) lines.push(`Note: ${change.note}`)
  if (change.createdAt) lines.push(`Created: ${change.createdAt}`)
  return lines.join("\n")
}

export function formatRuleChanges(changes: RuleChange[]): string {
  if (changes.length === 0) return "No rule changes found."
  return changes.map((change, i) => `${i + 1}. ${formatRuleChange(change)}`).join("\n\n")
}

export function formatRuleSetVersion(version: RuleSetVersion): string {
  const lines = [`Rule set version ${version.id}`]
  if (version.number !== undefined) lines.push(`Number: ${version.number}`)
  if (version.status) lines.push(`Status: ${version.status}`)
  if (version.publishedAt) lines.push(`Published: ${version.publishedAt}`)
  if (version.createdAt) lines.push(`Created: ${version.createdAt}`)
  return lines.join("\n")
}

export function formatRuleSetVersions(versions: RuleSetVersion[]): string {
  if (versions.length === 0) return "No rule set versions found."
  return versions.map((v, i) => `${i + 1}. ${formatRuleSetVersion(v)}`).join("\n\n")
}

export function formatCrawl(crawl: Crawl): string {
  const lines = [`Crawl ${crawl.id} · ${orDash(crawl.status)}`]
  if (crawl.urlCount !== undefined) lines.push(`URLs: ${crawl.urlCount}`)
  if (crawl.startedAt) lines.push(`Started: ${crawl.startedAt}`)
  if (crawl.finishedAt) lines.push(`Finished: ${crawl.finishedAt}`)
  return lines.join("\n")
}

export function formatCrawls(crawls: Crawl[]): string {
  if (crawls.length === 0) return "No crawls found."
  return crawls.map((c, i) => `${i + 1}. ${formatCrawl(c)}`).join("\n\n")
}

export function formatCrawlUrls(urls: CrawlUrl[]): string {
  if (urls.length === 0) return "No crawled URLs found."
  return urls
    .map((u, i) => `${i + 1}. ${orDash(u.url)} · status ${orDash(u.statusCode)} · redirects ${orDash(u.redirectCount)}`)
    .join("\n")
}

export function formatImport(job: ImportJob): string {
  const lines = [`Import ${job.id} · ${orDash(job.status)}`]
  if (job.format) lines.push(`Format: ${job.format}`)
  if (job.importedCount !== undefined) lines.push(`Imported: ${job.importedCount}`)
  if (job.createdAt) lines.push(`Created: ${job.createdAt}`)
  return lines.join("\n")
}

export function formatImports(jobs: ImportJob[]): string {
  if (jobs.length === 0) return "No imports found."
  return jobs.map((j, i) => `${i + 1}. ${formatImport(j)}`).join("\n\n")
}

export function formatExplanation(explanation: UrlExplanation): string {
  const lines = [`${orDash(explanation.url)} · ${orDash(explanation.status)}`]
  if (explanation.matchedRules && explanation.matchedRules.length > 0) {
    lines.push(`Matched rules: ${explanation.matchedRules.join(", ")}`)
  }
  return lines.join("\n")
}

export function formatExplanations(explanations: UrlExplanation[]): string {
  if (explanations.length === 0) return "No explanations returned."
  return explanations.map((e, i) => `${i + 1}. ${formatExplanation(e)}`).join("\n\n")
}

export function formatImpact(impact: ImpactAnalysis): string {
  const lines = [`Impact analysis ${impact.id} · ${orDash(impact.status)}`]
  if (impact.affectedRuleCount !== undefined) lines.push(`Affected rules: ${impact.affectedRuleCount}`)
  if (impact.affectedUrlCount !== undefined) lines.push(`Affected URLs: ${impact.affectedUrlCount}`)
  return lines.join("\n")
}

export function formatInstance(instance: Instance): string {
  const lines = [`${orDash(instance.name)} · ${orDash(instance.type)} · ${orDash(instance.status)}`]
  if (instance.version) lines.push(`Version: ${instance.version}`)
  if (instance.lastSeenAt) lines.push(`Last seen: ${instance.lastSeenAt}`)
  return lines.join("\n")
}

export function formatInstances(instances: Instance[]): string {
  if (instances.length === 0) return "No instances found."
  return instances.map((instance, i) => `${i + 1}. ${formatInstance(instance)}`).join("\n\n")
}

export function formatAggregateLog(log: AggregateLog): string {
  const lines = [`Log ${log.id}`]
  if (log.periodStart || log.periodEnd) {
    lines.push(`Period: ${orDash(log.periodStart)} → ${orDash(log.periodEnd)}`)
  }
  if (log.hits !== undefined) lines.push(`Hits: ${log.hits}`)
  if (log.misses !== undefined) lines.push(`Misses: ${log.misses}`)
  return lines.join("\n")
}

export function formatAggregateLogs(logs: AggregateLog[]): string {
  if (logs.length === 0) return "No aggregate logs found."
  return logs.map((log, i) => `${i + 1}. ${formatAggregateLog(log)}`).join("\n\n")
}

export function formatInvitation(invitation: Invitation): string {
  const lines = [`${orDash(invitation.email)} · ${orDash(invitation.role)} · ${orDash(invitation.status)}`]
  if (invitation.createdAt) lines.push(`Created: ${invitation.createdAt}`)
  return lines.join("\n")
}

export function formatInvitations(invitations: Invitation[]): string {
  if (invitations.length === 0) return "No invitations found."
  return invitations.map((invitation, i) => `${i + 1}. ${formatInvitation(invitation)}`).join("\n\n")
}

export function formatAgentRules(rules: AgentRule[]): string {
  if (rules.length === 0) return "No agent rules found."
  return rules
    .map((rule, i) => `${i + 1}. ${orDash(rule.action)} → ${orDash(rule.value)} · id ${rule.id}`)
    .join("\n")
}

export function formatUnknown(label: string, payload: unknown): string {
  return `${label}:\n${JSON.stringify(payload, null, 2)}`
}
