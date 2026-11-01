const BASE = "https://api.svix.com"

export class SvixError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SvixError"
  }
}

function apiToken(): string {
  const token = process.env.SVIX_API_TOKEN
  if (!token) {
    throw new SvixError(
      "SVIX_API_TOKEN is not set. Create an API token at https://dashboard.svix.com/api-access and export it as SVIX_API_TOKEN.",
    )
  }
  return token
}

type Query = Record<string, string | number | boolean | undefined>

function asObj(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asArr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return fallback
}

function optStr(value: unknown): string | undefined {
  const s = str(value)
  return s === "" ? undefined : s
}

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value)
  return undefined
}

function bool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

function strArr(value: unknown): string[] {
  return asArr(value).filter((v): v is string => typeof v === "string")
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function encode(value: string): string {
  return encodeURIComponent(value)
}

async function request(
  method: string,
  path: string,
  options: { body?: unknown; query?: Query } = {},
): Promise<unknown> {
  const url = new URL(BASE + path)
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiToken()}`,
    Accept: "application/json",
  }
  if (options.body !== undefined) headers["Content-Type"] = "application/json"

  const response = await fetch(url, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(25000),
  })

  const bodyText = await response.text()

  if (!response.ok) {
    const parsed = safeJson(bodyText)
    const errorBody = asObj(parsed)
    const detail = optStr(errorBody.detail) ?? optStr(errorBody.error) ?? optStr(errorBody.message) ?? bodyText
    const code = optStr(errorBody.code)
    const suffix = code ? ` (${code})` : ""
    throw new SvixError(`Svix API ${response.status}${suffix}: ${detail.slice(0, 400)}`)
  }

  if (bodyText.trim() === "") return {}

  const parsed = safeJson(bodyText)
  if (parsed === undefined) throw new SvixError("Svix API returned a body that is not JSON")
  return parsed
}

/* ---------- models ---------- */

export interface Application {
  id: string
  name: string
  uid?: string
  rateLimit?: number
  createdAt: string
  updatedAt: string
}

export interface Endpoint {
  id: string
  url: string
  description?: string
  uid?: string
  rateLimit?: number
  disabled?: boolean
  filterTypes: string[]
  channels: string[]
  createdAt: string
  updatedAt: string
}

export interface EndpointSecret {
  key: string
  keyId?: string
}

export interface Message {
  id: string
  eventType: string
  eventId?: string
  channels: string[]
  payload: unknown
  timestamp: string
}

export interface Attempt {
  id: string
  msgId: string
  endpointId: string
  url?: string
  responseStatusCode?: number
  response: string
  responseDurationMs?: number
  status: string
  timestamp: string
}

export interface EndpointStats {
  success: number
  pending: number
  fail: number
}

export interface Integration {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Paged<T> {
  items: T[]
  iterator: string | null
  done: boolean
}

function parseApplication(value: unknown): Application {
  const o = asObj(value)
  return {
    id: str(o.id),
    name: str(o.name),
    uid: optStr(o.uid),
    rateLimit: num(o.rateLimit),
    createdAt: str(o.createdAt),
    updatedAt: str(o.updatedAt),
  }
}

function parseEndpoint(value: unknown): Endpoint {
  const o = asObj(value)
  return {
    id: str(o.id),
    url: str(o.url),
    description: optStr(o.description),
    uid: optStr(o.uid),
    rateLimit: num(o.rateLimit),
    disabled: bool(o.disabled),
    filterTypes: strArr(o.filterTypes),
    channels: strArr(o.channels),
    createdAt: str(o.createdAt),
    updatedAt: str(o.updatedAt),
  }
}

function parseEndpointSecret(value: unknown): EndpointSecret {
  const o = asObj(value)
  return { key: str(o.key), keyId: optStr(o.keyId) }
}

function parseMessage(value: unknown): Message {
  const o = asObj(value)
  return {
    id: str(o.id),
    eventType: str(o.eventType),
    eventId: optStr(o.eventId),
    channels: strArr(o.channels),
    payload: o.payload,
    timestamp: str(o.timestamp),
  }
}

function parseAttempt(value: unknown): Attempt {
  const o = asObj(value)
  return {
    id: str(o.id),
    msgId: str(o.msgId),
    endpointId: str(o.endpointId),
    url: optStr(o.url),
    responseStatusCode: num(o.responseStatusCode),
    response: str(o.response),
    responseDurationMs: num(o.responseDurationMs),
    status: str(o.status),
    timestamp: str(o.timestamp),
  }
}

function parseStats(value: unknown): EndpointStats {
  const o = asObj(value)
  return { success: num(o.success) ?? 0, pending: num(o.pending) ?? 0, fail: num(o.fail) ?? 0 }
}

function parseIntegration(value: unknown): Integration {
  const o = asObj(value)
  return { id: str(o.id), name: str(o.name), createdAt: str(o.createdAt), updatedAt: str(o.updatedAt) }
}

function parsePaged<T>(value: unknown, parse: (item: unknown) => T): Paged<T> {
  const o = asObj(value)
  const rows = Array.isArray(o.data) ? o.data : asArr(value)
  return {
    items: rows.map(parse),
    iterator: typeof o.iterator === "string" ? o.iterator : null,
    done: o.done === true,
  }
}

/* ---------- applications ---------- */

export async function listApplications(limit?: number, iterator?: string): Promise<Paged<Application>> {
  const raw = await request("GET", "/api/v1/app/", { query: { limit, iterator } })
  return parsePaged(raw, parseApplication)
}

export async function createApplication(body: Record<string, unknown>): Promise<Application> {
  return parseApplication(await request("POST", "/api/v1/app/", { body }))
}

export async function getApplication(appId: string): Promise<Application> {
  return parseApplication(await request("GET", `/api/v1/app/${encode(appId)}/`))
}

export async function updateApplication(appId: string, body: Record<string, unknown>): Promise<Application> {
  return parseApplication(await request("PUT", `/api/v1/app/${encode(appId)}/`, { body }))
}

export async function deleteApplication(appId: string): Promise<void> {
  await request("DELETE", `/api/v1/app/${encode(appId)}/`)
}

/* ---------- endpoints ---------- */

export async function listEndpoints(
  appId: string,
  limit?: number,
  iterator?: string,
): Promise<Paged<Endpoint>> {
  const raw = await request("GET", `/api/v1/app/${encode(appId)}/endpoint/`, { query: { limit, iterator } })
  return parsePaged(raw, parseEndpoint)
}

export async function createEndpoint(appId: string, body: Record<string, unknown>): Promise<Endpoint> {
  return parseEndpoint(await request("POST", `/api/v1/app/${encode(appId)}/endpoint/`, { body }))
}

export async function getEndpoint(appId: string, endpointId: string): Promise<Endpoint> {
  return parseEndpoint(
    await request("GET", `/api/v1/app/${encode(appId)}/endpoint/${encode(endpointId)}/`),
  )
}

export async function updateEndpoint(
  appId: string,
  endpointId: string,
  body: Record<string, unknown>,
): Promise<Endpoint> {
  return parseEndpoint(
    await request("PUT", `/api/v1/app/${encode(appId)}/endpoint/${encode(endpointId)}/`, { body }),
  )
}

export async function deleteEndpoint(appId: string, endpointId: string): Promise<void> {
  await request("DELETE", `/api/v1/app/${encode(appId)}/endpoint/${encode(endpointId)}/`)
}

export async function getEndpointSecret(appId: string, endpointId: string): Promise<EndpointSecret> {
  return parseEndpointSecret(
    await request("GET", `/api/v1/app/${encode(appId)}/endpoint/${encode(endpointId)}/secret/`),
  )
}

export async function rotateEndpointSecret(
  appId: string,
  endpointId: string,
  body: Record<string, unknown> = {},
): Promise<EndpointSecret> {
  return parseEndpointSecret(
    await request("POST", `/api/v1/app/${encode(appId)}/endpoint/${encode(endpointId)}/secret/rotate/`, {
      body,
    }),
  )
}

export async function getEndpointStats(
  appId: string,
  endpointId: string,
  since?: string,
  until?: string,
): Promise<EndpointStats> {
  return parseStats(
    await request("GET", `/api/v1/app/${encode(appId)}/endpoint/${encode(endpointId)}/stats/`, {
      query: { since, until },
    }),
  )
}

/* ---------- messages ---------- */

export async function listMessages(
  appId: string,
  limit?: number,
  iterator?: string,
): Promise<Paged<Message>> {
  const raw = await request("GET", `/api/v1/app/${encode(appId)}/msg/`, { query: { limit, iterator } })
  return parsePaged(raw, parseMessage)
}

export async function createMessage(appId: string, body: Record<string, unknown>): Promise<Message> {
  return parseMessage(await request("POST", `/api/v1/app/${encode(appId)}/msg/`, { body }))
}

export async function getMessage(appId: string, msgId: string): Promise<Message> {
  return parseMessage(await request("GET", `/api/v1/app/${encode(appId)}/msg/${encode(msgId)}/`))
}

/* ---------- attempts ---------- */

export async function listMessageAttempts(
  appId: string,
  msgId: string,
  limit?: number,
  iterator?: string,
): Promise<Paged<Attempt>> {
  const raw = await request("GET", `/api/v1/app/${encode(appId)}/msg/${encode(msgId)}/attempt/`, {
    query: { limit, iterator },
  })
  return parsePaged(raw, parseAttempt)
}

export async function getAttempt(appId: string, msgId: string, attemptId: string): Promise<Attempt> {
  return parseAttempt(
    await request(
      "GET",
      `/api/v1/app/${encode(appId)}/msg/${encode(msgId)}/attempt/${encode(attemptId)}/`,
    ),
  )
}

export async function listEndpointAttempts(
  appId: string,
  endpointId: string,
  limit?: number,
  iterator?: string,
): Promise<Paged<Attempt>> {
  const raw = await request("GET", `/api/v1/app/${encode(appId)}/attempt/endpoint/${encode(endpointId)}/`, {
    query: { limit, iterator },
  })
  return parsePaged(raw, parseAttempt)
}

/* ---------- integrations ---------- */

export async function listIntegrations(
  appId: string,
  limit?: number,
  iterator?: string,
): Promise<Paged<Integration>> {
  const raw = await request("GET", `/api/v1/app/${encode(appId)}/integration/`, {
    query: { limit, iterator },
  })
  return parsePaged(raw, parseIntegration)
}

export async function createIntegration(
  appId: string,
  body: Record<string, unknown>,
): Promise<Integration> {
  return parseIntegration(await request("POST", `/api/v1/app/${encode(appId)}/integration/`, { body }))
}

export async function getIntegration(appId: string, integId: string): Promise<Integration> {
  return parseIntegration(
    await request("GET", `/api/v1/app/${encode(appId)}/integration/${encode(integId)}/`),
  )
}

export async function updateIntegration(
  appId: string,
  integId: string,
  body: Record<string, unknown>,
): Promise<Integration> {
  return parseIntegration(
    await request("PUT", `/api/v1/app/${encode(appId)}/integration/${encode(integId)}/`, { body }),
  )
}

export async function deleteIntegration(appId: string, integId: string): Promise<void> {
  await request("DELETE", `/api/v1/app/${encode(appId)}/integration/${encode(integId)}/`)
}

export async function getIntegrationKey(appId: string, integId: string): Promise<EndpointSecret> {
  return parseEndpointSecret(
    await request("GET", `/api/v1/app/${encode(appId)}/integration/${encode(integId)}/key/`),
  )
}

export async function rotateIntegrationKey(appId: string, integId: string): Promise<EndpointSecret> {
  return parseEndpointSecret(
    await request("POST", `/api/v1/app/${encode(appId)}/integration/${encode(integId)}/key/rotate/`, {
      body: {},
    }),
  )
}

/* ---------- formatters ---------- */

export function formatApplication(item: Application, index?: number): string {
  const head = index === undefined ? item.name : `${index + 1}. ${item.name}`
  const parts = [`id: ${item.id}`]
  if (item.uid) parts.push(`uid: ${item.uid}`)
  if (item.rateLimit !== undefined) parts.push(`rate limit: ${item.rateLimit}/s`)
  return `${head} — ${parts.join(" · ")}`
}

export function formatEndpoint(item: Endpoint, index?: number): string {
  const head = index === undefined ? item.url : `${index + 1}. ${item.url}`
  const parts = [`id: ${item.id}`]
  if (item.description) parts.push(item.description)
  if (item.disabled) parts.push("DISABLED")
  if (item.filterTypes.length > 0) parts.push(`events: ${item.filterTypes.join(", ")}`)
  if (item.channels.length > 0) parts.push(`channels: ${item.channels.join(", ")}`)
  if (item.rateLimit !== undefined) parts.push(`rate limit: ${item.rateLimit}/s`)
  return `${head} — ${parts.join(" · ")}`
}

export function formatSecret(item: EndpointSecret): string {
  const idPart = item.keyId ? ` (key id ${item.keyId})` : ""
  return `signing secret${idPart}: ${item.key}`
}

export function formatMessage(item: Message, index?: number): string {
  const head = index === undefined ? item.eventType : `${index + 1}. ${item.eventType}`
  const parts = [`id: ${item.id}`]
  if (item.eventId) parts.push(`event id: ${item.eventId}`)
  if (item.channels.length > 0) parts.push(`channels: ${item.channels.join(", ")}`)
  parts.push(`sent: ${item.timestamp}`)
  return `${head} — ${parts.join(" · ")}`
}

export function formatAttempt(item: Attempt, index?: number): string {
  const head = index === undefined ? item.id : `${index + 1}. ${item.id}`
  const parts = [`status: ${item.status}`]
  if (item.responseStatusCode !== undefined) parts.push(`HTTP ${item.responseStatusCode}`)
  if (item.url) parts.push(item.url)
  if (item.responseDurationMs !== undefined) parts.push(`${item.responseDurationMs} ms`)
  parts.push(`at ${item.timestamp}`)
  return `${head} — ${parts.join(" · ")}`
}

export function formatStats(item: EndpointStats): string {
  const total = item.success + item.pending + item.fail
  return `attempts: ${total} total · ${item.success} success · ${item.pending} pending · ${item.fail} fail`
}

export function formatIntegration(item: Integration, index?: number): string {
  const head = index === undefined ? item.name : `${index + 1}. ${item.name}`
  return `${head} — id: ${item.id} · created ${item.createdAt}`
}

export function formatPage<T>(
  page: Paged<T>,
  format: (item: T, index: number) => string,
  what: string,
): string {
  if (page.items.length === 0) return `No ${what} found.`
  const lines = page.items.map((item, index) => format(item, index))
  const more = page.iterator
    ? `More available — pass iterator: ${page.iterator}`
    : page.done
      ? "End of list."
      : "No iterator returned."
  return `${page.items.length} ${what}:\n${lines.join("\n")}\n${more}`
}
