import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listEventTypes,
  listBookings,
  listSchedules,
  eventType,
  booking,
  schedule,
  teams,
  teamDetails,
  webhooks,
  me,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "calcom-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_event_types",
    {
      title: "Event types",
      description: "Scheduling links people can book, with duration.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listEventTypes());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_bookings",
    {
      title: "Bookings",
      description: "Upcoming bookings with attendee and start time.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listBookings());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_schedules",
    {
      title: "Schedules",
      description: "Availability schedules and their timezones.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listSchedules());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "event_type",
    {
      title: "Event type",
      description: "Single event type.",
      inputSchema: z.object({
        type_id: z.string().describe("Event type ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ type_id }) => {
      try {
        return text(await eventType(type_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "booking",
    {
      title: "Booking",
      description: "Booking by UID.",
      inputSchema: z.object({
        uid: z.string().describe("Booking UID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ uid }) => {
      try {
        return text(await booking(uid));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "schedule",
    {
      title: "Schedule",
      description: "Schedule by ID.",
      inputSchema: z.object({
        schedule_id: z.string().describe("Schedule ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ schedule_id }) => {
      try {
        return text(await schedule(schedule_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "teams",
    {
      title: "Teams",
      description: "All teams.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await teams());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "team_details",
    {
      title: "Team details",
      description: "Single team.",
      inputSchema: z.object({
        team_id: z.string().describe("Team ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ team_id }) => {
      try {
        return text(await teamDetails(team_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "webhooks",
    {
      title: "Webhooks",
      description: "Registered webhooks.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await webhooks());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "me",
    {
      title: "My profile",
      description: "Authenticated user.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await me());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}