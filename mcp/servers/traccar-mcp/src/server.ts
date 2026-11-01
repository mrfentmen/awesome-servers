import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  TraccarError,
  createDevice,
  createDriver,
  createGeofence,
  createGroup,
  createMaintenance,
  createUser,
  deleteDevice,
  deleteDriver,
  deleteGeofence,
  deleteGroup,
  deleteMaintenance,
  deleteUser,
  formatCommandType,
  formatDevice,
  formatDriver,
  formatEvent,
  formatGeofence,
  formatGroup,
  formatMaintenance,
  formatPosition,
  formatServer,
  formatStatistics,
  formatStop,
  formatSummary,
  formatTrip,
  formatUser,
  getReportEvents,
  getReportRoute,
  getReportStops,
  getReportSummary,
  getReportTrips,
  getServer,
  getSession,
  getStatistics,
  listCommandTypes,
  listDevices,
  listDrivers,
  listGeofences,
  listGroups,
  listMaintenance,
  listPositions,
  listUsers,
  sendCommand,
  updateDevice,
  updateDriver,
  updateGeofence,
  updateGroup,
  updateMaintenance,
  updateUser,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function render<T>(items: T[], fmt: (item: T, index: number) => string, empty: string): string {
  if (items.length === 0) return empty
  return items.map((item, i) => fmt(item, i)).join("\n\n")
}

/** Traccar entities are passed through untouched — field names live in its docs. */
const entity = z.record(z.unknown())

export function createServer(): McpServer {
  const server = new McpServer({
    name: "traccar-mcp",
    version: "1.0.0",
  })

  server.tool(
    "get_server_info",
    "Read Traccar server identity and version. Use it to check the base URL and credentials work.",
    {},
    async () => {
      try {
        return text(formatServer(await getServer()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_server_statistics",
    "Read live server statistics: connected devices, active sessions and message counters.",
    {},
    async () => {
      try {
        return text(formatStatistics(await getStatistics()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_session",
    "Show the Traccar user the configured credentials belong to, including their role and limits.",
    {},
    async () => {
      try {
        return text(formatUser(await getSession()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_devices",
    "List every GPS device the account can see, with status and last update time.",
    {},
    async () => {
      try {
        return text(render(await listDevices(), formatDevice, "No devices on this Traccar server."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_device",
    "Register a new device. Body is a Traccar device object, e.g. " +
      '{ "name": "Van", "uniqueId": "123456789012345" }.',
    { device: entity.describe("Traccar device JSON (name and uniqueId are required by the server)") },
    async ({ device }) => {
      try {
        return text(`Created device:\n\n${formatDevice(await createDevice(device))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_device",
    "Update an existing device. Only the fields present in the body are changed by Traccar.",
    {
      id: z.number().int().positive().describe("Device id"),
      device: entity.describe("Fields to change, as Traccar device JSON"),
    },
    async ({ id, device }) => {
      try {
        return text(`Updated device:\n\n${formatDevice(await updateDevice(id, device))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_device",
    "DESTRUCTIVE: permanently delete a device and its stored positions.",
    { id: z.number().int().positive().describe("Device id") },
    async ({ id }) => {
      try {
        await deleteDevice(id)
        return text(`Deleted device ${id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_positions",
    "List recent GPS positions, newest first. Filter by device and an ISO 8601 time range.",
    {
      deviceId: z.number().int().positive().optional().describe("Only this device"),
      from: z.string().optional().describe("Start of the range, ISO 8601 e.g. 2025-01-31T00:00:00Z"),
      to: z.string().optional().describe("End of the range, ISO 8601"),
    },
    async ({ deviceId, from, to }) => {
      try {
        const positions = await listPositions({ deviceId, from, to })
        return text(
          render(positions, formatPosition, "No positions in that range.")
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_groups",
    "List device groups, used to share devices and reports between users.",
    {},
    async () => {
      try {
        return text(render(await listGroups(), formatGroup, "No groups defined."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_group",
    "Create a device group. Body is Traccar group JSON, e.g. { \"name\": \"Delivery\" }.",
    { group: entity.describe("Traccar group JSON") },
    async ({ group }) => {
      try {
        return text(`Created group:\n\n${formatGroup(await createGroup(group))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_group",
    "Rename or re-parent a group.",
    {
      id: z.number().int().positive().describe("Group id"),
      group: entity.describe("Fields to change, as Traccar group JSON"),
    },
    async ({ id, group }) => {
      try {
        return text(`Updated group:\n\n${formatGroup(await updateGroup(id, group))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_group",
    "DESTRUCTIVE: delete a device group. Devices inside it are not deleted.",
    { id: z.number().int().positive().describe("Group id") },
    async ({ id }) => {
      try {
        await deleteGroup(id)
        return text(`Deleted group ${id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_geofences",
    "List geofences (drawn areas) used for enter/exit alerts.",
    {},
    async () => {
      try {
        return text(render(await listGeofences(), formatGeofence, "No geofences defined."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_geofence",
    "Create a geofence. Provide a WKT area, e.g. " +
      'POLYGON ((lon lat, lon lat, ...)) in Traccar geofence JSON.',
    { geofence: entity.describe("Traccar geofence JSON (name and area)") },
    async ({ geofence }) => {
      try {
        return text(`Created geofence:\n\n${formatGeofence(await createGeofence(geofence))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_geofence",
    "Change a geofence's name, description or area.",
    {
      id: z.number().int().positive().describe("Geofence id"),
      geofence: entity.describe("Fields to change, as Traccar geofence JSON"),
    },
    async ({ id, geofence }) => {
      try {
        return text(`Updated geofence:\n\n${formatGeofence(await updateGeofence(id, geofence))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_geofence",
    "DESTRUCTIVE: delete a geofence. Past events that referenced it stay in history.",
    { id: z.number().int().positive().describe("Geofence id") },
    async ({ id }) => {
      try {
        await deleteGeofence(id)
        return text(`Deleted geofence ${id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_drivers",
    "List drivers, each with the unique id used to identify them on a device.",
    {},
    async () => {
      try {
        return text(render(await listDrivers(), formatDriver, "No drivers defined."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_driver",
    "Create a driver. Body is Traccar driver JSON, e.g. " +
      '{ "name": "Sam", "uniqueId": "DRV-1" }.',
    { driver: entity.describe("Traccar driver JSON") },
    async ({ driver }) => {
      try {
        return text(`Created driver:\n\n${formatDriver(await createDriver(driver))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_driver",
    "Update a driver's name or unique id.",
    {
      id: z.number().int().positive().describe("Driver id"),
      driver: entity.describe("Fields to change, as Traccar driver JSON"),
    },
    async ({ id, driver }) => {
      try {
        return text(`Updated driver:\n\n${formatDriver(await updateDriver(id, driver))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_driver",
    "DESTRUCTIVE: delete a driver.",
    { id: z.number().int().positive().describe("Driver id") },
    async ({ id }) => {
      try {
        await deleteDriver(id)
        return text(`Deleted driver ${id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_maintenance",
    "List maintenance schedules (by odometer, hours or date).",
    {},
    async () => {
      try {
        return text(render(await listMaintenance(), formatMaintenance, "No maintenance schedules."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_maintenance",
    "Create a maintenance schedule. Body is Traccar maintenance JSON, e.g. " +
      '{ "name": "Oil change", "type": "totalDistance", "start": "2025-01-01T00:00:00Z", "period": 10000 }.',
    { maintenance: entity.describe("Traccar maintenance JSON") },
    async ({ maintenance }) => {
      try {
        return text(`Created maintenance:\n\n${formatMaintenance(await createMaintenance(maintenance))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_maintenance",
    "Update a maintenance schedule.",
    {
      id: z.number().int().positive().describe("Maintenance id"),
      maintenance: entity.describe("Fields to change, as Traccar maintenance JSON"),
    },
    async ({ id, maintenance }) => {
      try {
        return text(`Updated maintenance:\n\n${formatMaintenance(await updateMaintenance(id, maintenance))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_maintenance",
    "DESTRUCTIVE: delete a maintenance schedule.",
    { id: z.number().int().positive().describe("Maintenance id") },
    async ({ id }) => {
      try {
        await deleteMaintenance(id)
        return text(`Deleted maintenance ${id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  const reportArgs = {
    deviceId: z.number().int().positive().optional().describe("Only this device"),
    groupId: z.number().int().positive().optional().describe("Every device in this group"),
    from: z.string().describe("Start of the window, ISO 8601"),
    to: z.string().describe("End of the window, ISO 8601"),
  }

  server.tool(
    "get_report_summary",
    "Totals per device for a time window: distance, average and max speed, engine hours, fuel used.",
    reportArgs,
    async ({ deviceId, groupId, from, to }) => {
      try {
        const rows = await getReportSummary({ deviceId, groupId, from, to })
        return text(render(rows, formatSummary, "No summary data in that window."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_report_trips",
    "List trips (movement segments) in a time window, with distance, duration and speeds.",
    reportArgs,
    async ({ deviceId, groupId, from, to }) => {
      try {
        const rows = await getReportTrips({ deviceId, groupId, from, to })
        return text(render(rows, formatTrip, "No trips in that window."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_report_stops",
    "List stops in a time window, with address and how long the vehicle stayed.",
    reportArgs,
    async ({ deviceId, groupId, from, to }) => {
      try {
        const rows = await getReportStops({ deviceId, groupId, from, to })
        return text(render(rows, formatStop, "No stops in that window."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_report_events",
    "List events (alarms, geofence crossings, device status changes) in a time window.",
    reportArgs,
    async ({ deviceId, groupId, from, to }) => {
      try {
        const rows = await getReportEvents({ deviceId, groupId, from, to })
        return text(render(rows, formatEvent, "No events in that window."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_report_route",
    "Return the full position trace for a time window, for plotting or distance checks.",
    reportArgs,
    async ({ deviceId, groupId, from, to }) => {
      try {
        const rows = await getReportRoute({ deviceId, groupId, from, to })
        return text(render(rows, formatPosition, "No route points in that window."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_command_types",
    "List the remote commands a device supports, e.g. engineStop or positionPeriodic.",
    { deviceId: z.number().int().positive().optional().describe("Limit to the commands this device supports") },
    async ({ deviceId }) => {
      try {
        const types = await listCommandTypes(deviceId)
        return text(render(types, formatCommandType, "No command types available."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "send_command",
    "Send a remote command to a device. Body is Traccar command JSON, e.g. " +
      '{ "deviceId": 3, "type": "engineStop" }. Some commands cost SMS credit.',
    { command: entity.describe("Traccar command JSON with deviceId and type") },
    async ({ command }) => {
      try {
        await sendCommand(command)
        return text("Command queued. Traccar delivers it on the device's next connection.")
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_users",
    "List user accounts on the server with their role and limits.",
    {},
    async () => {
      try {
        return text(render(await listUsers(), formatUser, "No users found."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_user",
    "Create a user account. Body is Traccar user JSON, e.g. " +
      '{ "name": "Sam", "email": "sam@example.com", "password": "..." }.',
    { user: entity.describe("Traccar user JSON") },
    async ({ user }) => {
      try {
        return text(`Created user:\n\n${formatUser(await createUser(user))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_user",
    "Update a user account: name, email, limits, expiry or administrator flag.",
    {
      id: z.number().int().positive().describe("User id"),
      user: entity.describe("Fields to change, as Traccar user JSON"),
    },
    async ({ id, user }) => {
      try {
        return text(`Updated user:\n\n${formatUser(await updateUser(id, user))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_user",
    "DESTRUCTIVE: delete a user account. Their devices are not removed.",
    { id: z.number().int().positive().describe("User id") },
    async ({ id }) => {
      try {
        await deleteUser(id)
        return text(`Deleted user ${id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof TraccarError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
