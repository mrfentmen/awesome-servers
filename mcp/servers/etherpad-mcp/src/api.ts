const DEFAULT_BASE = "https://etherpad.example.com/api/1.2.15"

export class EtherpadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EtherpadError"
  }
}

/** Etherpad is self-hosted, so the base URL is always the user's own instance. */
export function baseUrl(): string {
  const raw = process.env.ETHERPAD_BASE_URL?.trim()
  if (!raw) return DEFAULT_BASE
  return raw.replace(/\/+$/, "")
}

function apiKey(): string {
  const key = process.env.ETHERPAD_API_KEY?.trim()
  if (!key) {
    throw new EtherpadError(
      "ETHERPAD_API_KEY is not set. Copy the API key from your Etherpad admin settings and set ETHERPAD_BASE_URL to your instance, for example https://pad.example.com/api/1.2.15."
    )
  }
  return key
}

type ParamValue = string | number | boolean | undefined

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
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

function stringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
}

function numberList(v: unknown): number[] {
  return Array.isArray(v) ? v.filter((x): x is number => typeof x === "number" && Number.isFinite(x)) : []
}

/**
 * Every Etherpad API call is a GET with the key in the query string and answers
 * `{ code: 0, message: "ok", data: ... }`. A non-zero code is an error even
 * when the HTTP status is 200, which is why the envelope is checked here.
 */
async function call(fn: string, params: Record<string, ParamValue> = {}): Promise<unknown> {
  const url = new URL(`${baseUrl()}/${fn}`)
  url.searchParams.set("apikey", apiKey())
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    url.searchParams.set(key, String(value))
  }

  let res: Response
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(25000) })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    throw new EtherpadError(`Cannot reach Etherpad at ${baseUrl()}: ${detail}`)
  }

  const raw = await res.text()
  let payload: unknown
  try {
    payload = JSON.parse(raw) as unknown
  } catch {
    const preview = raw.trim().slice(0, 200)
    throw new EtherpadError(
      `Etherpad returned non-JSON for ${fn} (HTTP ${res.status}): ${preview === "" ? "empty body" : preview}`
    )
  }

  const body = asObj(payload)
  const code = num(body.code) ?? (res.ok ? 0 : 1)
  if (code !== 0) {
    const message = str(body.message) ?? `HTTP ${res.status}`
    throw new EtherpadError(`Etherpad ${fn} failed: ${message}`)
  }
  return body.data
}

export interface PadRef {
  padID: string
  message?: string
}

function parsePadRef(data: unknown): PadRef {
  if (typeof data === "string") return { padID: data }
  const obj = asObj(data)
  return { padID: str(obj.padID) ?? "", message: str(obj.message) }
}

/** createPad */
export async function createPad(padID: string, text?: string): Promise<PadRef> {
  return parsePadRef(await call("createPad", { padID, text }))
}

/** deletePad */
export async function deletePad(padID: string): Promise<void> {
  await call("deletePad", { padID })
}

/** copyPad */
export async function copyPad(sourceID: string, destinationID: string, force = false): Promise<PadRef> {
  return parsePadRef(await call("copyPad", { sourceID, destinationID, force }))
}

/** movePad */
export async function movePad(sourceID: string, destinationID: string, force = false): Promise<PadRef> {
  return parsePadRef(await call("movePad", { sourceID, destinationID, force }))
}

/** getText */
export async function getText(padID: string, rev?: string): Promise<string> {
  const data = await call("getText", { padID, rev })
  if (typeof data === "string") return data
  return str(asObj(data).text) ?? ""
}

/** setText */
export async function setText(padID: string, text: string): Promise<void> {
  await call("setText", { padID, text })
}

/** appendText */
export async function appendText(padID: string, text: string): Promise<void> {
  await call("appendText", { padID, text })
}

/** getHTML */
export async function getHTML(padID: string, rev?: string): Promise<string> {
  const data = await call("getHTML", { padID, rev })
  if (typeof data === "string") return data
  return str(asObj(data).html) ?? ""
}

/** getRevisionsCount */
export async function getRevisionsCount(padID: string): Promise<number> {
  return num(asObj(await call("getRevisionsCount", { padID })).revisions) ?? 0
}

/** getSavedRevisionsCount */
export async function getSavedRevisionsCount(padID: string): Promise<number> {
  return num(asObj(await call("getSavedRevisionsCount", { padID })).savedRevisions) ?? 0
}

/** listSavedRevisions */
export async function listSavedRevisions(padID: string): Promise<number[]> {
  return numberList(asObj(await call("listSavedRevisions", { padID })).savedRevisions)
}

/** saveRevision */
export async function saveRevision(padID: string, rev: number): Promise<void> {
  await call("saveRevision", { padID, rev })
}

/** getLastEdited */
export async function getLastEdited(padID: string): Promise<number> {
  return num(asObj(await call("getLastEdited", { padID })).lastEdited) ?? 0
}

/** listAllPads */
export async function listAllPads(): Promise<string[]> {
  return stringList(asObj(await call("listAllPads")).padIDs)
}

/** listPads */
export async function listPads(groupID: string): Promise<string[]> {
  return stringList(asObj(await call("listPads", { groupID })).padIDs)
}

/** createGroup */
export async function createGroup(): Promise<string> {
  return str(asObj(await call("createGroup")).groupID) ?? ""
}

/** deleteGroup */
export async function deleteGroup(groupID: string): Promise<void> {
  await call("deleteGroup", { groupID })
}

/** listGroups */
export async function listGroups(): Promise<string[]> {
  return stringList(asObj(await call("listGroups")).groupIDs)
}

/** createGroupPad */
export async function createGroupPad(groupID: string, padName: string, text?: string): Promise<PadRef> {
  return parsePadRef(await call("createGroupPad", { groupID, padName, text }))
}

/** listGroupPads */
export async function listGroupPads(groupID: string): Promise<string[]> {
  return stringList(asObj(await call("listGroupPads", { groupID })).padIDs)
}

/** listAuthorsOfPad */
export async function listAuthorsOfPad(padID: string): Promise<string[]> {
  return stringList(asObj(await call("listAuthorsOfPad", { padID })).authorIDs)
}

export interface PadUser {
  id?: string
  name?: string
  colorId?: string
  timestamp?: number
}

/** padUsers */
export async function padUsers(padID: string): Promise<PadUser[]> {
  const rows = asObj(await call("padUsers", { padID })).padUsers
  if (!Array.isArray(rows)) return []
  const out: PadUser[] = []
  for (const row of rows) {
    const item = asObj(row)
    out.push({
      id: str(item.id),
      name: str(item.name),
      colorId: str(item.colorId),
      timestamp: num(item.timestamp),
    })
  }
  return out
}

/** padUsersCount */
export async function padUsersCount(padID: string): Promise<number> {
  return num(asObj(await call("padUsersCount", { padID })).padUsersCount) ?? 0
}

/** createAuthor */
export async function createAuthor(name?: string): Promise<string> {
  return str(asObj(await call("createAuthor", { name })).authorID) ?? ""
}

/** getAuthorName */
export async function getAuthorName(authorID: string): Promise<string> {
  return str(asObj(await call("getAuthorName", { authorID })).authorName) ?? ""
}

/** setPublicStatus */
export async function setPublicStatus(padID: string, publicStatus: boolean): Promise<void> {
  await call("setPublicStatus", { padID, publicStatus })
}

/** getPublicStatus */
export async function getPublicStatus(padID: string): Promise<boolean | undefined> {
  return bool(asObj(await call("getPublicStatus", { padID })).publicStatus)
}

/** setPassword */
export async function setPassword(padID: string, password: string): Promise<void> {
  await call("setPassword", { padID, password })
}

/** isPasswordProtected */
export async function isPasswordProtected(padID: string): Promise<boolean> {
  return bool(asObj(await call("isPasswordProtected", { padID })).isPasswordProtected) ?? false
}

/** getReadOnlyID */
export async function getReadOnlyID(padID: string): Promise<string> {
  return str(asObj(await call("getReadOnlyID", { padID })).readOnlyID) ?? ""
}

/** checkToken */
export async function checkToken(): Promise<boolean> {
  const data = await call("checkToken")
  const obj = asObj(data)
  return bool(obj.valid) ?? bool(data) ?? true
}

/** createSession */
export async function createSession(groupID: string, authorID: string, validUntil: number): Promise<string> {
  return str(asObj(await call("createSession", { groupID, authorID, validUntil })).sessionID) ?? ""
}

/** listSessionsOfGroup */
export async function listSessionsOfGroup(groupID: string): Promise<string[]> {
  return Object.keys(asObj(await call("listSessionsOfGroup", { groupID })))
}

/** appendChatMessage */
export async function appendChatMessage(padID: string, text: string, authorID: string, time?: number): Promise<void> {
  await call("appendChatMessage", { padID, text, authorID, time })
}

export function formatPadRef(ref: PadRef): string {
  const lines = [`Pad: ${ref.padID === "" ? "(no id returned)" : ref.padID}`]
  if (ref.message) lines.push(`Message: ${ref.message}`)
  return lines.join("\n")
}

export function formatPads(ids: string[], label: string): string {
  if (ids.length === 0) return `No ${label} found.`
  return [`${ids.length} ${label}:`, ...ids.map((id, i) => `${i + 1}. ${id}`)].join("\n")
}

export function formatText(text: string): string {
  return text === "" ? "(pad is empty)" : text
}

export function formatCount(value: number, label: string): string {
  return `${label}: ${value}`
}

export function formatPadUsers(users: PadUser[]): string {
  if (users.length === 0) return "No users are currently on this pad."
  return [
    `${users.length} user(s) on this pad:`,
    ...users.map((u, i) => {
      const who = u.name ?? u.id ?? "unknown"
      const colour = u.colorId ? ` · colour ${u.colorId}` : ""
      return `${i + 1}. ${who}${colour}`
    }),
  ].join("\n")
}

export function formatYesNo(value: boolean | undefined, label: string): string {
  if (value === undefined) return `${label}: unknown (the instance did not answer with a boolean)`
  return `${label}: ${value ? "yes" : "no"}`
}

export function formatTimestamp(ms: number, label: string): string {
  if (ms <= 0) return `${label}: never`
  return `${label}: ${new Date(ms).toISOString()}`
}
