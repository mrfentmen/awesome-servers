import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"
import {
  EdrvError,
  cancelReservation,
  createChargeStation,
  createLocation,
  deleteChargeStation,
  deleteLocation,
  formatChargeStation,
  formatCommand,
  formatConnector,
  formatDriver,
  formatFlat,
  formatLocation,
  formatOrganization,
  formatReservation,
  formatToken,
  formatTransaction,
  formatVehicle,
  getChargeStation,
  getConnector,
  getLocation,
  getRealtime,
  getTransaction,
  getTransactionCost,
  getVehicleBattery,
  getVehicleLocation,
  listChargeStationConnectors,
  listChargeStations,
  listCommands,
  listConnectors,
  listDrivers,
  listLocations,
  listOrganizations,
  listReservations,
  listTokens,
  listTransactions,
  listVehicles,
  resetCharger,
  reserveConnector,
  sendRemoteStart,
  sendRemoteStop,
  startVehicleCharge,
  unlockConnector,
  updateChargeStation,
  updateConnector,
} from "./api.js"

function text(body: string): CallToolResult {
  return { content: [{ type: "text", text: body }] }
}

function fail(message: string): CallToolResult {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true }
}

function errorMessage(e: unknown): string {
  if (e instanceof EdrvError) return e.message
  if (e instanceof Error) return e.message
  return String(e)
}

const idField = z.string().min(1).describe("eDRV resource id")
const payloadField = z
  .record(z.unknown())
  .optional()
  .describe("Protocol-specific command fields forwarded to eDRV unchanged")

export function createServer(): McpServer {
  const server = new McpServer({ name: "edrv-mcp", version: "1.0.0" })

  /* ------------------------------------------------------------ chargers */

  server.tool(
    "list_chargestations",
    "List every charge station on the eDRV account with its status, serial number and connector count.",
    {},
    async () => {
      try {
        const stations = await listChargeStations()
        if (stations.length === 0) return text("No charge stations found.")
        return text(stations.map((s, i) => formatChargeStation(s, i)).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_chargestation",
    "Register a new charge station. The body is an eDRV charge-station object and is sent unchanged.",
    { body: z.record(z.unknown()).describe("eDRV charge station JSON body") },
    async ({ body }) => {
      try {
        return text(`Created charge station.\n${formatChargeStation(await createChargeStation(body))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_chargestation",
    "Fetch one charge station by id, including its status and last-seen timestamp.",
    { id: idField },
    async ({ id }) => {
      try {
        return text(formatChargeStation(await getChargeStation(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_chargestation",
    "Patch a charge station. Only the fields present in the body are changed.",
    { id: idField, body: z.record(z.unknown()).describe("Fields to patch on the charge station") },
    async ({ id, body }) => {
      try {
        return text(`Updated charge station.\n${formatChargeStation(await updateChargeStation(id, body))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_chargestation",
    "Permanently delete a charge station from the account. Destructive and cannot be undone.",
    { id: idField },
    async ({ id }) => {
      try {
        await deleteChargeStation(id)
        return text(`Deleted charge station ${id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_chargestation_connectors",
    "List the connectors attached to one charge station, with status, type and power.",
    { id: idField },
    async ({ id }) => {
      try {
        const connectors = await listChargeStationConnectors(id)
        if (connectors.length === 0) return text(`Charge station ${id} has no connectors.`)
        return text(connectors.map((c, i) => formatConnector(c, i)).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* ---------------------------------------------------------- connectors */

  server.tool(
    "list_connectors",
    "List every connector across the account with its charge station, status and power rating.",
    {},
    async () => {
      try {
        const connectors = await listConnectors()
        if (connectors.length === 0) return text("No connectors found.")
        return text(connectors.map((c, i) => formatConnector(c, i)).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_connector",
    "Fetch a single connector by id with its type, status, power, current and voltage.",
    { id: idField },
    async ({ id }) => {
      try {
        return text(formatConnector(await getConnector(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_connector",
    "Patch a connector's configuration. Only the fields present in the body are changed.",
    { id: idField, body: z.record(z.unknown()).describe("Fields to patch on the connector") },
    async ({ id, body }) => {
      try {
        return text(`Updated connector.\n${formatConnector(await updateConnector(id, body))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* ------------------------------------------------------------ commands */

  server.tool(
    "remote_start",
    "Start a charging session on physical hardware. This sends a real OCPP command to the charger.",
    { id: idField, payload: payloadField },
    async ({ id, payload }) => {
      try {
        return text(`Remote start sent.\n${formatCommand(await sendRemoteStart(id, payload))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "remote_stop",
    "Stop an active charging session on physical hardware. This sends a real OCPP command to the charger.",
    { id: idField, payload: payloadField },
    async ({ id, payload }) => {
      try {
        return text(`Remote stop sent.\n${formatCommand(await sendRemoteStop(id, payload))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "reset_charger",
    "Reset a charge station. This interrupts any session on the hardware, so use it deliberately.",
    { id: idField, payload: payloadField },
    async ({ id, payload }) => {
      try {
        return text(`Reset sent.\n${formatCommand(await resetCharger(id, payload))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "unlock_connector",
    "Unlock a connector's cable lock so the plug can be removed from the vehicle.",
    { id: idField, payload: payloadField },
    async ({ id, payload }) => {
      try {
        return text(`Unlock sent.\n${formatCommand(await unlockConnector(id, payload))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "reserve_connector",
    "Reserve a connector for a driver so nobody else can start a session on it.",
    { id: idField, payload: payloadField },
    async ({ id, payload }) => {
      try {
        return text(`Reservation sent.\n${formatCommand(await reserveConnector(id, payload))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cancel_reservation",
    "Cancel an existing connector reservation and release it back to the pool.",
    { id: idField, payload: payloadField },
    async ({ id, payload }) => {
      try {
        return text(`Reservation cancelled.\n${formatCommand(await cancelReservation(id, payload))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_commands",
    "List command history with each command's type, status and target charger.",
    {},
    async () => {
      try {
        const commands = await listCommands()
        if (commands.length === 0) return text("No commands found.")
        return text(commands.map((c, i) => formatCommand(c, i)).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* -------------------------------------------------------- transactions */

  server.tool(
    "list_transactions",
    "List charging transactions with energy delivered, cost, status and timestamps.",
    {},
    async () => {
      try {
        const transactions = await listTransactions()
        if (transactions.length === 0) return text("No transactions found.")
        return text(transactions.map((t, i) => formatTransaction(t, i)).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_transaction",
    "Fetch one charging transaction by id with its energy, cost and session window.",
    { id: idField },
    async ({ id }) => {
      try {
        return text(formatTransaction(await getTransaction(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_transaction_cost",
    "Fetch the computed cost breakdown for one transaction.",
    { id: idField },
    async ({ id }) => {
      try {
        return text(formatFlat(`Cost of transaction ${id}`, await getTransactionCost(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* -------------------------------------------------------- reservations */

  server.tool(
    "list_reservations",
    "List connector reservations with their status, window, charger and driver.",
    {},
    async () => {
      try {
        const reservations = await listReservations()
        if (reservations.length === 0) return text("No reservations found.")
        return text(reservations.map((r, i) => formatReservation(r, i)).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* ----------------------------------------------------------- locations */

  server.tool(
    "list_locations",
    "List charging locations with their address and coordinates.",
    {},
    async () => {
      try {
        const locations = await listLocations()
        if (locations.length === 0) return text("No locations found.")
        return text(locations.map((l, i) => formatLocation(l, i)).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_location",
    "Fetch one charging location by id with its address, coordinates and time zone.",
    { id: idField },
    async ({ id }) => {
      try {
        return text(formatLocation(await getLocation(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_location",
    "Create a charging location. The body is an eDRV location object and is sent unchanged.",
    { body: z.record(z.unknown()).describe("eDRV location JSON body") },
    async ({ body }) => {
      try {
        return text(`Created location.\n${formatLocation(await createLocation(body))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_location",
    "Permanently delete a charging location. Destructive and cannot be undone.",
    { id: idField },
    async ({ id }) => {
      try {
        await deleteLocation(id)
        return text(`Deleted location ${id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* ------------------------------------------------------------- drivers */

  server.tool(
    "list_drivers",
    "List drivers registered on the account with their contact details and status.",
    {},
    async () => {
      try {
        const drivers = await listDrivers()
        if (drivers.length === 0) return text("No drivers found.")
        return text(drivers.map((d, i) => formatDriver(d, i)).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* ------------------------------------------------------------ vehicles */

  server.tool(
    "list_vehicles",
    "List connected vehicles with make, model, battery level, range and odometer.",
    {},
    async () => {
      try {
        const vehicles = await listVehicles()
        if (vehicles.length === 0) return text("No vehicles found.")
        return text(vehicles.map((v, i) => formatVehicle(v, i)).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_vehicle_battery",
    "Read one vehicle's live battery state of charge and range.",
    { id: idField },
    async ({ id }) => {
      try {
        return text(formatFlat(`Battery of vehicle ${id}`, await getVehicleBattery(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "start_vehicle_charge",
    "Ask a connected vehicle to begin charging at its current location.",
    { id: idField },
    async ({ id }) => {
      try {
        return text(formatFlat(`Charge started for vehicle ${id}`, await startVehicleCharge(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_vehicle_location",
    "Read one vehicle's last known location.",
    { id: idField },
    async ({ id }) => {
      try {
        return text(formatFlat(`Location of vehicle ${id}`, await getVehicleLocation(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  /* ------------------------------------------------------- organizations */

  server.tool(
    "list_organizations",
    "List the organizations the current token can see.",
    {},
    async () => {
      try {
        const orgs = await listOrganizations()
        if (orgs.length === 0) return text("No organizations found.")
        return text(orgs.map((o, i) => formatOrganization(o, i)).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_tokens",
    "List RFID and app tokens issued on the account with their type and expiry.",
    {},
    async () => {
      try {
        const tokens = await listTokens()
        if (tokens.length === 0) return text("No tokens found.")
        return text(tokens.map((t, i) => formatToken(t, i)).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_realtime",
    "Read the live realtime snapshot: current charging activity across the account.",
    {},
    async () => {
      try {
        return text(formatFlat("Realtime snapshot", await getRealtime()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
