import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { createEvent, createReminder } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ics-generator-mcp", version: "1.0.0" })
  server.registerTool(
    "create_event",
    {
      title: "Create event",
      description: "Create an ics calendar event from a title, dates, and details.",
      inputSchema: z.object( { title: z.string().describe("Event title."), start: z.string().describe("Start time in ISO format."), end: z.string().describe("End time in ISO format.").optional(), description: z.string().describe("Event description.").optional(), location: z.string().describe("Event location.").optional(), filename: z.string().describe("Output file name.").optional() }),
      annotations: WRITE,
    },
    async (args) => {
    try { return text(await createEvent(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "create_reminder",
    {
      title: "Create reminder",
      description: "Create an all day reminder event from a date.",
      inputSchema: z.object( { title: z.string().describe("Reminder title."), date: z.string().describe("Date in YYYY-MM-DD format.") }),
      annotations: WRITE,
    },
    async (args) => {
    try { return text(await createReminder(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "create_holiday_calendar",
    {
      title: "Create holiday calendar",
      description: "Write an ics file of every public holiday a country observes in a year, using the Nager.Date holiday service.",
      inputSchema: z.object({
        country: z.string().describe("Two letter ISO country code, for example GB or US."),
        year: z.number().describe("Year, defaults to this year.").optional(),
        limit: z.number().describe("Max holidays to write, 1-400, default 60.").optional(),
        filename: z.string().describe("Output file name.").optional(),
      }),
      annotations: WRITE,
    },
    async (args) => {
    // TODO: implement calendar locally (paywall removed)
    try { return textError("Not yet implemented: calendar") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "create_sun_calendar",
    {
      title: "Create sunrise and sunset calendar",
      description: "Write an ics file of sunrise and sunset times in UTC for a coordinate over the next few days, using the Open-Meteo forecast service.",
      inputSchema: z.object({
        latitude: z.number().describe("Latitude between -90 and 90."),
        longitude: z.number().describe("Longitude between -180 and 180."),
        days: z.number().describe("Days to cover, 1-31, default 7.").optional(),
        filename: z.string().describe("Output file name.").optional(),
      }),
      annotations: WRITE,
    },
    async (args) => {
    // TODO: implement calendar locally (paywall removed)
    try { return textError("Not yet implemented: calendar") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
