/**
 * Apacta client. Project and time-tracking API for the building trades.
 * Base and paths are taken from Apacta's published OpenAPI spec — no guessing.
 *
 * Auth is a single header, `X-Auth-Token`, from APACTA_API_TOKEN.
 */
const BASE = "https://app.apacta.com/api/v1"

export class ApactaError extends Error {}

function token(): string {
  const value = process.env.APACTA_API_TOKEN
  if (!value) throw new ApactaError("APACTA_API_TOKEN is not set")
  return value
}

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {}
}

function asRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.map(asObj)
  const o = asObj(payload)
  for (const key of ["data", "items", "results", "records"]) {
    const v = o[key]
    if (Array.isArray(v)) return v.map(asObj)
  }
  return []
}

function text(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined
}

function idOf(v: unknown): string | undefined {
  if (typeof v === "number") return String(v)
  if (typeof v === "string" && v.length > 0) return v
  return undefined
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    search.set(key, String(value))
  }
  const s = search.toString()
  return s ? `?${s}` : ""
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Auth-Token": token(),
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(25000),
  })
  const body = await res.text()
  if (!res.ok) {
    const detail = body.replace(/\s+/g, " ").slice(0, 200)
    throw new ApactaError(`Apacta error ${res.status} for ${path}${detail ? `: ${detail}` : ""}`)
  }
  if (!body) return {} as T
  try {
    return JSON.parse(body) as T
  } catch {
    throw new ApactaError(`Apacta returned non-JSON for ${path}`)
  }
}

// ---------------------------------------------------------------- types

export interface Activity {
  id?: number | string
  name?: string
  description?: string
  company_id?: number | string
  project_id?: number | string
}

export interface ClockingRecord {
  id?: number | string
  user_id?: number | string
  activity_id?: number | string
  start_time?: string
  end_time?: string
  duration?: number
  comment?: string
}

export interface Company {
  id?: number | string
  name?: string
  city?: string
  email?: string
}

export interface City {
  id?: number | string
  name?: string
  zip_code?: string
  country?: string
}

// ---------------------------------------------------------- row parsers

function parseActivity(v: unknown): Activity {
  const o = asObj(v)
  return {
    id: idOf(o.id),
    name: text(o.name),
    description: text(o.description),
    company_id: idOf(o.company_id),
    project_id: idOf(o.project_id),
  }
}

function parseClockingRecord(v: unknown): ClockingRecord {
  const o = asObj(v)
  return {
    id: idOf(o.id),
    user_id: idOf(o.user_id),
    activity_id: idOf(o.activity_id),
    start_time: text(o.start_time) ?? text(o.start),
    end_time: text(o.end_time) ?? text(o.end),
    duration: num(o.duration),
    comment: text(o.comment) ?? text(o.note),
  }
}

function parseCompany(v: unknown): Company {
  const o = asObj(v)
  return {
    id: idOf(o.id),
    name: text(o.name),
    city: text(o.city),
    email: text(o.email),
  }
}

function parseCity(v: unknown): City {
  const o = asObj(v)
  return {
    id: idOf(o.id),
    name: text(o.name),
    zip_code: text(o.zip_code) ?? text(o.zip),
    country: text(o.country),
  }
}

// ------------------------------------------------------------- endpoints

export async function listActivities(limit?: number, offset?: number): Promise<Activity[]> {
  const payload = await request<unknown>(`/activities${query({ limit, offset })}`)
  return asRows(payload).map(parseActivity)
}

export async function createActivity(body: Record<string, unknown>): Promise<Activity> {
  return parseActivity(await request<unknown>("/activities", { method: "POST", body: JSON.stringify(body) }))
}

export async function updateActivity(activityId: string, body: Record<string, unknown>): Promise<Activity> {
  return parseActivity(
    await request<unknown>(`/activities/${encodeURIComponent(activityId)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  )
}

export async function deleteActivity(activityId: string): Promise<void> {
  await request<unknown>(`/activities/${encodeURIComponent(activityId)}`, { method: "DELETE" })
}

export async function listClockingRecords(limit?: number, offset?: number): Promise<ClockingRecord[]> {
  const payload = await request<unknown>(`/clocking_records${query({ limit, offset })}`)
  return asRows(payload).map(parseClockingRecord)
}

export async function getClockingRecord(clockingRecordId: string): Promise<ClockingRecord> {
  return parseClockingRecord(
    await request<unknown>(`/clocking_records/${encodeURIComponent(clockingRecordId)}`)
  )
}

export async function createClockingRecord(body: Record<string, unknown>): Promise<ClockingRecord> {
  return parseClockingRecord(
    await request<unknown>("/clocking_records", { method: "POST", body: JSON.stringify(body) })
  )
}

export async function updateClockingRecord(
  clockingRecordId: string,
  body: Record<string, unknown>
): Promise<ClockingRecord> {
  return parseClockingRecord(
    await request<unknown>(`/clocking_records/${encodeURIComponent(clockingRecordId)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  )
}

export async function deleteClockingRecord(clockingRecordId: string): Promise<void> {
  await request<unknown>(`/clocking_records/${encodeURIComponent(clockingRecordId)}`, { method: "DELETE" })
}

export async function clockOut(): Promise<ClockingRecord> {
  return parseClockingRecord(
    await request<unknown>("/clocking_records/checkout", { method: "POST", body: "{}" })
  )
}

export async function listCompanies(): Promise<Company[]> {
  const payload = await request<unknown>("/companies")
  return asRows(payload).map(parseCompany)
}

export async function getCompany(companyId: string): Promise<Company> {
  return parseCompany(await request<unknown>(`/companies/${encodeURIComponent(companyId)}`))
}

export async function listCities(): Promise<City[]> {
  const payload = await request<unknown>("/cities")
  return asRows(payload).map(parseCity)
}

export async function getCity(cityId: string): Promise<City> {
  return parseCity(await request<unknown>(`/cities/${encodeURIComponent(cityId)}`))
}

// ----------------------------------------------------------- formatters

export function formatDuration(ms?: number): string {
  if (ms === undefined) return "not recorded"
  const totalMinutes = Math.round(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatActivity(a: Activity, index?: number): string {
  const head = `${index !== undefined ? `${index + 1}. ` : ""}${a.name ?? "Unnamed activity"}${a.id ? ` (id ${a.id})` : ""}`
  const bits = [
    a.company_id ? `company ${a.company_id}` : "",
    a.project_id ? `project ${a.project_id}` : "",
  ].filter(Boolean)
  return [head, a.description, bits.join(" · ")].filter(Boolean).join("\n")
}

export function formatClockingRecord(r: ClockingRecord, index?: number): string {
  const head = `${index !== undefined ? `${index + 1}. ` : ""}${r.start_time ?? "no start"} → ${r.end_time ?? "still running"}`
  const bits = [
    r.id ? `id ${r.id}` : "",
    r.user_id ? `user ${r.user_id}` : "",
    r.activity_id ? `activity ${r.activity_id}` : "",
    formatDuration(r.duration),
  ].filter(Boolean)
  return [head, bits.join(" · "), r.comment].filter(Boolean).join("\n")
}

export function formatCompany(c: Company, index?: number): string {
  return [`${index !== undefined ? `${index + 1}. ` : ""}${c.name ?? "Unnamed company"}${c.id ? ` (id ${c.id})` : ""}`, c.city, c.email]
    .filter(Boolean)
    .join("\n")
}

export function formatCity(c: City, index?: number): string {
  const head = `${index !== undefined ? `${index + 1}. ` : ""}${c.name ?? "Unnamed city"}${c.id ? ` (id ${c.id})` : ""}`
  const bits = [c.zip_code, c.country].filter(Boolean)
  return [head, bits.join(" · ")].filter(Boolean).join("\n")
}

export function formatRows(lines: string[], empty: string): string {
  return lines.length === 0 ? empty : lines.join("\n\n")
}
