/**
 * Sinao client. Every path below comes from the published OpenAPI spec
 * (sinao.app 1.1.0) — no guessed routes.
 *
 * Auth: bearer API key. Base is overridable so self-hosted / sandbox
 * installations (api.sinao.dev, api.sinao.test) work.
 */
const DEFAULT_BASE = "https://api.sinao.app/v1"

export class SinaoError extends Error {}

function baseUrl(): string {
  return (process.env.SINAO_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "")
}

function apiKey(): string {
  const key = process.env.SINAO_API_KEY
  if (!key) throw new SinaoError("Missing SINAO_API_KEY environment variable")
  return key
}

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {}
}

const LIST_KEYS = ["data", "results", "items", "apps", "categories", "invitations", "profiles", "rows"]

function asArr(v: unknown): unknown[] {
  if (Array.isArray(v)) return v
  const o = asObj(v)
  for (const k of LIST_KEYS) {
    const candidate = o[k]
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    authorization: `Bearer ${apiKey()}`,
    accept: "application/json",
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  }
  if (init?.body) headers["content-type"] = "application/json"

  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(25000),
  })
  const text = await res.text()

  if (!res.ok) {
    let detail = ""
    try {
      const body = asObj(JSON.parse(text))
      detail = str(body.message) ?? str(body.error) ?? str(body.detail) ?? ""
    } catch {
      /* error body was not JSON — status alone is enough */
    }
    throw new SinaoError(`Sinao error ${res.status} for ${path}${detail ? `: ${detail}` : ""}`)
  }
  if (!text) return {} as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new SinaoError(`Sinao returned non-JSON for ${path}`)
  }
}

// ------------------------------------------------------------------ types

export interface SinaoApp {
  id?: string
  name?: string
  description?: string
  createdAt?: string
}

export interface AccessProfile {
  id?: string
  name?: string
  label?: string
}

export interface Invitation {
  id?: string
  email?: string
  status?: string
  createdAt?: string
}

export interface UserAccess {
  userId?: string
  role?: string
  profileId?: string
  profileName?: string
}

export interface AccountCategory {
  id?: string
  name?: string
  code?: string
  type?: string
}

// ---------------------------------------------------------------- parsers

function parseApp(v: unknown): SinaoApp {
  const o = asObj(v)
  return {
    id: str(o.id) ?? str(o._id) ?? str(o.appId),
    name: str(o.name),
    description: str(o.description),
    createdAt: str(o.createdAt) ?? str(o.created_at),
  }
}

function parseProfile(v: unknown): AccessProfile {
  const o = asObj(v)
  return {
    id: str(o.id) ?? str(o._id),
    name: str(o.name),
    label: str(o.label) ?? str(o.description),
  }
}

function parseInvitation(v: unknown): Invitation {
  const o = asObj(v)
  return {
    id: str(o.id) ?? str(o._id),
    email: str(o.email) ?? str(o.mail),
    status: str(o.status) ?? str(o.state),
    createdAt: str(o.createdAt) ?? str(o.created_at),
  }
}

function parseUserAccess(v: unknown): UserAccess {
  const o = asObj(v)
  const profile = asObj(o.profile)
  return {
    userId: str(o.userId) ?? str(o.user_id) ?? str(o.id),
    role: str(o.role) ?? str(o.policy) ?? str(o.access),
    profileId: str(o.profileId) ?? str(profile.id),
    profileName: str(o.profileName) ?? str(profile.name),
  }
}

function parseCategory(v: unknown): AccountCategory {
  const o = asObj(v)
  return {
    id: str(o.id) ?? str(o._id),
    name: str(o.name) ?? str(o.label),
    code: str(o.code) ?? str(o.number),
    type: str(o.type) ?? str(o.categoryType),
  }
}

// ------------------------------------------------------------- operations

export async function listApps(): Promise<SinaoApp[]> {
  return asArr(await request<unknown>("/apps")).map(parseApp)
}

export async function getApp(appId: string): Promise<SinaoApp> {
  return parseApp(await request<unknown>(`/apps/${encodeURIComponent(appId)}`))
}

export async function createApp(name: string, description?: string): Promise<SinaoApp> {
  return parseApp(
    await request<unknown>("/apps", {
      method: "POST",
      body: JSON.stringify(description ? { name, description } : { name }),
    })
  )
}

export async function getAppAccess(appId: string): Promise<UserAccess[]> {
  return asArr(await request<unknown>(`/apps/${encodeURIComponent(appId)}/access`)).map(parseUserAccess)
}

export async function listAccessProfiles(appId: string): Promise<AccessProfile[]> {
  return asArr(await request<unknown>(`/apps/${encodeURIComponent(appId)}/access/profiles`)).map(parseProfile)
}

export async function listInvitations(appId: string): Promise<Invitation[]> {
  return asArr(await request<unknown>(`/apps/${encodeURIComponent(appId)}/access/invite`)).map(parseInvitation)
}

export async function inviteUser(appId: string, email: string, profileId?: string): Promise<Invitation> {
  return parseInvitation(
    await request<unknown>(`/apps/${encodeURIComponent(appId)}/access/invite`, {
      method: "POST",
      body: JSON.stringify(profileId ? { email, profileId } : { email }),
    })
  )
}

export async function deleteInvitation(appId: string, invitationId: string): Promise<void> {
  await request<unknown>(
    `/apps/${encodeURIComponent(appId)}/access/invite/${encodeURIComponent(invitationId)}`,
    { method: "DELETE" }
  )
}

export async function getUserAccess(appId: string, userId: string): Promise<UserAccess> {
  return parseUserAccess(
    await request<unknown>(
      `/apps/${encodeURIComponent(appId)}/access/${encodeURIComponent(userId)}`
    )
  )
}

export async function setUserAccess(
  appId: string,
  userId: string,
  profileId: string,
  role?: string
): Promise<UserAccess> {
  return parseUserAccess(
    await request<unknown>(
      `/apps/${encodeURIComponent(appId)}/access/${encodeURIComponent(userId)}`,
      { method: "POST", body: JSON.stringify(role ? { profileId, role } : { profileId }) }
    )
  )
}

export async function deleteUserAccess(appId: string, userId: string): Promise<void> {
  await request<unknown>(
    `/apps/${encodeURIComponent(appId)}/access/${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  )
}

export async function listAccountCategories(appId: string): Promise<AccountCategory[]> {
  return asArr(await request<unknown>(`/apps/${encodeURIComponent(appId)}/accountcategories/`)).map(
    parseCategory
  )
}

export async function getAccountCategory(appId: string, categoryId: string): Promise<AccountCategory> {
  return parseCategory(
    await request<unknown>(
      `/apps/${encodeURIComponent(appId)}/accountcategories/${encodeURIComponent(categoryId)}`
    )
  )
}

export async function createAccountCategory(
  appId: string,
  name: string,
  code?: string,
  type?: string
): Promise<AccountCategory> {
  const body: Record<string, string> = { name }
  if (code) body.code = code
  if (type) body.type = type
  return parseCategory(
    await request<unknown>(`/apps/${encodeURIComponent(appId)}/accountcategories/`, {
      method: "POST",
      body: JSON.stringify(body),
    })
  )
}

export async function updateAccountCategory(
  appId: string,
  categoryId: string,
  patch: { name?: string; code?: string; type?: string }
): Promise<AccountCategory> {
  const body: Record<string, string> = {}
  if (patch.name) body.name = patch.name
  if (patch.code) body.code = patch.code
  if (patch.type) body.type = patch.type
  if (Object.keys(body).length === 0) throw new SinaoError("Nothing to update")
  return parseCategory(
    await request<unknown>(
      `/apps/${encodeURIComponent(appId)}/accountcategories/${encodeURIComponent(categoryId)}`,
      { method: "POST", body: JSON.stringify(body) }
    )
  )
}

// ------------------------------------------------------------- formatters

export function formatApp(a: SinaoApp, index?: number): string {
  const lines = [`${index !== undefined ? `${index + 1}. ` : ""}${a.name ?? "(unnamed app)"}`]
  if (a.id) lines.push(`id: ${a.id}`)
  if (a.description) lines.push(a.description)
  if (a.createdAt) lines.push(`created: ${a.createdAt}`)
  return lines.join("\n")
}

export function formatApps(rows: SinaoApp[]): string {
  if (rows.length === 0) return "No apps."
  return `${rows.length} app(s):\n\n${rows.map((r, i) => formatApp(r, i)).join("\n\n")}`
}

export function formatProfile(p: AccessProfile, index?: number): string {
  return `${index !== undefined ? `${index + 1}. ` : ""}${p.name ?? p.label ?? "(profile)"}${
    p.id ? ` (${p.id})` : ""
  }`
}

export function formatProfiles(rows: AccessProfile[]): string {
  if (rows.length === 0) return "No access profiles."
  return `${rows.length} profile(s):\n\n${rows.map((r, i) => formatProfile(r, i)).join("\n")}`
}

export function formatInvitation(inv: Invitation, index?: number): string {
  const bits = [inv.email ?? "(no email)"]
  if (inv.status) bits.push(inv.status)
  if (inv.id) bits.push(`id: ${inv.id}`)
  return `${index !== undefined ? `${index + 1}. ` : ""}${bits.join(" — ")}`
}

export function formatInvitations(rows: Invitation[]): string {
  if (rows.length === 0) return "No pending invitations."
  return `${rows.length} invitation(s):\n\n${rows.map((r, i) => formatInvitation(r, i)).join("\n")}`
}

export function formatUserAccess(a: UserAccess, index?: number): string {
  const bits = [a.userId ?? "(user)"]
  if (a.role) bits.push(`role: ${a.role}`)
  if (a.profileName ?? a.profileId) bits.push(`profile: ${a.profileName ?? a.profileId}`)
  return `${index !== undefined ? `${index + 1}. ` : ""}${bits.join(" · ")}`
}

export function formatAccessList(rows: UserAccess[]): string {
  if (rows.length === 0) return "No users with access."
  return `${rows.length} user(s) with access:\n\n${rows.map((r, i) => formatUserAccess(r, i)).join("\n")}`
}

export function formatCategory(c: AccountCategory, index?: number): string {
  const bits = [c.name ?? "(category)"]
  if (c.code) bits.push(c.code)
  if (c.type) bits.push(c.type)
  if (c.id) bits.push(`id: ${c.id}`)
  return `${index !== undefined ? `${index + 1}. ` : ""}${bits.join(" · ")}`
}

export function formatCategories(rows: AccountCategory[]): string {
  if (rows.length === 0) return "No account categories."
  return `${rows.length} category(ies):\n\n${rows.map((r, i) => formatCategory(r, i)).join("\n")}`
}

export function errorMessage(e: unknown): string {
  if (e instanceof SinaoError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

