/**
 * Emby REST API client. Points at any instance via EMBY_URL
 * (default http://localhost:8096). Most calls need EMBY_API_KEY
 * (Dashboard > Advanced > API Keys); server info is public.
 * Docs: https://swagger.emby.media/
 */
const BASE = (process.env.EMBY_URL ?? "http://localhost:8096").replace(/\/+$/, "")

export class EmbyError extends Error {}

function headers(authed: boolean): Record<string, string> {
  const h: Record<string, string> = { "User-Agent": "emby-mcp/1.0", Accept: "application/json" }
  if (authed) {
    const key = process.env.EMBY_API_KEY
    if (!key) throw new EmbyError("Set EMBY_API_KEY first (Dashboard > Advanced > API Keys).")
    h["X-Emby-Token"] = key
  }
  return h
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string, authed: boolean): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: headers(authed),
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    throw new EmbyError(`Emby at ${BASE} is unreachable. Set EMBY_URL.`)
  }
  if (res.status === 401 || res.status === 403) throw new EmbyError("Emby refused (401/403). Check EMBY_API_KEY.")
  if (res.status === 404) throw new EmbyError("Not found.")
  if (!res.ok) throw new EmbyError(`Emby error ${res.status}`)
  return (await res.json()) as T
}

export interface ServerInfo {
  name?: string
  version?: string
  id?: string
}

export async function serverInfo(): Promise<ServerInfo> {
  const info = await getJson<Raw>("/emby/System/Info/Public", false)
  return { name: info.ServerName, version: info.Version, id: info.Id }
}

export interface EmbyUser {
  id: string
  name?: string
  admin?: boolean
  lastActive?: string
}

export async function listUsers(): Promise<EmbyUser[]> {
  const rows = await getJson<Raw[]>("/emby/Users", true)
  return rows.map((u) => ({
    id: String(u.Id),
    name: u.Name,
    admin: u.Policy?.IsAdministrator,
    lastActive: u.LastActivityDate ? String(u.LastActivityDate).slice(0, 10) : undefined,
  }))
}

export interface Library {
  id: string
  name?: string
  type?: string
}

export async function listLibraries(): Promise<Library[]> {
  const data = await getJson<Raw>("/emby/Library/MediaFolders", true)
  const rows: Raw[] = Array.isArray(data.Items) ? data.Items : []
  return rows.map((l) => ({ id: String(l.Id), name: l.Name, type: l.CollectionType }))
}

export function formatUser(u: EmbyUser, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${u.id}] ${u.name ?? "(unnamed)"}${u.admin ? " (admin)" : ""}${u.lastActive ? ` — active ${u.lastActive}` : ""}`
}

export function formatLibrary(l: Library, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${l.id}] ${l.name ?? "(unnamed)"}${l.type ? ` (${l.type})` : ""}`
}
