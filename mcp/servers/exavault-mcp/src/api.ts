const DEFAULT_BASE = "https://account.exavault.com/api/v2"
const USER_AGENT = "mrfentmen-exavault-mcp/1.0"

export class ExaVaultError extends Error {}

type ParamValue = string | number | boolean | string[] | undefined
type Params = Record<string, ParamValue>

function asObj(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asArr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function str(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return undefined
}

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

/** ExaVault nests payloads under different keys per endpoint, so probe a few. */
function pickArray(payload: unknown, keys: string[]): unknown[] {
  const obj = asObj(payload)
  for (const key of [...keys, "data", "items", "results"]) {
    const found = obj[key]
    if (Array.isArray(found)) return found
  }
  return asArr(payload)
}

function pickObj(payload: unknown, keys: string[]): Record<string, unknown> {
  const obj = asObj(payload)
  for (const key of [...keys, "data"]) {
    const found = obj[key]
    const inner = asObj(found)
    if (Object.keys(inner).length > 0) return inner
  }
  return obj
}

function baseUrl(): string {
  const raw = (process.env.EXAVAULT_BASE_URL ?? DEFAULT_BASE).trim()
  const base = raw.replace(/\/+$/, "")
  if (!base) throw new ExaVaultError("EXAVAULT_BASE_URL is set but empty")
  return base
}

function credentials(): { accessToken: string; apiKey: string } {
  const accessToken = (process.env.EXAVAULT_ACCESS_TOKEN ?? "").trim()
  const apiKey = (process.env.EXAVAULT_API_KEY ?? "").trim()
  const missing: string[] = []
  if (!accessToken) missing.push("EXAVAULT_ACCESS_TOKEN")
  if (!apiKey) missing.push("EXAVAULT_API_KEY")
  if (missing.length > 0) {
    throw new ExaVaultError(
      `Missing ${missing.join(" and ")}. ExaVault authenticates every call with both an access token and an API key, ` +
        `which you create under Account > API in the ExaVault web interface.`,
    )
  }
  return { accessToken, apiKey }
}

function buildUrl(path: string, params: Params): string {
  const suffix = path.startsWith("/") ? path : `/${path}`
  let url: URL
  try {
    url = new URL(`${baseUrl()}${suffix}`)
  } catch {
    throw new ExaVaultError(
      `EXAVAULT_BASE_URL must be an absolute URL such as https://account.exavault.com/api/v2, got "${baseUrl()}"`,
    )
  }
  const { accessToken, apiKey } = credentials()
  url.searchParams.set("access_token", accessToken)
  url.searchParams.set("api_key", apiKey)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value))
  }
  return url.toString()
}

async function request(path: string, params: Params = {}, method = "GET"): Promise<unknown> {
  const url = buildUrl(path, params)
  const res = await fetch(url, {
    method,
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30000),
  })
  const body = await res.text()
  let payload: unknown = null
  if (body) {
    try {
      payload = JSON.parse(body)
    } catch {
      throw new ExaVaultError(
        `ExaVault returned a non-JSON response (HTTP ${res.status}): ${body.slice(0, 200)}`,
      )
    }
  }
  const obj = asObj(payload)
  if (obj.success === false) {
    const error = asObj(obj.error)
    const message = str(error.message) ?? str(obj.message) ?? `ExaVault rejected the request (HTTP ${res.status})`
    const code = str(error.code)
    throw new ExaVaultError(code ? `${message} (${code})` : message)
  }
  if (!res.ok) {
    throw new ExaVaultError(`ExaVault returned HTTP ${res.status} ${res.statusText}`.trim())
  }
  return payload
}

// ---------------------------------------------------------------- models

export interface Account {
  id?: number
  company?: string
  contactName?: string
  email?: string
  phone?: string
  timezone?: string
  plan?: string
  quotaUsed?: number
  quotaTotal?: number
  users?: number
}

export interface ResourceItem {
  id?: number
  name?: string
  path?: string
  type?: string
  size?: number
  createdBy?: string
  uploadedBy?: string
  createdAt?: string
  modifiedAt?: string
  downloadUrl?: string
  previewUrl?: string
}

export interface EmailList {
  id?: number
  name?: string
  address?: string
  createdBy?: string
  createdAt?: string
}

export interface Notification {
  id?: number
  type?: string
  email?: string
  message?: string
  createdAt?: string
}

export interface ActivityRow {
  timestamp?: string
  type?: string
  user?: string
  ipAddress?: string
  path?: string
  message?: string
}

export interface Form {
  id?: number
  name?: string
  path?: string
  submissions?: number
}

function parseAccount(payload: unknown): Account {
  const obj = pickObj(payload, ["account"])
  return {
    id: num(obj.id),
    company: str(obj.company),
    contactName: str(obj.contactName) ?? str(obj.name),
    email: str(obj.email),
    phone: str(obj.phone),
    timezone: str(obj.timezone),
    plan: str(obj.plan),
    quotaUsed: num(obj.quotaUsed) ?? num(obj.usedStorage),
    quotaTotal: num(obj.quotaTotal) ?? num(obj.totalStorage),
    users: num(obj.userCount) ?? num(obj.users),
  }
}

function parseResource(value: unknown): ResourceItem | null {
  const obj = asObj(value)
  const name = str(obj.name)
  const path = str(obj.path)
  if (!name && !path) return null
  return {
    id: num(obj.id),
    name: name ?? path,
    path,
    type: str(obj.type),
    size: num(obj.size),
    createdBy: str(obj.createdBy),
    uploadedBy: str(obj.uploadedBy),
    createdAt: str(obj.createdAt),
    modifiedAt: str(obj.modifiedAt),
    downloadUrl: str(obj.downloadUrl),
    previewUrl: str(obj.previewUrl),
  }
}

function parseEmailList(value: unknown): EmailList | null {
  const obj = asObj(value)
  const address = str(obj.address)
  const name = str(obj.name)
  if (!address && !name) return null
  return {
    id: num(obj.id),
    name,
    address,
    createdBy: str(obj.createdBy),
    createdAt: str(obj.createdAt),
  }
}

function parseNotification(value: unknown): Notification | null {
  const obj = asObj(value)
  const id = num(obj.id)
  const type = str(obj.type)
  if (id === undefined && !type) return null
  return {
    id,
    type,
    email: str(obj.email),
    message: str(obj.message),
    createdAt: str(obj.createdAt),
  }
}

function parseActivity(value: unknown): ActivityRow | null {
  const obj = asObj(value)
  const timestamp = str(obj.timestamp) ?? str(obj.createdAt)
  const type = str(obj.type) ?? str(obj.action)
  if (!timestamp && !type) return null
  return {
    timestamp,
    type,
    user: str(obj.user) ?? str(obj.username),
    ipAddress: str(obj.ipAddress) ?? str(obj.ip),
    path: str(obj.path) ?? str(obj.resource),
    message: str(obj.message),
  }
}

function parseForm(value: unknown): Form | null {
  const obj = asObj(value)
  const id = num(obj.id)
  const name = str(obj.name)
  if (id === undefined && !name) return null
  return { id, name, path: str(obj.path), submissions: num(obj.submissions) }
}

function kept<T>(rows: Array<T | null>): T[] {
  return rows.filter((row): row is T => row !== null)
}

// ---------------------------------------------------------------- account

export async function getAccount(): Promise<Account> {
  return parseAccount(await request("/account"))
}

export async function updateAccount(fields: {
  company?: string
  contactName?: string
  email?: string
  phone?: string
  timezone?: string
}): Promise<Account> {
  if (Object.values(fields).every((value) => value === undefined || value === "")) {
    throw new ExaVaultError("Provide at least one account field to update")
  }
  return parseAccount(await request("/account", { ...fields }, "PATCH"))
}

// -------------------------------------------------------------- resources

export async function listResources(args: {
  path?: string
  sortBy?: string
  sortOrder?: string
  limit?: number
  offset?: number
}): Promise<ResourceItem[]> {
  const payload = await request("/resources/list", {
    path: args.path,
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    limit: args.limit,
    offset: args.offset,
  })
  return kept(pickArray(payload, ["resources", "files", "folders"]).map(parseResource))
}

export async function listFolderContents(args: {
  id: number
  sortBy?: string
  sortOrder?: string
}): Promise<ResourceItem[]> {
  const payload = await request(`/resources/list/${args.id}`, {
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
  })
  return kept(pickArray(payload, ["resources", "files", "folders"]).map(parseResource))
}

export async function getResource(args: { path: string; type?: string }): Promise<ResourceItem> {
  const payload = await request("/resources", { path: args.path, type: args.type })
  const item = parseResource(pickObj(payload, ["resource"]))
  if (!item) throw new ExaVaultError(`ExaVault returned no resource details for "${args.path}"`)
  return item
}

export async function createFolder(args: { path: string; name: string }): Promise<ResourceItem> {
  const payload = await request("/resources", { path: args.path, name: args.name }, "POST")
  const item = parseResource(pickObj(payload, ["resource"]))
  return item ?? { name: args.name, path: `${args.path.replace(/\/+$/, "")}/${args.name}`, type: "folder" }
}

export async function deleteResources(args: { path: string; recursive?: boolean }): Promise<string> {
  const payload = await request("/resources", { path: args.path, recursive: args.recursive }, "DELETE")
  return str(asObj(payload).message) ?? `Deleted ${args.path}`
}

export async function copyResources(args: {
  resources: string[]
  destinationPath: string
}): Promise<string> {
  const payload = await request(
    "/resources/copy",
    { resources: args.resources, destinationPath: args.destinationPath },
    "POST",
  )
  return str(asObj(payload).message) ?? `Copied ${args.resources.length} resource(s) to ${args.destinationPath}`
}

export async function moveResources(args: {
  resources: string[]
  destinationPath: string
}): Promise<string> {
  const payload = await request(
    "/resources/move",
    { resources: args.resources, destinationPath: args.destinationPath },
    "POST",
  )
  return str(asObj(payload).message) ?? `Moved ${args.resources.length} resource(s) to ${args.destinationPath}`
}

export async function compressResources(args: {
  resources: string[]
  destinationPath: string
  name?: string
}): Promise<string> {
  const payload = await request(
    "/resources/compress",
    { resources: args.resources, destinationPath: args.destinationPath, name: args.name },
    "POST",
  )
  return str(asObj(payload).message) ?? `Compressed ${args.resources.length} resource(s) in ${args.destinationPath}`
}

export async function extractResources(args: {
  resources: string[]
  destinationPath: string
}): Promise<string> {
  const payload = await request(
    "/resources/extract",
    { resources: args.resources, destinationPath: args.destinationPath },
    "POST",
  )
  return str(asObj(payload).message) ?? `Extracted ${args.resources.length} archive(s) into ${args.destinationPath}`
}

export async function getDownloadUrl(args: { path: string }): Promise<string> {
  const payload = await request("/resources/download", { path: args.path })
  const obj = pickObj(payload, ["resource", "download"])
  return str(obj.downloadUrl) ?? str(obj.uri) ?? str(asObj(payload).downloadUrl) ?? ""
}

export async function getPreviewUrl(args: { path: string; size?: string }): Promise<string> {
  const payload = await request("/resources/preview", { path: args.path, size: args.size })
  const obj = pickObj(payload, ["resource", "preview"])
  return str(obj.previewUrl) ?? str(obj.uri) ?? str(asObj(payload).previewUrl) ?? ""
}

// ------------------------------------------------------------- email lists

export async function listEmailLists(args: { limit?: number; offset?: number }): Promise<EmailList[]> {
  const payload = await request("/email-lists", { limit: args.limit, offset: args.offset })
  return kept(pickArray(payload, ["emailLists", "lists", "email-lists"]).map(parseEmailList))
}

export async function createEmailList(args: { name: string; address: string }): Promise<EmailList> {
  const payload = await request("/email-lists", { name: args.name, address: args.address }, "POST")
  const item = parseEmailList(pickObj(payload, ["emailList", "list"]))
  return item ?? { name: args.name, address: args.address }
}

export async function getEmailList(args: { id: number }): Promise<EmailList> {
  const payload = await request(`/email-lists/${args.id}`)
  const item = parseEmailList(pickObj(payload, ["emailList", "list"]))
  if (!item) throw new ExaVaultError(`ExaVault returned no email list with id ${args.id}`)
  return { ...item, id: item.id ?? args.id }
}

export async function deleteEmailList(args: { id: number }): Promise<string> {
  const payload = await request(`/email-lists/${args.id}`, {}, "DELETE")
  return str(asObj(payload).message) ?? `Deleted email list ${args.id}`
}

// ---------------------------------------------------------- notifications

export async function listNotifications(args: { limit?: number; offset?: number }): Promise<Notification[]> {
  const payload = await request("/notifications", { limit: args.limit, offset: args.offset })
  return kept(pickArray(payload, ["notifications"]).map(parseNotification))
}

export async function createNotification(args: {
  type: string
  email: string
  message?: string
}): Promise<Notification> {
  const payload = await request(
    "/notifications",
    { type: args.type, email: args.email, message: args.message },
    "POST",
  )
  const item = parseNotification(pickObj(payload, ["notification"]))
  return item ?? { type: args.type, email: args.email, message: args.message }
}

export async function deleteNotification(args: { id: number }): Promise<string> {
  const payload = await request(`/notifications/${args.id}`, {}, "DELETE")
  return str(asObj(payload).message) ?? `Deleted notification ${args.id}`
}

// --------------------------------------------------------------- activity

export async function getSessionActivity(args: {
  startDate?: string
  endDate?: string
  type?: string
  limit?: number
}): Promise<ActivityRow[]> {
  const payload = await request("/activity/session", {
    startDate: args.startDate,
    endDate: args.endDate,
    type: args.type,
    limit: args.limit,
  })
  return kept(pickArray(payload, ["activity", "sessions", "log"]).map(parseActivity))
}

export async function getWebhookActivity(args: { limit?: number }): Promise<ActivityRow[]> {
  const payload = await request("/activity/webhooks", { limit: args.limit })
  return kept(pickArray(payload, ["activity", "webhooks", "log"]).map(parseActivity))
}

// ------------------------------------------------------------------ forms

export async function listForms(): Promise<Form[]> {
  const payload = await request("/forms")
  return kept(pickArray(payload, ["forms"]).map(parseForm))
}

export async function getForm(args: { id: number }): Promise<Form> {
  const payload = await request(`/forms/${args.id}`)
  const item = parseForm(pickObj(payload, ["form"]))
  if (!item) throw new ExaVaultError(`ExaVault returned no receive form with id ${args.id}`)
  return { ...item, id: item.id ?? args.id }
}

// ------------------------------------------------------------- formatters

function bytes(value?: number): string {
  if (value === undefined) return "n/a"
  if (value < 1024) return `${value} B`
  const units = ["KB", "MB", "GB", "TB"]
  let amount = value / 1024
  let unit = 0
  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024
    unit += 1
  }
  return `${amount.toFixed(amount >= 10 ? 0 : 1)} ${units[unit]}`
}

export function formatAccount(account: Account): string {
  return [
    account.company ? `Account: ${account.company}` : "Account details from ExaVault",
    account.contactName ? `Contact: ${account.contactName}` : null,
    account.email ? `Email: ${account.email}` : null,
    account.phone ? `Phone: ${account.phone}` : null,
    account.timezone ? `Timezone: ${account.timezone}` : null,
    account.plan ? `Plan: ${account.plan}` : null,
    account.quotaTotal !== undefined
      ? `Storage: ${bytes(account.quotaUsed)} of ${bytes(account.quotaTotal)} used`
      : null,
    account.users !== undefined ? `Users: ${account.users}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n")
}

export function formatResource(item: ResourceItem, index?: number): string {
  const prefix = index === undefined ? "" : `${index + 1}. `
  const details = [item.type, item.size !== undefined ? bytes(item.size) : null, item.modifiedAt]
    .filter((part): part is string => typeof part === "string" && part !== "")
    .join(" | ")
  return `${prefix}${item.name ?? item.path ?? "unnamed"}${details ? ` (${details})` : ""}${item.path && item.path !== item.name ? `\n   ${item.path}` : ""}`
}

export function formatResourceList(items: ResourceItem[], where: string): string {
  if (items.length === 0) return `No resources in ${where}.`
  const folders = items.filter((item) => item.type === "folder").length
  return [
    `${items.length} resource(s) in ${where}: ${folders} folder(s), ${items.length - folders} file(s)`,
    ...items.map((item, index) => formatResource(item, index)),
  ].join("\n")
}

export function formatEmailList(list: EmailList): string {
  return [
    list.name ?? `Email list ${list.id ?? ""}`.trim(),
    list.address ? `Address: ${list.address}` : null,
    list.id !== undefined ? `Id: ${list.id}` : null,
    list.createdBy ? `Created by: ${list.createdBy}` : null,
    list.createdAt ? `Created: ${list.createdAt}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n")
}

export function formatEmailLists(lists: EmailList[]): string {
  if (lists.length === 0) return "No email lists on this ExaVault account."
  return [
    `${lists.length} email list(s):`,
    ...lists.map((list, index) => `${index + 1}. ${list.name ?? "unnamed"} — ${list.address ?? "no address"}${list.id !== undefined ? ` (id ${list.id})` : ""}`),
  ].join("\n")
}

export function formatNotification(item: Notification): string {
  return [
    `${item.type ?? "notification"}${item.id !== undefined ? ` (id ${item.id})` : ""}`,
    item.email ? `To: ${item.email}` : null,
    item.message ? `Message: ${item.message}` : null,
    item.createdAt ? `Created: ${item.createdAt}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n")
}

export function formatNotifications(items: Notification[]): string {
  if (items.length === 0) return "No notifications configured on this account."
  return [
    `${items.length} notification(s):`,
    ...items.map((item, index) => `${index + 1}. ${formatNotification(item).replace(/\n/g, " | ")}`),
  ].join("\n")
}

export function formatActivity(rows: ActivityRow[], label: string): string {
  if (rows.length === 0) return `No ${label} activity in that window.`
  return [
    `${rows.length} ${label} activity row(s):`,
    ...rows.map((row, index) => {
      const parts = [row.timestamp, row.type, row.user, row.ipAddress, row.path, row.message]
        .filter((part): part is string => typeof part === "string" && part !== "")
        .join(" | ")
      return `${index + 1}. ${parts}`
    }),
  ].join("\n")
}

export function formatForm(form: Form): string {
  return [
    `Receive form: ${form.name ?? "unnamed"}${form.id !== undefined ? ` (id ${form.id})` : ""}`,
    form.path ? `Path: ${form.path}` : null,
    form.submissions !== undefined ? `Submissions: ${form.submissions}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n")
}

export function formatForms(forms: Form[]): string {
  if (forms.length === 0) return "No receive forms on this account."
  return [
    `${forms.length} receive form(s):`,
    ...forms.map((form, index) => `${index + 1}. ${form.name ?? "unnamed"}${form.id !== undefined ? ` (id ${form.id})` : ""}${form.path ? ` — ${form.path}` : ""}`),
  ].join("\n")
}
