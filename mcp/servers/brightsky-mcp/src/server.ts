import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { weather, weatherSources } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "brightsky-mcp", version: "1.0.0" })
  server.registerTool(
    "weather",
    {
      title: "Weather",
      description: "Weather for coordinates.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), date: z.string().describe("YYYY-MM-DD.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await weather(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "hourly_forecast",
    {
      title: "Hourly forecast",
      description: "Hourly Bright Sky weather with the full field set: temperature, dew point, humidity, cloud cover, precipitation and its probability, wind speed, direction and gusts, pressure, visibility and condition.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), date: z.string().describe("ISO date, defaults to today.").optional(), limit: z.number().describe("Max hours.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement forecast locally (paywall removed)
    try { return textError("Not yet implemented: forecast") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "forecast_summary",
    {
      title: "Forecast summary",
      description: "Derive a whole window summary from Bright Sky hourly data: temperature range and mean, coldest and warmest hour, total rainfall, wet hours, strongest wind and the dominant condition.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), date: z.string().describe("ISO date, defaults to today.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement summary locally (paywall removed)
    try { return textError("Not yet implemented: summary") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "weather_sources",
    {
      title: "Weather sources",
      description: "List the observation stations and models that produced the Bright Sky data for a coordinate, with WMO and national station ids, position, height and record window.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), date: z.string().describe("ISO date, defaults to today.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await weatherSources(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}
