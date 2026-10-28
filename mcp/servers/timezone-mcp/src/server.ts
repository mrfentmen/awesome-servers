import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { convertTime, listTimezones, timeInZone, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "timezone-mcp", version: "1.0.0" })

  server.tool(
    "time_in_zone",
    "Current local time in one IANA zone, with weekday, abbreviation and UTC offset.",
    {
      zone: z.string().describe('IANA zone, e.g. Asia/Tokyo'), at: z.string().optional().describe('Optional ISO 8601 instant to use instead of now')
    },
    async (a) => {
      try {
        return text(await timeInZone(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "convert_time",
    "Show one moment in two zones; a bare wall-clock time is read in the from zone, handling daylight saving.",
    {
      time: z.string().describe('ISO 8601 instant (2026-01-01T09:00Z) or wall-clock time (2026-01-01 09:00)'), from: z.string().describe('Zone the time belongs to when no offset is given, e.g. Europe/Berlin'), to: z.string().describe('Zone to convert to, e.g. America/Los_Angeles')
    },
    async (a) => {
      try {
        return text(await convertTime(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "list_timezones",
    "Search the IANA zone list this runtime knows.",
    {
      search: z.string().optional().describe('Substring filter, e.g. tokyo')
    },
    async (a) => {
      try {
        return text(await listTimezones(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
