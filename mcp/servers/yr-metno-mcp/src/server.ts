import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_forecast, m0_nowcast, moonEvents } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'yr-metno-mcp', version: '1.0.0' })
server.registerTool(
    "forecast",
    {
      title: "Forecast",
      description: "Compact location forecast for a point.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_forecast(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "nowcast",
    {
      title: "Nowcast",
      description: "Short-term nowcast for a point.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_nowcast(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "sun_times",
    {
      title: "Sun times",
      description: "MET Norway's sunrise, sunset and the three twilight windows for a coordinate and date, in the UTC offset you supply.",
      inputSchema: z.object( { lat: z.number().describe("Latitude -90 to 90."), lon: z.number().describe("Longitude -180 to 180."), date: z.string().describe("Date as YYYY-MM-DD, default today.").optional(), offset: z.string().describe("UTC offset as +HH:MM, default +00:00.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: sun_times ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_yr_metno_sun_times", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "moon_events",
    {
      title: "Moon events",
      description: "Moon rise, set, phase angle and upper/lower transit from MET Norway.",
      inputSchema: z.object({ lat: z.number().min(-90).max(90).describe("Latitude."), lon: z.number().min(-180).max(180).describe("Longitude."), date: z.string().optional().describe("YYYY-MM-DD; defaults to today.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await moonEvents(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "ocean_conditions",
    {
      title: "Ocean conditions",
      description: "Wave height/direction, water temperature and currents for Nordic waters from MET Norway.",
      inputSchema: z.object({ lat: z.number().min(-90).max(90).describe("Latitude."), lon: z.number().min(-180).max(180).describe("Longitude."), limit: z.number().optional().describe("Forecast periods, 1-48; default 12.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: ocean_conditions ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_yr_metno_ocean_conditions", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "weather_alerts",
    {
      title: "Weather alerts",
      description: "Current official MET Norway alerts, severity and advice; optional area-name filter.",
      inputSchema: z.object({ area: z.string().optional().describe("Substring of the reported area name."), limit: z.number().optional().describe("Alerts, 1-30; default 10.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: weather_alerts ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_yr_metno_weather_alerts", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
