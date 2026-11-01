/**
 * Clever Cloud client.
 *
 * Only the paths below are used; each one comes from Clever Cloud's published
 * OpenAPI spec (api.clever-cloud.com/v2). Auth is HTTP Basic with the account
 * email and an API token.
 */
const BASE = "https://api.clever-cloud.com/v2"

export class CleverError extends Error {}

function authHeader(): string {
  const email = process.env.CLOUDCLEVER_EMAIL
  const token = process.env.CLOUDCLEVER_TOKEN
  if (!email || !token) {
    throw new CleverError(
      "Missing credentials: set CLOUDCLEVER_EMAIL and CLOUDCLEVER_TOKEN"
    )
  }
  return `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      authorization: authHeader(),
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "clever-cloud-mcp/1.0",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) {
    let detail = ""
    try {
      const body = (await res.json()) as { message?: string; error?: string }
      detail = body.message ?? body.error ?? ""
    } catch {
      detail = ""
    }
    throw new CleverError(
      `Clever Cloud error ${res.status} for ${path}${detail ? `: ${detail}` : ""}`
    )
  }
  if (res.status === 204) return {} as T
  return (await res.json()) as T
}

/** Logs are returned as plain text, not JSON. */
async function requestText(path: string, init: RequestInit = {}): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      authorization: authHeader(),
      accept: "text/plain",
      "user-agent": "clever-cloud-mcp/1.0",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new CleverError(`Clever Cloud error ${res.status} for ${path}`)
  return res.text()
}

// ---------------------------------------------------------------- types

export interface Organisation {
  id?: string
  name?: string
  description?: string
  avatar?: string
}

export interface AddonProvider {
  id?: string
  name?: string
  shortDesc?: string
  providerId?: string
}

export interface AddonPlan {
  id?: string
  name?: string
  slug?: string
  price?: number
}

export interface EnvVar {
  name: string
  value: string
}

export interface Drain {
  id?: string
  url?: string
  type?: string
}

// ---------------------------------------------------------------- organisations

export async function listOrganisations(): Promise<Organisation[]> {
  const data = await request<Organisation[]>("/organisations")
  return Array.isArray(data) ? data : []
}

export async function getOrganisation(id: string): Promise<Organisation> {
  return request<Organisation>(`/organisations/${encodeURIComponent(id)}`)
}

export async function createOrganisation(input: {
  name: string
  description?: string
}): Promise<Organisation> {
  return request<Organisation>("/organisations", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateOrganisation(
  id: string,
  patch: { name?: string; description?: string }
): Promise<Organisation> {
  return request<Organisation>(`/organisations/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  })
}

export async function deleteOrganisation(id: string): Promise<void> {
  await request<unknown>(`/organisations/${encodeURIComponent(id)}`, { method: "DELETE" })
}

// ---------------------------------------------------------------- add-on providers

type ProviderList = AddonProvider[] | { providers?: AddonProvider[] }

export async function listAddonProviders(orgId: string): Promise<AddonProvider[]> {
  const data = await request<ProviderList>(
    `/organisations/${encodeURIComponent(orgId)}/addonproviders`
  )
  if (Array.isArray(data)) return data
  return data.providers ?? []
}

export async function getAddonProvider(
  orgId: string,
  providerId: string
): Promise<AddonProvider> {
  return request<AddonProvider>(
    `/organisations/${encodeURIComponent(orgId)}/addonproviders/${encodeURIComponent(providerId)}`
  )
}

export async function updateAddonProvider(
  orgId: string,
  providerId: string,
  patch: Record<string, string | number | boolean>
): Promise<AddonProvider> {
  return request<AddonProvider>(
    `/organisations/${encodeURIComponent(orgId)}/addonproviders/${encodeURIComponent(providerId)}`,
    { method: "PUT", body: JSON.stringify(patch) }
  )
}

export async function deleteAddonProvider(orgId: string, providerId: string): Promise<void> {
  await request<unknown>(
    `/organisations/${encodeURIComponent(orgId)}/addonproviders/${encodeURIComponent(providerId)}`,
    { method: "DELETE" }
  )
}

export async function listAddonPlans(
  orgId: string,
  providerId: string
): Promise<AddonPlan[]> {
  const data = await request<AddonPlan[] | { plans?: AddonPlan[] }>(
    `/organisations/${encodeURIComponent(orgId)}/addonproviders/${encodeURIComponent(providerId)}/plans`
  )
  if (Array.isArray(data)) return data
  return data.plans ?? []
}

// ---------------------------------------------------------------- environment + logs

export async function getEnvironment(appId: string): Promise<EnvVar[]> {
  const data = await request<EnvVar[] | { variables?: EnvVar[] }>(
    `/application/${encodeURIComponent(appId)}/environment`
  )
  if (Array.isArray(data)) return data
  return data.variables ?? []
}

export async function setEnvironment(
  appId: string,
  vars: Record<string, string>
): Promise<EnvVar[]> {
  const body = Object.entries(vars).map(([name, value]) => ({ name, value }))
  const data = await request<EnvVar[] | { variables?: EnvVar[] }>(
    `/application/${encodeURIComponent(appId)}/environment`,
    { method: "PUT", body: JSON.stringify(body) }
  )
  if (Array.isArray(data)) return data
  return data.variables ?? []
}

export async function getLogs(
  appId: string,
  query: { since?: string; until?: string; limit?: number } = {}
): Promise<string> {
  const qs = new URLSearchParams()
  if (query.since) qs.set("since", query.since)
  if (query.until) qs.set("until", query.until)
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  const text = await requestText(`/logs/${encodeURIComponent(appId)}${suffix}`)
  if (!query.limit) return text
  const lines = text.split("\n")
  return lines.slice(Math.max(0, lines.length - query.limit)).join("\n")
}

export async function listDrains(): Promise<Drain[]> {
  const data = await request<Drain[] | { drains?: Drain[] }>("/logs/drains")
  if (Array.isArray(data)) return data
  return data.drains ?? []
}

type DrainList = Drain[] | { drains?: Drain[] }

function unwrapDrains(data: DrainList): Drain[] {
  return Array.isArray(data) ? data : (data.drains ?? [])
}

export async function listAppDrains(appId: string): Promise<Drain[]> {
  return unwrapDrains(await request<DrainList>(`/logs/${encodeURIComponent(appId)}/drains`))
}

export async function createAppDrain(appId: string, url: string): Promise<Drain[]> {
  return unwrapDrains(
    await request<DrainList>(`/logs/${encodeURIComponent(appId)}/drains`, {
      method: "POST",
      body: JSON.stringify({ url }),
    })
  )
}

export async function deleteAppDrain(appId: string, idOrUrl: string): Promise<void> {
  await request<unknown>(
    `/logs/${encodeURIComponent(appId)}/drains/${encodeURIComponent(idOrUrl)}`,
    { method: "DELETE" }
  )
}

// ---------------------------------------------------------------- formatters

export function formatOrganisations(rows: Organisation[]): string {
  if (rows.length === 0) return "No organisations."
  return rows
    .map((o, i) => `${i + 1}. ${o.name ?? "(unnamed)"} — id ${o.id ?? "?"}${o.description ? `\n   ${o.description}` : ""}`)
    .join("\n")
}

export function formatOrganisation(o: Organisation): string {
  return [
    `Organisation: ${o.name ?? "(unnamed)"}`,
    `id: ${o.id ?? "?"}`,
    o.description ? `description: ${o.description}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatProviders(rows: AddonProvider[]): string {
  if (rows.length === 0) return "No add-on providers."
  return rows
    .map((p, i) => `${i + 1}. ${p.name ?? p.providerId ?? "(unnamed)"} — id ${p.id ?? p.providerId ?? "?"}${p.shortDesc ? `\n   ${p.shortDesc}` : ""}`)
    .join("\n")
}

export function formatProvider(p: AddonProvider): string {
  return [
    `Add-on provider: ${p.name ?? "(unnamed)"}`,
    `id: ${p.id ?? p.providerId ?? "?"}`,
    p.shortDesc ? `description: ${p.shortDesc}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatPlans(rows: AddonPlan[]): string {
  if (rows.length === 0) return "No plans."
  return rows
    .map((p, i) => `${i + 1}. ${p.name ?? p.slug ?? "(unnamed)"}${p.price !== undefined ? ` — ${p.price}` : ""}`)
    .join("\n")
}

export function formatEnv(rows: EnvVar[]): string {
  if (rows.length === 0) return "No environment variables."
  return `${rows.length} variable(s):\n` + rows.map((v) => `${v.name}=${v.value}`).join("\n")
}

export function formatDrains(rows: Drain[]): string {
  if (rows.length === 0) return "No drains."
  return rows.map((d, i) => `${i + 1}. ${d.url ?? "(no url)"}${d.type ? ` [${d.type}]` : ""}`).join("\n")
}
