import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { current, sunMoon } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wttr-mcp", version: "1.0.0" })
  server.registerTool(
    "current",
    {
      title: "Current",
      description: "Current weather for a place.",
      inputSchema: z.object( { location: z.string().describe("City name or coordinates.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await current(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "forecast",
    {
      title: "Forecast",
      description: "Three-day daily forecast for a place: minimum, maximum and average temperature, hours of sunshine, UV index, snowfall and sunrise/sunset.",
      inputSchema: z.object( { location: z.string().describe("City name or coordinates, e.g. 'Lisbon'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: forecast ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wttr_forecast", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "hourly",
    {
      title: "Hourly",
      description: "Hour-by-hour conditions for one forecast day: temperature, feels-like, chance of rain, snow and thunder, humidity, wind and gusts, pressure, UV and visibility.",
      inputSchema: z.object( { location: z.string().describe("City name or coordinates."), day: z.number().int().min(0).max(2).default(0).describe("0 for today, 1 for tomorrow, 2 for the day after") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: hourly ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wttr_hourly", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "sun_moon",
    {
      title: "Sun and moon",
      description: "Sunrise, sunset, moon phase, moon illumination, moonrise and moonset for a place across the forecast window.",
      inputSchema: z.object( { location: z.string().describe("City name or coordinates.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await sunMoon(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "resolve_location",
    {
      title: "Resolve location",
      description: "Report what wttr.in made of a place name or a coordinate pair: the area, region and country it resolved to, the latitude and longitude it will actually report weather for, the days the forecast covers and the observation time. Accepts coordinates as well as names. The current tool prints the area name and country only, so an ambiguous name that resolved somewhere unexpected looks exactly like a correct one.",
      inputSchema: z.object({ location: z.string().describe("City name or coordinates, for example 'Lisbon' or '38.72,-9.14'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: resolve_location ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wttr_resolve_location", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "forecast_ranking",
    {
      title: "Rank forecast days",
      description: "Rank the forecast days for a place against each other by peak chance of rain, snow, thunder, fog or frost, strongest wind or gust, or the difference between the day's high and low, each taken from wttr.in's own three-hourly blocks and reported with the block the peak fell in. The forecast tool lists the days without ranking them and the hourly tool prints one day at a time, so neither can say which day to pick.",
      inputSchema: z.object({ location: z.string().describe("City name or coordinates, for example 'Lisbon'."), by: z.string().describe("rain, snow, thunder, fog, frost, wind, gust or temperature_swing. Optional, rain by default.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: forecast_ranking ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wttr_forecast_ranking", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
