import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { forecast, floodGrid } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "flood-mcp", version: "1.0.0" })
  server.registerTool(
    "forecast",
    {
      title: "Forecast",
      description: "Flood forecast at coordinates.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lng: z.number().describe("Longitude."), limit: z.number().describe("Max days.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await forecast(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "flood_peaks",
    {
      title: "Flood peaks",
      description: "The shape of the whole 92 day Open-Meteo river discharge series rather than its first week: peak and trough with their dates, median and mean, the change across the series, whether the half-period trend is rising or falling, and the highest days.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lng: z.number().describe("Longitude."), limit: z.number().describe("Highest days to list, 1-15.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement peaks locally (paywall removed)
    try { return textError("Not yet implemented: peaks") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "flood_thresholds",
    {
      title: "Flood thresholds",
      description: "How often the Open-Meteo discharge series crosses a discharge the caller cares about: how many days clear it, the first and last crossing, the longest unbroken run, and the days that cleared it.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lng: z.number().describe("Longitude."), threshold: z.number().describe("Discharge in m3/s to test against.").optional(), limit: z.number().describe("Crossing days to list, 1-20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement thresholds locally (paywall removed)
    try { return textError("Not yet implemented: thresholds") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "flood_grid",
    {
      title: "Flood grid cell",
      description: "Which Open-Meteo flood grid cell a request is actually snapped to, how far that cell is from the coordinates asked for, its elevation, and the time zone the series is expressed in.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lng: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await floodGrid(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
