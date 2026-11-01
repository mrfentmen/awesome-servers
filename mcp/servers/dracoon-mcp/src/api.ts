/**
 * DRACOON client. Every path below comes from DRACOON's published OpenAPI
 * spec (dracoon.team 4.42.2) — no guessed endpoints.
 *
 * A tenant host always ends in /api, e.g. https://dracoon.team/api.
 */
const DEFAULT_BASE = "https://dracoon.team/api"

export class DracoonError extends Error {}

function baseUrl(): string {
  const raw = process.env.DRACOON_BASE_URL?.trim() || DEFAULT_BASE
  return raw.replace(/\/+$/, "")
}

function token(): string {
  const t = process.env.DRACOON_ACCESS_TOKEN?.trim()
  if (!t) {
    throw new DracoonError(
      "Missing DRACOON_ACCESS_TOKEN. Set it to a bearer token, or obtain one with POST /v4/auth/login (the login tool)."
    )
  }
  return t
}

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {}
}
function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined
}
function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined
}

async function request<T>(path: string, init: RequestInit = {}, withAuth = true): Promise<T> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
    "user-agent": "dracoon-mcp/1.0",
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  }
  if (withAuth) headers.authorization = `Bearer ${token()}`

  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    let detail = ""
    try {
      const body = asObj(await res.json())
      detail = str(body.message) ?? str(asObj(body.error).message) ?? ""
    } catch {
      /* body was not JSON */
    }
    throw new DracoonError(`DRACOON error ${res.status} for ${path}${detail ? `: ${detail}` : ""}`)
  }

  if (res.status === 204) return {} as T
  const text = await res.text()
  if (!text) return {} as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new DracoonError(`DRACOON returned non-JSON for ${path}`)
  }
}

// ------------------------------------------------------------------ types

export interface Group {
  id?: number
  name?: string
  createdAt?: string
  userCount?: number
}

export interface Node {
  id?: number
  name?: string
  type?: string
  size?: number
  parentId?: number
  createdAt?: string
  updatedAt?: string
  isFavorite?: boolean
}

export interface Room {
  roomId?: number
  name?: string
  isGranted?: boolean
  isWaitingRoom?: boolean
}

export interface GroupUser {
  id?: number
  firstName?: string
  lastName?: string
  email?: string
  isMember?: boolean
}

export interface UploadChannel {
  uploadId?: string
  uploadUrl?: string
  parts?: number
  token?: string
}

// ------------------------------------------------------------- operations

/** POST /v4/auth/login — password or basic login, returns the access token. */
export async function login(userName: string, password: string): Promise<{ token?: string }> {
  const raw = await request<unknown>(
    "/v4/auth/login",
    { method: "POST", body: JSON.stringify({ userName, password, authType: "basic" }) },
    false
  )
  const o = asObj(raw)
  return { token: str(o.access_token) ?? str(o.token) }
}

export async function listGroups(): Promise<Group[]> {
  const raw = await request<unknown>("/v4/groups")
  return asArr(asObj(raw).items).map(parseGroup)
}

export async function getGroup(groupId: number): Promise<Group> {
  return parseGroup(await request<unknown>(`/v4/groups/${groupId}`))
}

export async function createGroup(name: string, description?: string): Promise<Group> {
  return parseGroup(
    await request<unknown>("/v4/groups", { method: "POST", body: JSON.stringify({ name, description }) })
  )
}

export async function updateGroup(groupId: number, name: string, description?: string): Promise<Group> {
  return parseGroup(
    await request<unknown>(`/v4/groups/${groupId}`, {
      method: "PUT",
      body: JSON.stringify({ name, description }),
    })
  )
}

export async function deleteGroup(groupId: number): Promise<void> {
  await request<unknown>(`/v4/groups/${groupId}`, { method: "DELETE" })
}

export async function listGroupRooms(groupId: number): Promise<Room[]> {
  const raw = await request<unknown>(`/v4/groups/${groupId}/rooms`)
  return asArr(asObj(raw).items).map(parseRoom)
}

export async function listGroupUsers(groupId: number): Promise<GroupUser[]> {
  const raw = await request<unknown>(`/v4/groups/${groupId}/users`)
  return asArr(asObj(raw).items).map(parseGroupUser)
}

export async function addGroupUsers(groupId: number, userIds: number[]): Promise<void> {
  await request<unknown>(`/v4/groups/${groupId}/users`, {
    method: "POST",
    body: JSON.stringify({ items: userIds.map((id) => ({ id })) }),
  })
}

export async function removeGroupUsers(groupId: number, userIds: number[]): Promise<void> {
  await request<unknown>(`/v4/groups/${groupId}/users`, {
    method: "DELETE",
    body: JSON.stringify({ items: userIds.map((id) => ({ id })) }),
  })
}

export async function listNodes(parentId = 0, offset = 0, limit = 50): Promise<Node[]> {
  const query = new URLSearchParams({
    parent_id: String(parentId),
    offset: String(offset),
    limit: String(limit),
  })
  const raw = await request<unknown>(`/v4/nodes?${query.toString()}`)
  return asArr(asObj(raw).items).map(parseNode)
}

export async function deleteNodes(nodeIds: number[]): Promise<void> {
  await request<unknown>("/v4/nodes", {
    method: "DELETE",
    body: JSON.stringify({ items: nodeIds.map((id) => ({ id })) }),
  })
}

export async function toggleFavorite(nodeIds: number[], isFavorite: boolean): Promise<void> {
  await request<unknown>("/v4/nodes/favorites", {
    method: "PUT",
    body: JSON.stringify({ items: nodeIds.map((id) => ({ id, isFavorite })) }),
  })
}

/** POST /v4/nodes/files/uploads — opens a file upload channel in a folder. */
export async function createUploadChannel(
  parentId: number,
  name: string,
  size: number,
  classification = 0
): Promise<UploadChannel> {
  const raw = await request<unknown>("/v4/nodes/files/uploads", {
    method: "POST",
    body: JSON.stringify({
      parentId,
      name,
      size,
      classification,
      expiration: null,
      notes: null,
    }),
  })
  const o = asObj(raw)
  const parts = asArr(o.parts)
  const firstPart = asObj(parts[0])
  return {
    uploadId: str(o.uploadId),
    uploadUrl: str(firstPart.url) ?? str(o.uploadUrl),
    parts: parts.length || undefined,
    token: str(o.token),
  }
}

/**
 * PUT to the pre-signed upload URL returned by the channel. S3 ignores our
 * bearer token, so this call is deliberately unauthenticated.
 */
export async function uploadBytes(uploadUrl: string, content: string): Promise<{ bytes: number }> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": "application/octet-stream", "user-agent": "dracoon-mcp/1.0" },
    body: content,
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) throw new DracoonError(`Upload failed with ${res.status}`)
  return { bytes: Buffer.byteLength(content, "utf8") }
}

/** PUT /v4/nodes/files/uploads/{upload_id} — finalise the upload. */
export async function completeUpload(uploadId: string): Promise<{ nodeId?: number; name?: string }> {
  const raw = await request<unknown>(`/v4/nodes/files/uploads/${encodeURIComponent(uploadId)}`, {
    method: "PUT",
    body: JSON.stringify({ resolutionStrategy: "autorename" }),
  })
  const o = asObj(raw)
  return { nodeId: num(o.id), name: str(o.name) }
}

export async function uploadStatus(uploadId: string): Promise<Node> {
  return parseNode(
    await request<unknown>(`/v4/nodes/files/uploads/${encodeURIComponent(uploadId)}`)
  )
}

// -------------------------------------------------------------- parsers

function parseGroup(v: unknown): Group {
  const o = asObj(v)
  return {
    id: num(o.id),
    name: str(o.name),
    createdAt: str(o.createdAt),
    userCount: num(o.userCount),
  }
}

function parseNode(v: unknown): Node {
  const o = asObj(v)
  return {
    id: num(o.id),
    name: str(o.name),
    type: str(o.type),
    size: num(o.size),
    parentId: num(o.parentId),
    createdAt: str(o.createdAt),
    updatedAt: str(o.updatedAt),
    isFavorite: typeof o.isFavorite === "boolean" ? o.isFavorite : undefined,
  }
}

function parseRoom(v: unknown): Room {
  const o = asObj(v)
  return {
    roomId: num(o.roomId) ?? num(o.id),
    name: str(o.name),
    isGranted: typeof o.isGranted === "boolean" ? o.isGranted : undefined,
    isWaitingRoom: typeof o.isWaitingRoom === "boolean" ? o.isWaitingRoom : undefined,
  }
}

function parseGroupUser(v: unknown): GroupUser {
  const o = asObj(v)
  const user = asObj(o.user)
  return {
    id: num(o.id) ?? num(user.id),
    firstName: str(o.firstName) ?? str(user.firstName),
    lastName: str(o.lastName) ?? str(user.lastName),
    email: str(o.email) ?? str(user.email),
    isMember: typeof o.isMember === "boolean" ? o.isMember : undefined,
  }
}

// ------------------------------------------------------------- formatters

export function formatGroup(g: Group): string {
  return [g.name ?? "(unnamed group)", `id: ${g.id ?? "?"}`, g.userCount !== undefined ? `users: ${g.userCount}` : ""]
    .filter(Boolean)
    .join(" · ")
}

export function formatNode(n: Node): string {
  const size = n.size !== undefined ? `${n.size} bytes` : "size unknown"
  return [
    `${n.type ?? "node"}: ${n.name ?? "(unnamed)"}`,
    `id: ${n.id ?? "?"}`,
    size,
    n.isFavorite ? "favorite" : "",
  ]
    .filter(Boolean)
    .join(" · ")
}

export function formatRoom(r: Room): string {
  return [`room: ${r.name ?? "(unnamed)"}`, `id: ${r.roomId ?? "?"}`, r.isGranted ? "granted" : ""]
    .filter(Boolean)
    .join(" · ")
}

export function formatGroupUser(u: GroupUser): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "(unnamed user)"
  return [name, u.email ?? "", `id: ${u.id ?? "?"}`, u.isMember ? "member" : ""].filter(Boolean).join(" · ")
}
