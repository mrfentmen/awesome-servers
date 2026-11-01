const DEFAULT_BASE_URL = "https://api.edrv.io"

export class EdrvError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EdrvError"
  }
}

function baseUrl(): string {
  const raw = process.env.EDRV_BASE_URL?.trim() || DEFAULT_BASE_URL
  return raw.replace(/\/+$/, "")
}

function accessToken(): string {
  const token = process.env.EDRV_ACCESS_TOKEN?.trim()
  if (!token) {
    throw new EdrvError(
      "EDRV_ACCESS_TOKEN is not set. eDRV issues a bearer token from its OAuth2 client-credentials flow — create an API client in the eDRV dashboard and export the token."
    )
  }
  return token
}

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

interface RequestOptions {
  body?: unknown
}

/* ---------------------------------------------------------------- narrowing */

function asObj(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asArr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function field(value: unknown, key: string): unknown {
  const obj = asObj(value)
  return obj ? obj[key] : undefined
}

function pickStr(value: unknown, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const found = str(field(value, key))
    if (found !== undefined) return found
  }
  return undefined
}

function pickNum(value: unknown, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const found = num(field(value, key))
    if (found !== undefined) return found
  }
  return undefined
}

/** eDRV may answer with a bare array or wrap it in an envelope. */
function asList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  for (const key of ["data", "results", "items", "records", "list"]) {
    const inner = field(payload, key)
    if (Array.isArray(inner)) return inner
    const innerObj = asObj(inner)
    if (innerObj) {
      for (const value of Object.values(innerObj)) {
        if (Array.isArray(value)) return value
      }
    }
  }
  return []
}

/** A single resource may be wrapped in `{ data: {...} }`. */
function unwrap(payload: unknown): unknown {
  const inner = field(payload, "data")
  return asObj(inner) ? inner : payload
}

/* ------------------------------------------------------------------- models */

export interface ChargeStation {
  id: string
  name?: string
  status?: string
  serialNumber?: string
  locationId?: string
  connectorCount?: number
  lastSeen?: string
}

export interface Connector {
  id: string
  chargeStationId?: string
  name?: string
  status?: string
  connectorType?: string
  power?: number
  maxCurrent?: number
  voltage?: number
}

export interface Command {
  id: string
  type?: string
  status?: string
  chargeStationId?: string
  connectorId?: string
  createdAt?: string
  result?: string
}

export interface Transaction {
  id: string
  chargeStationId?: string
  connectorId?: string
  driverId?: string
  status?: string
  startedAt?: string
  stoppedAt?: string
  energy?: number
  cost?: number
  currency?: string
}

export interface Reservation {
  id: string
  chargeStationId?: string
  connectorId?: string
  driverId?: string
  status?: string
  startDate?: string
  endDate?: string
}

export interface Location {
  id: string
  name?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  latitude?: number
  longitude?: number
  timeZone?: string
}

export interface Driver {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  status?: string
}

export interface Vehicle {
  id: string
  make?: string
  model?: string
  vin?: string
  batteryLevel?: number
  range?: number
  odometer?: number
  chargeStatus?: string
}

export interface Organization {
  id: string
  name?: string
  status?: string
}

export interface Token {
  id: string
  name?: string
  tokenType?: string
  status?: string
  expiresAt?: string
}

function parseChargeStation(value: unknown): ChargeStation {
  return {
    id: pickStr(value, "id", "_id") ?? "",
    name: pickStr(value, "name", "label"),
    status: pickStr(value, "status", "state"),
    serialNumber: pickStr(value, "serialNumber", "serial"),
    locationId: pickStr(value, "locationId", "location"),
    connectorCount: pickNum(value, "connectorCount", "connectorsCount"),
    lastSeen: pickStr(value, "lastSeen", "lastSeenAt", "updatedAt"),
  }
}

function parseConnector(value: unknown): Connector {
  return {
    id: pickStr(value, "id", "_id") ?? "",
    chargeStationId: pickStr(value, "chargeStationId", "chargestationId", "stationId"),
    name: pickStr(value, "name", "label"),
    status: pickStr(value, "status", "state"),
    connectorType: pickStr(value, "connectorType", "type", "standard"),
    power: pickNum(value, "power", "powerKw", "maxPower"),
    maxCurrent: pickNum(value, "maxCurrent", "amperage"),
    voltage: pickNum(value, "voltage"),
  }
}

function parseCommand(value: unknown): Command {
  return {
    id: pickStr(value, "id", "_id") ?? "",
    type: pickStr(value, "type", "command", "name"),
    status: pickStr(value, "status", "state"),
    chargeStationId: pickStr(value, "chargeStationId", "chargestationId", "stationId"),
    connectorId: pickStr(value, "connectorId"),
    createdAt: pickStr(value, "createdAt", "created"),
    result: pickStr(value, "result", "message"),
  }
}

function parseTransaction(value: unknown): Transaction {
  return {
    id: pickStr(value, "id", "_id") ?? "",
    chargeStationId: pickStr(value, "chargeStationId", "chargestationId", "stationId"),
    connectorId: pickStr(value, "connectorId"),
    driverId: pickStr(value, "driverId"),
    status: pickStr(value, "status", "state"),
    startedAt: pickStr(value, "startedAt", "startDate", "start"),
    stoppedAt: pickStr(value, "stoppedAt", "stopDate", "end"),
    energy: pickNum(value, "energy", "energyKwh", "consumedKwh"),
    cost: pickNum(value, "cost", "totalCost", "amount"),
    currency: pickStr(value, "currency"),
  }
}

function parseReservation(value: unknown): Reservation {
  return {
    id: pickStr(value, "id", "_id") ?? "",
    chargeStationId: pickStr(value, "chargeStationId", "chargestationId", "stationId"),
    connectorId: pickStr(value, "connectorId"),
    driverId: pickStr(value, "driverId"),
    status: pickStr(value, "status", "state"),
    startDate: pickStr(value, "startDate", "start", "startsAt"),
    endDate: pickStr(value, "endDate", "end", "expiresAt"),
  }
}

function parseLocation(value: unknown): Location {
  return {
    id: pickStr(value, "id", "_id") ?? "",
    name: pickStr(value, "name", "label"),
    address: pickStr(value, "address", "street"),
    city: pickStr(value, "city", "town"),
    postalCode: pickStr(value, "postalCode", "zip"),
    country: pickStr(value, "country", "countryCode"),
    latitude: pickNum(value, "latitude", "lat"),
    longitude: pickNum(value, "longitude", "lng", "lon"),
    timeZone: pickStr(value, "timeZone", "timezone"),
  }
}

function parseDriver(value: unknown): Driver {
  return {
    id: pickStr(value, "id", "_id") ?? "",
    firstName: pickStr(value, "firstName", "firstname"),
    lastName: pickStr(value, "lastName", "lastname"),
    email: pickStr(value, "email"),
    phone: pickStr(value, "phone", "phoneNumber"),
    status: pickStr(value, "status", "state"),
  }
}

function parseVehicle(value: unknown): Vehicle {
  return {
    id: pickStr(value, "id", "_id") ?? "",
    make: pickStr(value, "make", "brand"),
    model: pickStr(value, "model"),
    vin: pickStr(value, "vin"),
    batteryLevel: pickNum(value, "batteryLevel", "soc"),
    range: pickNum(value, "range", "rangeKm"),
    odometer: pickNum(value, "odometer", "mileage"),
    chargeStatus: pickStr(value, "chargeStatus", "chargingState", "status"),
  }
}

function parseOrganization(value: unknown): Organization {
  return {
    id: pickStr(value, "id", "_id") ?? "",
    name: pickStr(value, "name", "label"),
    status: pickStr(value, "status", "state"),
  }
}

function parseToken(value: unknown): Token {
  return {
    id: pickStr(value, "id", "_id") ?? "",
    name: pickStr(value, "name", "label"),
    tokenType: pickStr(value, "tokenType", "type"),
    status: pickStr(value, "status", "state"),
    expiresAt: pickStr(value, "expiresAt", "expires"),
  }
}

/* ------------------------------------------------------------------- client */

function errorDetail(raw: string, statusText: string): string {
  const trimmed = raw.trim()
  if (trimmed === "") return statusText
  try {
    const body = asObj(JSON.parse(trimmed) as unknown)
    if (body) {
      const message = str(body.message) ?? str(body.error) ?? str(body.detail)
      if (message) return firstLine(message)
    }
  } catch {
    // Not JSON — fall through and use the raw text.
  }
  return firstLine(trimmed)
}

function firstLine(value: string): string {
  const line = value.split("\n")[0].trim()
  return line.length > 200 ? `${line.slice(0, 200)}…` : line
}

async function request(method: HttpMethod, path: string, opts: RequestOptions = {}): Promise<unknown> {
  const url = new URL(`${baseUrl()}${path}`)
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken()}`,
    Accept: "application/json",
  }
  if (opts.body !== undefined) headers["Content-Type"] = "application/json"

  let res: Awaited<ReturnType<typeof fetch>>
  try {
    res = await fetch(url, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    throw new EdrvError(`Cannot reach eDRV at ${baseUrl()}: ${detail}`)
  }

  const raw = await res.text()
  if (!res.ok) {
    throw new EdrvError(`eDRV ${res.status} on ${method} ${path}: ${errorDetail(raw, res.statusText)}`)
  }
  if (raw.trim() === "") return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    throw new EdrvError(`eDRV returned a non-JSON body for ${method} ${path}`)
  }
}

function requireId(id: string): string {
  const trimmed = id.trim()
  if (trimmed === "") throw new EdrvError("An id is required.")
  return encodeURIComponent(trimmed)
}

function commandBody(id: string, payload: Record<string, unknown> | undefined): Record<string, unknown> {
  // The spec does not pin the command body shape: the target id and any
  // protocol-specific fields are forwarded unchanged.
  return { ...(payload ?? {}), id }
}

/* ----------------------------------------------------------------- chargers */

export async function listChargeStations(): Promise<ChargeStation[]> {
  const payload = await request("GET", "/v1/chargestations")
  return asList(payload).map(parseChargeStation).filter((s) => s.id !== "")
}

export async function createChargeStation(body: Record<string, unknown>): Promise<ChargeStation> {
  return parseChargeStation(unwrap(await request("POST", "/v1/chargestations", { body })))
}

export async function getChargeStation(id: string): Promise<ChargeStation> {
  return parseChargeStation(unwrap(await request("GET", `/v1/chargestations/${requireId(id)}`)))
}

export async function updateChargeStation(id: string, body: Record<string, unknown>): Promise<ChargeStation> {
  return parseChargeStation(unwrap(await request("PATCH", `/v1/chargestations/${requireId(id)}`, { body })))
}

export async function deleteChargeStation(id: string): Promise<void> {
  await request("DELETE", `/v1/chargestations/${requireId(id)}`)
}

export async function listChargeStationConnectors(id: string): Promise<Connector[]> {
  const payload = await request("GET", `/v1/chargestations/${requireId(id)}/connectors`)
  return asList(payload).map(parseConnector).filter((c) => c.id !== "")
}

/* ---------------------------------------------------------------- connectors */

export async function listConnectors(): Promise<Connector[]> {
  const payload = await request("GET", "/v1/connectors")
  return asList(payload).map(parseConnector).filter((c) => c.id !== "")
}

export async function getConnector(id: string): Promise<Connector> {
  return parseConnector(unwrap(await request("GET", `/v1/connectors/${requireId(id)}`)))
}

export async function updateConnector(id: string, body: Record<string, unknown>): Promise<Connector> {
  return parseConnector(unwrap(await request("PATCH", `/v1/connectors/${requireId(id)}`, { body })))
}

/* ------------------------------------------------------------------ commands */

export async function sendRemoteStart(id: string, payload?: Record<string, unknown>): Promise<Command> {
  return parseCommand(unwrap(await request("POST", "/v1/commands/remotestart", { body: commandBody(id, payload) })))
}

export async function sendRemoteStop(id: string, payload?: Record<string, unknown>): Promise<Command> {
  return parseCommand(unwrap(await request("POST", "/v1/commands/remotestop", { body: commandBody(id, payload) })))
}

export async function resetCharger(id: string, payload?: Record<string, unknown>): Promise<Command> {
  return parseCommand(unwrap(await request("POST", "/v1/commands/reset", { body: commandBody(id, payload) })))
}

export async function unlockConnector(id: string, payload?: Record<string, unknown>): Promise<Command> {
  return parseCommand(unwrap(await request("POST", "/v1/commands/unlockconnector", { body: commandBody(id, payload) })))
}

export async function reserveConnector(id: string, payload?: Record<string, unknown>): Promise<Command> {
  return parseCommand(unwrap(await request("POST", "/v1/commands/reserve", { body: commandBody(id, payload) })))
}

export async function cancelReservation(id: string, payload?: Record<string, unknown>): Promise<Command> {
  return parseCommand(unwrap(await request("POST", "/v1/commands/cancelreservation", { body: commandBody(id, payload) })))
}

export async function listCommands(): Promise<Command[]> {
  const payload = await request("GET", "/v1/commands")
  return asList(payload).map(parseCommand).filter((c) => c.id !== "")
}

/* -------------------------------------------------------------- transactions */

export async function listTransactions(): Promise<Transaction[]> {
  const payload = await request("GET", "/v1/transactions")
  return asList(payload).map(parseTransaction).filter((t) => t.id !== "")
}

export async function getTransaction(id: string): Promise<Transaction> {
  return parseTransaction(unwrap(await request("GET", `/v1/transactions/${requireId(id)}`)))
}

export async function getTransactionCost(id: string): Promise<unknown> {
  return unwrap(await request("GET", `/v1/transactions/${requireId(id)}/cost`))
}

/* -------------------------------------------------------------- reservations */

export async function listReservations(): Promise<Reservation[]> {
  const payload = await request("GET", "/v1/reservations")
  return asList(payload).map(parseReservation).filter((r) => r.id !== "")
}

/* ----------------------------------------------------------------- locations */

export async function listLocations(): Promise<Location[]> {
  const payload = await request("GET", "/v1/locations")
  return asList(payload).map(parseLocation).filter((l) => l.id !== "")
}

export async function getLocation(id: string): Promise<Location> {
  // The spec exposes this resource as the singular `/location/{id}`.
  return parseLocation(unwrap(await request("GET", `/v1/location/${requireId(id)}`)))
}

export async function createLocation(body: Record<string, unknown>): Promise<Location> {
  return parseLocation(unwrap(await request("POST", "/v1/locations", { body })))
}

export async function deleteLocation(id: string): Promise<void> {
  await request("DELETE", `/v1/location/${requireId(id)}`)
}

/* ------------------------------------------------------------------- drivers */

export async function listDrivers(): Promise<Driver[]> {
  const payload = await request("GET", "/v1/drivers")
  return asList(payload).map(parseDriver).filter((d) => d.id !== "")
}

/* ------------------------------------------------------------------ vehicles */

export async function listVehicles(): Promise<Vehicle[]> {
  const payload = await request("GET", "/v1/vehicles")
  return asList(payload).map(parseVehicle).filter((v) => v.id !== "")
}

export async function getVehicleBattery(id: string): Promise<unknown> {
  return unwrap(await request("GET", `/v1/vehicles/${requireId(id)}/battery`))
}

export async function startVehicleCharge(id: string): Promise<unknown> {
  return unwrap(await request("POST", `/v1/vehicles/${requireId(id)}/charge`))
}

export async function getVehicleLocation(id: string): Promise<unknown> {
  return unwrap(await request("GET", `/v1/vehicles/${requireId(id)}/location`))
}

/* ------------------------------------------------------------ organizations */

export async function listOrganizations(): Promise<Organization[]> {
  const payload = await request("GET", "/v1/organizations")
  return asList(payload).map(parseOrganization).filter((o) => o.id !== "")
}

export async function listTokens(): Promise<Token[]> {
  const payload = await request("GET", "/v1/tokens")
  return asList(payload).map(parseToken).filter((t) => t.id !== "")
}

export async function getRealtime(): Promise<unknown> {
  return unwrap(await request("GET", "/v1/realtime"))
}

/* ---------------------------------------------------------------- formatters */

function head(label: string | undefined, id: string, index?: number): string {
  const name = label ?? id
  return index === undefined ? name : `${index + 1}. ${name}`
}

export function formatChargeStation(station: ChargeStation, index?: number): string {
  const parts = [head(station.name, station.id, index)]
  if (station.status) parts.push(`status ${station.status}`)
  if (station.connectorCount !== undefined) parts.push(`${station.connectorCount} connector(s)`)
  if (station.serialNumber) parts.push(`serial ${station.serialNumber}`)
  if (station.locationId) parts.push(`location ${station.locationId}`)
  if (station.lastSeen) parts.push(`last seen ${station.lastSeen}`)
  parts.push(`id ${station.id}`)
  return parts.join(" · ")
}

export function formatConnector(connector: Connector, index?: number): string {
  const parts = [head(connector.name, connector.id, index)]
  if (connector.status) parts.push(`status ${connector.status}`)
  if (connector.connectorType) parts.push(connector.connectorType)
  if (connector.power !== undefined) parts.push(`${connector.power} kW`)
  if (connector.maxCurrent !== undefined) parts.push(`${connector.maxCurrent} A`)
  if (connector.voltage !== undefined) parts.push(`${connector.voltage} V`)
  if (connector.chargeStationId) parts.push(`station ${connector.chargeStationId}`)
  parts.push(`id ${connector.id}`)
  return parts.join(" · ")
}

export function formatCommand(command: Command, index?: number): string {
  const parts = [head(command.type, command.id, index)]
  if (command.status) parts.push(`status ${command.status}`)
  if (command.chargeStationId) parts.push(`station ${command.chargeStationId}`)
  if (command.connectorId) parts.push(`connector ${command.connectorId}`)
  if (command.createdAt) parts.push(`created ${command.createdAt}`)
  if (command.result) parts.push(command.result)
  parts.push(`id ${command.id}`)
  return parts.join(" · ")
}

export function formatTransaction(tx: Transaction, index?: number): string {
  const parts = [head(undefined, tx.id, index)]
  if (tx.status) parts.push(`status ${tx.status}`)
  if (tx.energy !== undefined) parts.push(`${tx.energy} kWh`)
  if (tx.cost !== undefined) parts.push(`${tx.cost} ${tx.currency ?? ""}`.trim())
  if (tx.startedAt) parts.push(`started ${tx.startedAt}`)
  if (tx.stoppedAt) parts.push(`stopped ${tx.stoppedAt}`)
  if (tx.chargeStationId) parts.push(`station ${tx.chargeStationId}`)
  if (tx.connectorId) parts.push(`connector ${tx.connectorId}`)
  if (tx.driverId) parts.push(`driver ${tx.driverId}`)
  return parts.join(" · ")
}

export function formatReservation(reservation: Reservation, index?: number): string {
  const parts = [head(undefined, reservation.id, index)]
  if (reservation.status) parts.push(`status ${reservation.status}`)
  if (reservation.startDate) parts.push(`from ${reservation.startDate}`)
  if (reservation.endDate) parts.push(`to ${reservation.endDate}`)
  if (reservation.chargeStationId) parts.push(`station ${reservation.chargeStationId}`)
  if (reservation.connectorId) parts.push(`connector ${reservation.connectorId}`)
  if (reservation.driverId) parts.push(`driver ${reservation.driverId}`)
  return parts.join(" · ")
}

export function formatLocation(location: Location, index?: number): string {
  const parts = [head(location.name, location.id, index)]
  const address = [location.address, location.city, location.postalCode, location.country]
    .filter((part): part is string => part !== undefined)
    .join(", ")
  if (address !== "") parts.push(address)
  if (location.latitude !== undefined && location.longitude !== undefined) {
    parts.push(`${location.latitude}, ${location.longitude}`)
  }
  if (location.timeZone) parts.push(location.timeZone)
  parts.push(`id ${location.id}`)
  return parts.join(" · ")
}

export function formatDriver(driver: Driver, index?: number): string {
  const name = [driver.firstName, driver.lastName]
    .filter((part): part is string => part !== undefined)
    .join(" ")
  const parts = [head(name === "" ? undefined : name, driver.id, index)]
  if (driver.email) parts.push(driver.email)
  if (driver.phone) parts.push(driver.phone)
  if (driver.status) parts.push(`status ${driver.status}`)
  parts.push(`id ${driver.id}`)
  return parts.join(" · ")
}

export function formatVehicle(vehicle: Vehicle, index?: number): string {
  const model = [vehicle.make, vehicle.model]
    .filter((part): part is string => part !== undefined)
    .join(" ")
  const parts = [head(model === "" ? undefined : model, vehicle.id, index)]
  if (vehicle.batteryLevel !== undefined) parts.push(`battery ${vehicle.batteryLevel}%`)
  if (vehicle.range !== undefined) parts.push(`range ${vehicle.range} km`)
  if (vehicle.odometer !== undefined) parts.push(`${vehicle.odometer} km`)
  if (vehicle.chargeStatus) parts.push(`charging ${vehicle.chargeStatus}`)
  if (vehicle.vin) parts.push(`VIN ${vehicle.vin}`)
  parts.push(`id ${vehicle.id}`)
  return parts.join(" · ")
}

export function formatOrganization(org: Organization, index?: number): string {
  const parts = [head(org.name, org.id, index)]
  if (org.status) parts.push(`status ${org.status}`)
  parts.push(`id ${org.id}`)
  return parts.join(" · ")
}

export function formatToken(token: Token, index?: number): string {
  const parts = [head(token.name, token.id, index)]
  if (token.tokenType) parts.push(token.tokenType)
  if (token.status) parts.push(`status ${token.status}`)
  if (token.expiresAt) parts.push(`expires ${token.expiresAt}`)
  parts.push(`id ${token.id}`)
  return parts.join(" · ")
}

/** Render an untyped payload (costs, battery, location, realtime) as key/value lines. */
export function formatFlat(title: string, payload: unknown): string {
  const obj = asObj(payload)
  if (!obj) {
    const list = asArr(payload)
    if (list.length > 0) return [title, ...list.map((item, i) => `${i + 1}. ${String(item)}`)].join("\n")
    return `${title}: ${String(payload)}`
  }

  const lines: string[] = [title]
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue
    if (typeof value === "object") {
      lines.push(`  ${key}: ${JSON.stringify(value)}`)
    } else {
      lines.push(`  ${key}: ${String(value)}`)
    }
  }
  return lines.length === 1 ? `${title}: (empty)` : lines.join("\n")
}
