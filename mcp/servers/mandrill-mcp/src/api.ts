/**
 * Mandrill client. Mandrill (Mailchimp Transactional) speaks a single
 * convention: every method is `POST https://mandrillapp.com/api/1.0/<name>.json`
 * with the API key inside the JSON body. There are no auth headers, and API
 * failures can come back as HTTP 500 (or HTTP 200) with
 * `{status: "error", name, message}` — so the body decides, not the status.
 */
const BASE = "https://mandrillapp.com/api/1.0"

export class MandrillError extends Error {}

/** Read the API key, failing loudly with the env var name when it is absent. */
function apiKey(): string {
  const key = process.env.MANDRILL_API_KEY?.trim()
  if (!key) {
    throw new MandrillError(
      "MANDRILL_API_KEY is not set. Create a transactional API key at " +
        "https://mandrillapp.com/settings/index and export it before starting the server."
    )
  }
  return key
}

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined
}

function bool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined
}

function field(obj: unknown, key: string): unknown {
  return asObj(obj)[key]
}

/** POST one Mandrill method with the key merged into the body. Returns the raw payload. */
async function post(method: string, body: Record<string, unknown> = {}): Promise<unknown> {
  const payload = { key: apiKey(), ...body }
  let res: Response
  try {
    res = await fetch(`${BASE}${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    throw new MandrillError(`Cannot reach Mandrill at ${BASE}: ${detail}`)
  }

  const raw = await res.text()
  if (raw.trim() === "") {
    if (!res.ok) throw new MandrillError(`Mandrill ${res.status} on ${method} with an empty body`)
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    throw new MandrillError(`Mandrill returned non-JSON (${res.status}) on ${method}: ${raw.slice(0, 200)}`)
  }

  const obj = asObj(parsed)
  const status = str(obj.status)
  if (status === "error" || status === "invalid-key" || status === "payment-required") {
    const message = str(obj.message) ?? str(obj.name) ?? "unknown Mandrill error"
    throw new MandrillError(`Mandrill ${status}: ${message}`)
  }
  if (!res.ok) {
    throw new MandrillError(`Mandrill ${res.status} on ${method}: ${str(obj.message) ?? raw.slice(0, 200)}`)
  }
  return parsed
}

/** Pull a list out of the payload whether it is a bare array or wrapped. */
function payloadList(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload
  const obj = asObj(payload)
  for (const key of keys) {
    const candidate = obj[key]
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

// ---------------------------------------------------------------- messages

export interface SendResult {
  email: string
  status: string
  rejectReason?: string
  id?: string
}

function parseSendResult(v: unknown): SendResult {
  return {
    email: str(field(v, "email")) ?? "(unknown)",
    status: str(field(v, "status")) ?? "unknown",
    rejectReason: str(field(v, "reject_reason")),
    id: str(field(v, "_id")),
  }
}

export interface MessageInfo {
  id: string
  email?: string
  subject?: string
  sender?: string
  template?: string
  state?: string
  ts?: number
  opens: number
  clicks: number
}

function parseMessageInfo(v: unknown): MessageInfo {
  return {
    id: str(field(v, "_id")) ?? str(field(v, "id")) ?? "(unknown)",
    email: str(field(v, "email")),
    subject: str(field(v, "subject")),
    sender: str(field(v, "sender")),
    template: str(field(v, "template")),
    state: str(field(v, "state")),
    ts: num(field(v, "ts")),
    opens: num(field(v, "opens")) ?? asArr(field(v, "opens_detail")).length,
    clicks: num(field(v, "clicks")) ?? asArr(field(v, "clicks_detail")).length,
  }
}

export async function sendEmail(message: Record<string, unknown>): Promise<SendResult[]> {
  return payloadList(await post("/messages/send.json", { message }), ["messages"]).map(parseSendResult)
}

export async function sendTemplateEmail(
  templateName: string,
  templateContent: Record<string, unknown>[],
  message: Record<string, unknown>
): Promise<SendResult[]> {
  return payloadList(
    await post("/messages/send-template.json", {
      template_name: templateName,
      template_content: templateContent,
      message,
    }),
    ["messages"]
  ).map(parseSendResult)
}

export async function sendRawEmail(args: {
  rawMessage: string
  to: string[]
  fromEmail: string
  fromName?: string
  subject?: string
}): Promise<SendResult[]> {
  return payloadList(
    await post("/messages/send-raw.json", {
      raw_message: args.rawMessage,
      to: args.to,
      from_email: args.fromEmail,
      from_name: args.fromName,
      subject: args.subject,
    }),
    ["messages"]
  ).map(parseSendResult)
}

export async function searchMessages(
  query: string,
  options: { limit?: number; dateFrom?: string; dateTo?: string; senders?: string[] } = {}
): Promise<MessageInfo[]> {
  return payloadList(
    await post("/messages/search.json", {
      query,
      limit: options.limit,
      date_from: options.dateFrom,
      date_to: options.dateTo,
      senders: options.senders,
    }),
    ["messages"]
  ).map(parseMessageInfo)
}

export async function getMessageInfo(id: string): Promise<MessageInfo | null> {
  const payload = await post("/messages/info.json", { id })
  const obj = asObj(payload)
  return Object.keys(obj).length === 0 ? null : parseMessageInfo(payload)
}

/** Mandrill returns the stored HTML as a bare JSON string. */
export async function getMessageContent(id: string): Promise<string> {
  const payload = await post("/messages/content.json", { id })
  if (typeof payload === "string") return payload
  throw new MandrillError("Mandrill returned no message content for that id")
}

export async function listScheduledMessages(to?: string): Promise<MessageInfo[]> {
  return payloadList(await post("/messages/list-scheduled.json", { to }), ["messages"]).map(parseMessageInfo)
}

export async function cancelScheduledMessage(id: string): Promise<string> {
  const payload = await post("/messages/cancel-scheduled.json", { id })
  return str(payload) ?? `Cancelled ${id}.`
}

export async function rescheduleMessage(id: string, sendAt: string): Promise<string> {
  const payload = await post("/messages/reschedule.json", { id, send_at: sendAt })
  return str(payload) ?? `Rescheduled ${id} for ${sendAt}.`
}

export async function parseEmail(rawMessage: string): Promise<Record<string, unknown>> {
  return asObj(await post("/messages/parse.json", { raw_message: rawMessage }))
}

// --------------------------------------------------------------- templates

export interface Template {
  slug: string
  name?: string
  subject?: string
  publishName?: string
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

function parseTemplate(v: unknown): Template {
  return {
    slug: str(field(v, "slug")) ?? str(field(v, "name")) ?? "(unknown)",
    name: str(field(v, "name")),
    subject: str(field(v, "subject")),
    publishName: str(field(v, "publish_name")),
    publishedAt: str(field(v, "published_at")),
    createdAt: str(field(v, "created_at")),
    updatedAt: str(field(v, "updated_at")),
  }
}

export async function addTemplate(args: {
  name: string
  code: string
  fromEmail?: string
  fromName?: string
  subject?: string
  text?: string
}): Promise<Template> {
  return parseTemplate(
    await post("/templates/add.json", {
      name: args.name,
      code: args.code,
      from_email: args.fromEmail,
      from_name: args.fromName,
      subject: args.subject,
      text: args.text,
    })
  )
}

export async function listTemplates(): Promise<Template[]> {
  return payloadList(await post("/templates/list.json", {}), ["templates"]).map(parseTemplate)
}

export async function getTemplate(name: string): Promise<Template | null> {
  const payload = await post("/templates/info.json", { name })
  return Object.keys(asObj(payload)).length === 0 ? null : parseTemplate(payload)
}

export async function updateTemplate(
  name: string,
  fields: { code?: string; fromEmail?: string; fromName?: string; subject?: string; text?: string }
): Promise<Template> {
  return parseTemplate(
    await post("/templates/update.json", {
      name,
      code: fields.code,
      from_email: fields.fromEmail,
      from_name: fields.fromName,
      subject: fields.subject,
      text: fields.text,
    })
  )
}

export async function deleteTemplate(name: string): Promise<string> {
  await post("/templates/delete.json", { name })
  return `Deleted template ${name}.`
}

export async function renderTemplate(
  templateName: string,
  templateContent: Record<string, unknown>[],
  mergeVars: Record<string, unknown>[] = []
): Promise<string> {
  const payload = await post("/templates/render.json", {
    template_name: templateName,
    template_content: templateContent,
    merge_vars: mergeVars,
  })
  return str(field(payload, "html")) ?? JSON.stringify(payload).slice(0, 2000)
}

export async function publishTemplate(name: string, code?: string): Promise<Template> {
  return parseTemplate(await post("/templates/publish.json", { name, code }))
}

// ------------------------------------------------------------------- users

export async function ping(): Promise<string> {
  const payload = await post("/users/ping.json", {})
  const pong = str(field(payload, "PING")) ?? str(field(payload, "ping"))
  return pong === "PONG!" ? "PONG!" : JSON.stringify(payload).slice(0, 200)
}

export interface UserInfo {
  username?: string
  email?: string
  reputation?: number
  hourlyQuota?: number
  backlog?: number
}

export async function getUserInfo(): Promise<UserInfo> {
  const payload = await post("/users/info.json", {})
  return {
    username: str(field(payload, "username")),
    email: str(field(payload, "email")),
    reputation: num(field(payload, "reputation")),
    hourlyQuota: num(field(payload, "hourly_quota")),
    backlog: num(field(payload, "backlog")),
  }
}

export async function listSenders(): Promise<Record<string, unknown>[]> {
  return payloadList(await post("/users/senders.json", {}), ["senders"]).map(asObj)
}

// -------------------------------------------------------------------- tags

export interface Tag {
  tag: string
  sent?: number
  hardBounces?: number
  softBounces?: number
  rejects?: number
  opens?: number
  clicks?: number
  uniqueOpens?: number
  uniqueClicks?: number
}

function parseTag(v: unknown): Tag {
  return {
    tag: str(field(v, "tag")) ?? "(unknown)",
    sent: num(field(v, "sent")),
    hardBounces: num(field(v, "hard_bounces")),
    softBounces: num(field(v, "soft_bounces")),
    rejects: num(field(v, "rejects")),
    opens: num(field(v, "opens")),
    clicks: num(field(v, "clicks")),
    uniqueOpens: num(field(v, "unique_opens")),
    uniqueClicks: num(field(v, "unique_clicks")),
  }
}

export async function listTags(): Promise<Tag[]> {
  return payloadList(await post("/tags/list.json", {}), ["tags"]).map(parseTag)
}

export async function deleteTag(tag: string): Promise<string> {
  await post("/tags/delete.json", { tag })
  return `Deleted tag ${tag}.`
}

// ----------------------------------------------------------------- rejects

export interface Reject {
  email: string
  reason?: string
  detail?: string
  createdAt?: string
  expired?: boolean
}

function parseReject(v: unknown): Reject {
  return {
    email: str(field(v, "email")) ?? "(unknown)",
    reason: str(field(v, "reason")),
    detail: str(field(v, "detail")),
    createdAt: str(field(v, "created_at")),
    expired: bool(field(v, "expired")),
  }
}

export async function listRejects(includeExpired = false): Promise<Reject[]> {
  return payloadList(await post("/rejects/list.json", { include_expired: includeExpired }), ["rejects"]).map(
    parseReject
  )
}

export async function deleteReject(email: string): Promise<string> {
  await post("/rejects/delete.json", { email })
  return `Removed ${email} from the rejection list.`
}

// ---------------------------------------------------------------- webhooks

export interface Webhook {
  id: number
  url: string
  description?: string
  createdAt?: string
  lastSentAt?: string
  batchesSent?: number
  batchesFailed?: number
}

function parseWebhook(v: unknown): Webhook {
  return {
    id: num(field(v, "id")) ?? 0,
    url: str(field(v, "url")) ?? "(unknown)",
    description: str(field(v, "description")),
    createdAt: str(field(v, "created_at")),
    lastSentAt: str(field(v, "last_sent_at")),
    batchesSent: num(field(v, "batches_sent")),
    batchesFailed: num(field(v, "batches_failed")),
  }
}

export async function listWebhooks(): Promise<Webhook[]> {
  return payloadList(await post("/webhooks/list.json", {}), ["webhooks"]).map(parseWebhook)
}

export async function addWebhook(url: string, description?: string, events: string[] = []): Promise<Webhook> {
  return parseWebhook(await post("/webhooks/add.json", { url, description, events }))
}

export async function deleteWebhook(id: number): Promise<string> {
  await post("/webhooks/delete.json", { id })
  return `Deleted webhook ${id}.`
}

// ----------------------------------------------------------------- inbound

export interface InboundDomain {
  domain: string
  created_at?: string
  valid_mx?: boolean
}

export async function listInboundDomains(): Promise<InboundDomain[]> {
  return payloadList(await post("/inbound/domains.json", {}), ["domains"]).map((v) => ({
    domain: str(field(v, "domain")) ?? "(unknown)",
    created_at: str(field(v, "created_at")),
    valid_mx: bool(field(v, "valid_mx")),
  }))
}

export async function listInboundRoutes(domain?: string): Promise<Record<string, unknown>[]> {
  return payloadList(await post("/inbound/routes.json", { domain }), ["routes"]).map(asObj)
}

export async function addInboundDomain(domain: string): Promise<InboundDomain> {
  const payload = await post("/inbound/add-domain.json", { domain })
  return {
    domain: str(field(payload, "domain")) ?? domain,
    created_at: str(field(payload, "created_at")),
    valid_mx: bool(field(payload, "valid_mx")),
  }
}

// ------------------------------------------------------------- subaccounts

export interface Subaccount {
  id: string
  name?: string
  reputation?: number
  status?: string
  createdAt?: string
}

function parseSubaccount(v: unknown): Subaccount {
  return {
    id: str(field(v, "id")) ?? "(unknown)",
    name: str(field(v, "name")),
    reputation: num(field(v, "reputation")),
    status: str(field(v, "status")),
    createdAt: str(field(v, "created_at")),
  }
}

export async function listSubaccounts(): Promise<Subaccount[]> {
  return payloadList(await post("/subaccounts/list.json", {}), ["subaccounts"]).map(parseSubaccount)
}

export async function addSubaccount(id: string, name?: string, notes?: string): Promise<Subaccount> {
  return parseSubaccount(await post("/subaccounts/add.json", { id, name, notes }))
}

// -------------------------------------------------------------- reporting

export async function listUrls(): Promise<Record<string, unknown>[]> {
  return payloadList(await post("/urls/list.json", {}), ["urls"]).map(asObj)
}

export async function listExports(): Promise<Record<string, unknown>[]> {
  return payloadList(await post("/exports/list.json", {}), ["exports"]).map(asObj)
}

export async function listMetadata(): Promise<Record<string, unknown>[]> {
  return payloadList(await post("/metadata/list.json", {}), ["metadata"]).map(asObj)
}

export async function listAllowlist(): Promise<Record<string, unknown>[]> {
  return payloadList(await post("/allowlists/list.json", {}), ["allowlists"]).map(asObj)
}

// ------------------------------------------------------------- formatters

export function formatSendResults(results: SendResult[]): string {
  if (results.length === 0) return "Mandrill accepted the request but returned no per-recipient results."
  return results
    .map((r, i) => {
      const lines = [`${i + 1}. ${r.email} — ${r.status}`]
      if (r.rejectReason) lines.push(`   reason: ${r.rejectReason}`)
      if (r.id) lines.push(`   id: ${r.id}`)
      return lines.join("\n")
    })
    .join("\n")
}

export function formatMessage(m: MessageInfo, index?: number): string {
  const parts = [`${index !== undefined ? `${index + 1}. ` : ""}${m.subject ?? "(no subject)"} → ${m.email ?? "?"}`]
  parts.push(`id: ${m.id} | state: ${m.state ?? "?"} | template: ${m.template ?? "none"}`)
  parts.push(`opens: ${m.opens} | clicks: ${m.clicks}`)
  if (m.ts) parts.push(`sent: ${new Date(m.ts * 1000).toISOString()}`)
  return parts.join("\n")
}

export function formatTemplate(t: Template, index?: number): string {
  const parts = [`${index !== undefined ? `${index + 1}. ` : ""}${t.slug}`]
  const meta = [t.subject ? `subject: ${t.subject}` : null, t.publishedAt ? `published: ${t.publishedAt}` : null]
    .filter(Boolean)
    .join(" | ")
  if (meta) parts.push(meta)
  return parts.join("\n")
}

export function formatTag(t: Tag, index?: number): string {
  return (
    `${index !== undefined ? `${index + 1}. ` : ""}${t.tag} — sent ${t.sent ?? 0}, ` +
    `opens ${t.opens ?? 0}, clicks ${t.clicks ?? 0}, bounces ${(t.hardBounces ?? 0) + (t.softBounces ?? 0)}`
  )
}

export function formatReject(r: Reject, index?: number): string {
  const parts = [`${index !== undefined ? `${index + 1}. ` : ""}${r.email} — ${r.reason ?? "unknown reason"}`]
  if (r.detail) parts.push(`   ${r.detail}`)
  if (r.createdAt) parts.push(`   since ${r.createdAt}`)
  return parts.join("\n")
}

export function formatWebhook(w: Webhook, index?: number): string {
  const parts = [`${index !== undefined ? `${index + 1}. ` : ""}#${w.id} ${w.url}`]
  if (w.description) parts.push(`   ${w.description}`)
  parts.push(`   sent ${w.batchesSent ?? 0} | failed ${w.batchesFailed ?? 0}`)
  return parts.join("\n")
}

export function formatSubaccount(s: Subaccount, index?: number): string {
  return (
    `${index !== undefined ? `${index + 1}. ` : ""}${s.id}` +
    `${s.name ? ` (${s.name})` : ""} — reputation ${s.reputation ?? 0}, status ${s.status ?? "?"}`
  )
}

/** Compact rendering for endpoints whose payload shape Mandrill does not pin down. */
export function formatRows(rows: Record<string, unknown>[], emptyMessage: string): string {
  if (rows.length === 0) return emptyMessage
  return rows
    .map((row, i) => {
      const entries = Object.entries(row)
        .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
        .slice(0, 8)
        .map(([k, v]) => `${k}: ${String(v)}`)
      return `${i + 1}. ${entries.length > 0 ? entries.join(" | ") : JSON.stringify(row).slice(0, 160)}`
    })
    .join("\n")
}
