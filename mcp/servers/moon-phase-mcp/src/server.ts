import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { moonOnDate, moonPhase } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "moon-phase-mcp", version: "1.0.0" })
  server.registerTool(
    "moon_phase",
    {
      title: "Moon phase",
      description: "Get the current moon phase and illumination.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await moonPhase(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "moon_on_date",
    {
      title: "Moon on date",
      description: "Get the moon phase for a date.",
      inputSchema: z.object( { date: z.string().describe("Date in YYYY-MM-DD format.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await moonOnDate(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "predicted_phases",
    {
      title: "Predicted phases",
      description: "The next moon phase events from the US Naval Observatory: new moon, first quarter, full moon and last quarter with their UTC times.",
      inputSchema: z.object({ date: z.string().describe("Start date as YYYY-MM-DD. Defaults to today.").optional(), count: z.number().describe("How many phase events, 1-20, default 4.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: predicted_phases ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_moon_phase_predicted_phases", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "moon_times",
    {
      title: "Moon times",
      description: "Moonrise, moonset, sun times and twilight for a coordinate and date from the US Naval Observatory, with the phase and illuminated fraction for that place.",
      inputSchema: z.object({ date: z.string().describe("Date as YYYY-MM-DD. Defaults to today.").optional(), latitude: z.number().describe("Latitude between -90 and 90."), longitude: z.number().describe("Longitude between -180 and 180."), tz: z.number().describe("UTC offset in hours, -14 to 14. Defaults to 0.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: moon_times ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_moon_phase_moon_times", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
