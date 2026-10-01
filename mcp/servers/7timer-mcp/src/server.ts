import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { forecast, forecastByPlace } from "./api.js"
import { premiumTool } from "./gateway.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "7timer-mcp", version: "1.0.0" })
  server.registerTool(
    "forecast",
    {
      title: "Forecast",
      description: "Weather for coordinates.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await forecast(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "forecast_summary",
    {
      title: "Forecast summary",
      description: "What the whole 7Timer 3-hourly series adds up to: when the coldest and warmest periods land and by how much, how much precipitation the series carries, mean and peak wind, mean and thickest cloud, and the lifted index.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: forecast_summary ----
    try { return text(await premiumTool("mcp_7timer_forecast_summary", args)) } catch (e) { return textError(error(e)) }
    // ---- paywall: end ----
  }
  )

  server.registerTool(
    "daily_outlook",
    {
      title: "Daily outlook",
      description: "The 7Timer daily product: one row per day with that day's condition, its low and high, the size of its temperature range and its peak wind, plus the period's overall extremes.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), limit: z.number().describe("Days to show, 1-7.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: daily_outlook ----
    try { return text(await premiumTool("mcp_7timer_daily_outlook", args)) } catch (e) { return textError(error(e)) }
    // ---- paywall: end ----
  }
  )

  server.registerTool(
    "forecast_by_place",
    {
      title: "Forecast by place name",
      description: "Look a place up by name with OpenStreetMap Nominatim, show the candidate matches with their coordinates, then give the 7Timer civil series for the first match.",
      inputSchema: z.object( { place: z.string().describe("Place name, e.g. Reykjavik or Wellington."), limit: z.number().describe("Candidate places to list, 1-5.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await forecastByPlace(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
