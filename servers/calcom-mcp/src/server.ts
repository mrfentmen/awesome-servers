import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listEventTypes,
  listBookings,
  listSchedules,
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

  return server
}