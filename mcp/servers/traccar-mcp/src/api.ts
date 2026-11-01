/**
 * Traccar client. Traccar is an open-source GPS tracking server that most
 * people self-host, so the base URL is always per-installation. The REST API
 * lives under `/api` and is described by the server itself at /api/swagger.
 */
const DEFAULT_BASE = "https://demo.traccar.org"
const API_TIMEOUT_MS = 25_000

export class TraccarError extends Error {}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

/** Query values are dropped when undefined or empty, so callers can pass optionals. */
type Query = Record<string, string | number | undefined>

interface RequestOptions {
  query?: Query
  body?: unknown
}

/**
 * Auth priority: a personal API token wins over email/password. Tokens can be
 * revoked individually and avoid putting a password in the MCP client's env.
 * Without a token we fall back to HTTP Basic, which every Traccar install
 * accepts.
 */
function authHeader(): string {
  const token = process.env.TRACCAR_TOKEN?.trim()
  if (token) return `Bearer ${token}`
  const email = process.env.TRACCAR_EMAIL?.trim()
  const password = process.env.TRACCAR_PASSWORD
  if (!email) throw new TraccarError("TRACCAR_EMAIL is required unless TRACCAR_TOKEN is set")
  if (password === undefined || password === "") {
    throw new TraccarError("TRACCAR_PASSWORD is required unless TRACCAR_TOKEN is set")
  }
  return `Basic ${Buffer.from(`${email}:${password}`).toString("base64")}`
}

/** Server root, with any trailing slash or stray `/api` suffix removed. */
export function baseUrl(): string {
  const raw = process.env.TRACCAR_BASE_URL?.trim()
  const base = (raw && raw.length > 0 ? raw : DEFAULT_BASE).replace(/\/+$/, "")
  return base.endsWith("/api") ? base.slice(0, -4) : base
}

function asObj(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
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

function bool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined
}

function errorDetail(raw: string, statusText: string): string {
  const trimmed = raw.trim()
  if (trimmed === "") return statusText
  try {
    const body = asObj(JSON.parse(trimmed) as unknown)
    const message = str(body.message) ?? str(body.error) ?? str(body.detail)
    if (message) return firstLine(message)
  } catch {
    // Body was not JSON — fall through and use the raw text.
  }
  return firstLine(trimmed)
}

/** Traccar is Java: keep the first line and drop the stack trace. */
function firstLine(text: string): string {
  const line = text.split("\n")[0].trim()
  return line.length > 200 ? `${line.slice(0, 200)}…` : line
}

async function request(
  method: HttpMethod,
  path: string,
  opts: RequestOptions = {}
): Promise<unknown> {
  const url = new URL(`${baseUrl()}/api${path}`)
  if (opts.query) {
    for (const [key, value] of Object.entries(opts.query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value))
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: authHeader(),
  }
  const init: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  }
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json"
    init.body = JSON.stringify(opts.body)
  }

  let res: Response
  try {
    res = await fetch(url, init)
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    throw new TraccarError(`Cannot reach Traccar at ${baseUrl()}: ${detail}`)
  }

  const raw = await res.text()
  if (!res.ok) {
    throw new TraccarError(
      `Traccar ${res.status} on ${method} ${path}: ${errorDetail(raw, res.statusText)}`
    )
  }
  if (raw.trim() === "") return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    throw new TraccarError(`Traccar returned non-JSON for ${method} ${path}`)
  }
}

export interface ServerInfo {
  id?: number
  version?: string
  attributes?: Record<string, unknown>
}

export interface Device {
  id?: number
  name: string
  uniqueId?: string
  status?: string
  lastUpdate?: string
  groupId?: number
  phone?: string
  model?: string
  category?: string
  disabled?: boolean
}

export interface Position {
  id?: number
  deviceId?: number
  fixTime?: string
  deviceTime?: string
  serverTime?: string
  latitude?: number
  longitude?: number
  altitude?: number
  speed?: number
  course?: number
  address?: string
  accuracy?: number
  valid?: boolean
  outdated?: boolean
  protocol?: string
}

export interface Group {
  id?: number
  name: string
  groupId?: number
}

export interface Geofence {
  id?: number
  name: string
  description?: string
  area?: string
  calendarId?: number
}

export interface Driver {
  id?: number
  name: string
  uniqueId?: string
}

export interface Maintenance {
  id?: number
  name: string
  type?: string
  start?: string
  period?: number
}

export interface User {
  id?: number
  name?: string
  email?: string
  administrator?: boolean
  readOnly?: boolean
  deviceLimit?: number
  userLimit?: number
  expirationTime?: string
}

export interface CommandType {
  type: string
}

export interface ReportSummary {
  deviceId?: number
  deviceName?: string
  startTime?: string
  endTime?: string
  distance?: number
  averageSpeed?: number
  maxSpeed?: number
  spentFuel?: number
  engineHours?: number
}

export interface ReportTrip {
  deviceId?: number
  deviceName?: string
  startTime?: string
  endTime?: string
  startOdometer?: number
  endOdometer?: number
  distance?: number
  averageSpeed?: number
  maxSpeed?: number
  duration?: number
}

export interface ReportStop {
  deviceId?: number
  deviceName?: string
  startTime?: string
  endTime?: string
  address?: string
  duration?: number
  latitude?: number
  longitude?: number
}

export interface DeviceEvent {
  id?: number
  deviceId?: number
  type?: string
  eventTime?: string
  positionId?: number
  geofenceId?: number
  maintenanceId?: number
}

export function parseDevice(v: unknown): Device {
  const o = asObj(v)
  return {
    id: num(o.id),
    name: str(o.name) ?? `device ${num(o.id) ?? "?"}`,
    uniqueId: str(o.uniqueId),
    status: str(o.status),
    lastUpdate: str(o.lastUpdate),
    groupId: num(o.groupId),
    phone: str(o.phone),
    model: str(o.model),
    category: str(o.category),
    disabled: bool(o.disabled),
  }
}

export function parsePosition(v: unknown): Position {
  const o = asObj(v)
  return {
    id: num(o.id),
    deviceId: num(o.deviceId),
    fixTime: str(o.fixTime),
    deviceTime: str(o.deviceTime),
    serverTime: str(o.serverTime),
    latitude: num(o.latitude),
    longitude: num(o.longitude),
    altitude: num(o.altitude),
    speed: num(o.speed),
    course: num(o.course),
    address: str(o.address),
    accuracy: num(o.accuracy),
    valid: bool(o.valid),
    outdated: bool(o.outdated),
    protocol: str(o.protocol),
  }
}

function parseGroup(v: unknown): Group {
  const o = asObj(v)
  return {
    id: num(o.id),
    name: str(o.name) ?? `group ${num(o.id) ?? "?"}`,
    groupId: num(o.groupId),
  }
}

function parseGeofence(v: unknown): Geofence {
  const o = asObj(v)
  return {
    id: num(o.id),
    name: str(o.name) ?? `geofence ${num(o.id) ?? "?"}`,
    description: str(o.description),
    area: str(o.area),
    calendarId: num(o.calendarId),
  }
}

function parseDriver(v: unknown): Driver {
  const o = asObj(v)
  return {
    id: num(o.id),
    name: str(o.name) ?? `driver ${num(o.id) ?? "?"}`,
    uniqueId: str(o.uniqueId),
  }
}

function parseMaintenance(v: unknown): Maintenance {
  const o = asObj(v)
  return {
    id: num(o.id),
    name: str(o.name) ?? `maintenance ${num(o.id) ?? "?"}`,
    type: str(o.type),
    start: str(o.start),
    period: num(o.period),
  }
}

function parseUser(v: unknown): User {
  const o = asObj(v)
  return {
    id: num(o.id),
    name: str(o.name),
    email: str(o.email),
    administrator: bool(o.administrator),
    readOnly: bool(o.readonly),
    deviceLimit: num(o.deviceLimit),
    userLimit: num(o.userLimit),
    expirationTime: str(o.expirationTime),
  }
}

function parseServer(v: unknown): ServerInfo {
  const o = asObj(v)
  return {
    id: num(o.id),
    version: str(o.version),
    attributes: o.attributes !== null && typeof o.attributes === "object" ? asObj(o.attributes) : undefined,
  }
}

function parseCommandType(v: unknown): CommandType {
  const o = asObj(v)
  return { type: str(o.type) ?? "unknown" }
}

function parseSummary(v: unknown): ReportSummary {
  const o = asObj(v)
  return {
    deviceId: num(o.deviceId),
    deviceName: str(o.deviceName),
    startTime: str(o.startTime),
    endTime: str(o.endTime),
    distance: num(o.distance),
    averageSpeed: num(o.averageSpeed),
    maxSpeed: num(o.maxSpeed),
    spentFuel: num(o.spentFuel),
    engineHours: num(o.engineHours),
  }
}

function parseTrip(v: unknown): ReportTrip {
  const o = asObj(v)
  return {
    deviceId: num(o.deviceId),
    deviceName: str(o.deviceName),
    startTime: str(o.startTime),
    endTime: str(o.endTime),
    startOdometer: num(o.startOdometer),
    endOdometer: num(o.endOdometer),
    distance: num(o.distance),
    averageSpeed: num(o.averageSpeed),
    maxSpeed: num(o.maxSpeed),
    duration: num(o.duration),
  }
}

function parseStop(v: unknown): ReportStop {
  const o = asObj(v)
  return {
    deviceId: num(o.deviceId),
    deviceName: str(o.deviceName),
    startTime: str(o.startTime),
    endTime: str(o.endTime),
    address: str(o.address),
    duration: num(o.duration),
    latitude: num(o.latitude),
    longitude: num(o.longitude),
  }
}

function parseEvent(v: unknown): DeviceEvent {
  const o = asObj(v)
  return {
    id: num(o.id),
    deviceId: num(o.deviceId),
    type: str(o.type),
    eventTime: str(o.eventTime),
    positionId: num(o.positionId),
    geofenceId: num(o.geofenceId),
    maintenanceId: num(o.maintenanceId),
  }
}

/** Shared report window: `deviceId` or `groupId`, plus an ISO 8601 range. */
export interface ReportWindow {
  deviceId?: number
  groupId?: number
  from?: string
  to?: string
}

function windowQuery(w: ReportWindow): Query {
  return { deviceId: w.deviceId, groupId: w.groupId, from: w.from, to: w.to }
}

export async function getServer(): Promise<ServerInfo> {
  return parseServer(await request("GET", "/server"))
}

export async function getStatistics(): Promise<Record<string, unknown>> {
  return asObj(await request("GET", "/statistics"))
}

export async function getSession(): Promise<User> {
  return parseUser(await request("GET", "/session"))
}

export async function listDevices(): Promise<Device[]> {
  return asArr(await request("GET", "/devices")).map(parseDevice)
}

export async function createDevice(body: Record<string, unknown>): Promise<Device> {
  return parseDevice(await request("POST", "/devices", { body }))
}

export async function updateDevice(id: number, body: Record<string, unknown>): Promise<Device> {
  return parseDevice(await request("PUT", `/devices/${id}`, { body }))
}

export async function deleteDevice(id: number): Promise<void> {
  await request("DELETE", `/devices/${id}`)
}

export async function listPositions(query: {
  deviceId?: number
  from?: string
  to?: string
}): Promise<Position[]> {
  return asArr(
    await request("GET", "/positions", { query: { ...query } })
  ).map(parsePosition)
}

export async function listGroups(): Promise<Group[]> {
  return asArr(await request("GET", "/groups")).map(parseGroup)
}

export async function createGroup(body: Record<string, unknown>): Promise<Group> {
  return parseGroup(await request("POST", "/groups", { body }))
}

export async function updateGroup(id: number, body: Record<string, unknown>): Promise<Group> {
  return parseGroup(await request("PUT", `/groups/${id}`, { body }))
}

export async function deleteGroup(id: number): Promise<void> {
  await request("DELETE", `/groups/${id}`)
}

export async function listGeofences(): Promise<Geofence[]> {
  return asArr(await request("GET", "/geofences")).map(parseGeofence)
}

export async function createGeofence(body: Record<string, unknown>): Promise<Geofence> {
  return parseGeofence(await request("POST", "/geofences", { body }))
}

export async function updateGeofence(id: number, body: Record<string, unknown>): Promise<Geofence> {
  return parseGeofence(await request("PUT", `/geofences/${id}`, { body }))
}

export async function deleteGeofence(id: number): Promise<void> {
  await request("DELETE", `/geofences/${id}`)
}

export async function listDrivers(): Promise<Driver[]> {
  return asArr(await request("GET", "/drivers")).map(parseDriver)
}

export async function createDriver(body: Record<string, unknown>): Promise<Driver> {
  return parseDriver(await request("POST", "/drivers", { body }))
}

export async function updateDriver(id: number, body: Record<string, unknown>): Promise<Driver> {
  return parseDriver(await request("PUT", `/drivers/${id}`, { body }))
}

export async function deleteDriver(id: number): Promise<void> {
  await request("DELETE", `/drivers/${id}`)
}

export async function listMaintenance(): Promise<Maintenance[]> {
  return asArr(await request("GET", "/maintenance")).map(parseMaintenance)
}

export async function createMaintenance(body: Record<string, unknown>): Promise<Maintenance> {
  return parseMaintenance(await request("POST", "/maintenance", { body }))
}

export async function updateMaintenance(
  id: number,
  body: Record<string, unknown>
): Promise<Maintenance> {
  return parseMaintenance(await request("PUT", `/maintenance/${id}`, { body }))
}

export async function deleteMaintenance(id: number): Promise<void> {
  await request("DELETE", `/maintenance/${id}`)
}

export async function getReportSummary(w: ReportWindow): Promise<ReportSummary[]> {
  return asArr(await request("GET", "/reports/summary", { query: windowQuery(w) })).map(parseSummary)
}

export async function getReportTrips(w: ReportWindow): Promise<ReportTrip[]> {
  return asArr(await request("GET", "/reports/trips", { query: windowQuery(w) })).map(parseTrip)
}

export async function getReportStops(w: ReportWindow): Promise<ReportStop[]> {
  return asArr(await request("GET", "/reports/stops", { query: windowQuery(w) })).map(parseStop)
}

export async function getReportEvents(w: ReportWindow): Promise<DeviceEvent[]> {
  return asArr(await request("GET", "/reports/events", { query: windowQuery(w) })).map(parseEvent)
}

export async function getReportRoute(w: ReportWindow): Promise<Position[]> {
  return asArr(await request("GET", "/reports/route", { query: windowQuery(w) })).map(parsePosition)
}

export async function listCommandTypes(deviceId?: number): Promise<CommandType[]> {
  return asArr(await request("GET", "/commands/types", { query: { deviceId } })).map(parseCommandType)
}

export async function sendCommand(body: Record<string, unknown>): Promise<void> {
  await request("POST", "/commands/send", { body })
}

export async function listUsers(): Promise<User[]> {
  return asArr(await request("GET", "/users")).map(parseUser)
}

export async function createUser(body: Record<string, unknown>): Promise<User> {
  return parseUser(await request("POST", "/users", { body }))
}

export async function updateUser(id: number, body: Record<string, unknown>): Promise<User> {
  return parseUser(await request("PUT", `/users/${id}`, { body }))
}

export async function deleteUser(id: number): Promise<void> {
  await request("DELETE", `/users/${id}`)
}

function line(label: string, value: string | number | boolean | undefined): string | null {
  if (value === undefined || value === "") return null
  return `${label}: ${value}`
}

function block(lines: (string | null)[]): string {
  return lines.filter((l): l is string => l !== null).join("\n")
}

function speed(knots: number | undefined): string | undefined {
  return knots === undefined ? undefined : `${knots.toFixed(1)} kn`
}

function metres(m: number | undefined): string | undefined {
  return m === undefined ? undefined : `${Math.round(m)} m`
}

function coords(lat: number | undefined, lon: number | undefined): string | undefined {
  if (lat === undefined || lon === undefined) return undefined
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
}

export function formatServer(s: ServerInfo): string {
  return block([
    `Traccar server${s.id !== undefined ? ` #${s.id}` : ""}`,
    line("Version", s.version),
    s.attributes
      ? line("Attributes", Object.keys(s.attributes).slice(0, 12).join(", ") || "none")
      : null,
  ])
}

export function formatStatistics(stats: Record<string, unknown>): string {
  const keys = Object.keys(stats)
  if (keys.length === 0) return "Server statistics returned no values."
  return block([
    "Server statistics:",
    ...keys.slice(0, 30).map((k) => {
      const v = stats[k]
      return `  ${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`
    }),
  ])
}

export function formatUser(u: User, index?: number): string {
  const flags: string[] = []
  if (u.administrator) flags.push("admin")
  if (u.readOnly) flags.push("read-only")
  return block([
    `${index !== undefined ? `${index + 1}. ` : ""}${u.name ?? u.email ?? "user"}${u.id !== undefined ? ` (id ${u.id})` : ""}`,
    line("Email", u.email),
    line("Role", flags.length > 0 ? flags.join(", ") : "user"),
    line("Device limit", u.deviceLimit),
    line("User limit", u.userLimit),
    line("Expires", u.expirationTime),
  ])
}

export function formatDevice(d: Device, index?: number): string {
  return block([
    `${index !== undefined ? `${index + 1}. ` : ""}${d.name}${d.id !== undefined ? ` (id ${d.id})` : ""}`,
    line("Unique ID", d.uniqueId),
    line("Status", d.status),
    line("Group", d.groupId),
    line("Model", d.model),
    line("Phone", d.phone),
    line("Category", d.category),
    line("Last update", d.lastUpdate),
    d.disabled ? "Disabled: yes" : null,
  ])
}

export function formatPosition(p: Position, index?: number): string {
  const where = coords(p.latitude, p.longitude) ?? "no fix"
  return block([
    `${index !== undefined ? `${index + 1}. ` : ""}${where}${p.deviceId !== undefined ? ` · device ${p.deviceId}` : ""}`,
    line("Fix time", p.fixTime ?? p.deviceTime),
    line("Speed", speed(p.speed)),
    line("Course", p.course === undefined ? undefined : `${Math.round(p.course)}°`),
    line("Altitude", metres(p.altitude)),
    line("Accuracy", metres(p.accuracy)),
    line("Address", p.address),
    line("Protocol", p.protocol),
    p.valid === false ? "Fix valid: no" : null,
  ])
}

export function formatGroup(g: Group, index?: number): string {
  return block([
    `${index !== undefined ? `${index + 1}. ` : ""}${g.name}${g.id !== undefined ? ` (id ${g.id})` : ""}`,
    line("Parent group", g.groupId),
  ])
}

export function formatGeofence(g: Geofence, index?: number): string {
  return block([
    `${index !== undefined ? `${index + 1}. ` : ""}${g.name}${g.id !== undefined ? ` (id ${g.id})` : ""}`,
    line("Description", g.description),
    line("Area", g.area ? g.area.slice(0, 200) : undefined),
    line("Calendar", g.calendarId),
  ])
}

export function formatDriver(d: Driver, index?: number): string {
  return block([
    `${index !== undefined ? `${index + 1}. ` : ""}${d.name}${d.id !== undefined ? ` (id ${d.id})` : ""}`,
    line("Unique ID", d.uniqueId),
  ])
}

export function formatMaintenance(m: Maintenance, index?: number): string {
  return block([
    `${index !== undefined ? `${index + 1}. ` : ""}${m.name}${m.id !== undefined ? ` (id ${m.id})` : ""}`,
    line("Type", m.type),
    line("Start", m.start),
    line("Period", m.period === undefined ? undefined : `${m.period} m`),
  ])
}

export function formatCommandType(c: CommandType, index?: number): string {
  return `${index !== undefined ? `${index + 1}. ` : ""}${c.type}`
}

export function formatSummary(s: ReportSummary, index?: number): string {
  return block([
    `${index !== undefined ? `${index + 1}. ` : ""}${s.deviceName ?? `device ${s.deviceId ?? "?"}`}`,
    line("Window", [s.startTime, s.endTime].filter(Boolean).join(" → ") || undefined),
    line("Distance", metres(s.distance)),
    line("Average speed", speed(s.averageSpeed)),
    line("Max speed", speed(s.maxSpeed)),
    line("Engine hours", s.engineHours === undefined ? undefined : `${(s.engineHours / 3600000).toFixed(1)} h`),
    line("Fuel used", s.spentFuel === undefined ? undefined : `${s.spentFuel.toFixed(2)} L`),
  ])
}

export function formatTrip(t: ReportTrip, index?: number): string {
  return block([
    `${index !== undefined ? `${index + 1}. ` : ""}${t.deviceName ?? `device ${t.deviceId ?? "?"}`}`,
    line("Window", [t.startTime, t.endTime].filter(Boolean).join(" → ") || undefined),
    line("Distance", metres(t.distance)),
    line("Odometers", t.startOdometer === undefined || t.endOdometer === undefined
      ? undefined
      : `${Math.round(t.startOdometer)} → ${Math.round(t.endOdometer)}`),
    line("Average speed", speed(t.averageSpeed)),
    line("Max speed", speed(t.maxSpeed)),
    line("Duration", t.duration === undefined ? undefined : `${Math.round(t.duration / 60000)} min`),
  ])
}

export function formatStop(s: ReportStop, index?: number): string {
  return block([
    `${index !== undefined ? `${index + 1}. ` : ""}${s.address ?? coords(s.latitude, s.longitude) ?? "stop"}`,
    line("Device", s.deviceName ?? s.deviceId),
    line("Window", [s.startTime, s.endTime].filter(Boolean).join(" → ") || undefined),
    line("Duration", s.duration === undefined ? undefined : `${Math.round(s.duration / 60000)} min`),
  ])
}

export function formatEvent(e: DeviceEvent, index?: number): string {
  return block([
    `${index !== undefined ? `${index + 1}. ` : ""}${e.type ?? "event"}${e.deviceId !== undefined ? ` · device ${e.deviceId}` : ""}`,
    line("Time", e.eventTime),
    line("Geofence", e.geofenceId),
    line("Maintenance", e.maintenanceId),
    line("Position", e.positionId),
  ])
}
