import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { timings } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "prayer-times-mcp", version: "1.0.0" })
  server.registerTool(
    "timings",
    {
      title: "Timings",
      description: "Prayer times for a city.",
      inputSchema: z.object( { city: z.string().describe("City name."), country: z.string().describe("Country name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await timings(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "month_calendar",
    {
      title: "Month calendar",
      description: "Every day's Fajr, sunrise, Dhuhr, Asr, Maghrib and Isha for one month in a city, as a per-day grid.",
      inputSchema: z.object( { city: z.string().describe("City name."), country: z.string().describe("Country name."), month: z.number().int().min(1).max(12), year: z.number().int().min(1970).max(2100) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement calendar locally (paywall removed)
    try { return textError("Not yet implemented: calendar") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "hijri_date",
    {
      title: "Hijri date",
      description: "Convert a DD-MM-YYYY date between the Gregorian and Hijri calendars, with weekday and Hijri month.",
      inputSchema: z.object( { date: z.string().min(1).max(20), direction: z.enum(["to_hijri", "to_gregorian"]) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement date locally (paywall removed)
    try { return textError("Not yet implemented: date") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
