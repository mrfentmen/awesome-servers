import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { sunTimes } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "sunrise-sunset-mcp", version: "1.0.0" })
  server.registerTool(
    "sun_times",
    {
      title: "Sun times",
      description: "Get sunrise and sunset times for a location and date.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), date: z.string().describe("Date in YYYY-MM-DD format.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await sunTimes(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "twilight_phases",
    {
      title: "Twilight phases",
      description: "Civil, nautical and astronomical twilight for a location and date, with solar noon and day length.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), date: z.string().max(20).describe("Date in YYYY-MM-DD format or today.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: twilight_phases ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_sunrise_sunset_twilight_phases", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "daylight_trend",
    {
      title: "Daylight trend",
      description: "Sample day length, sunrise and sunset across a whole year at a location, and report the shortest and longest day.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), year: z.number().int().min(1970).max(2200).optional(), steps: z.number().int().min(4).max(12).default(8).describe("How many days to sample.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: daylight_trend ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_sunrise_sunset_daylight_trend", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
