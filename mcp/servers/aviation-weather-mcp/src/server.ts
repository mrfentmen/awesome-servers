import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { metar, taf, airsigmetReports } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "aviation-weather-mcp", version: "1.0.0" })
  server.registerTool(
    "metar",
    {
      title: "Metar",
      description: "METAR report for airports.",
      inputSchema: z.object( { stations: z.string().describe("Comma separated ICAO codes like KJFK,KLAX.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await metar(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "taf",
    {
      title: "Taf",
      description: "TAF forecast for airports.",
      inputSchema: z.object( { stations: z.string().describe("Comma separated ICAO codes.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await taf(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "station_info",
    {
      title: "Station info",
      description: "Station records for ICAO codes: site name, position, elevation, timezone, country and the ICAO, IATA, FAA and WMO identifiers.",
      inputSchema: z.object( { stations: z.string().describe("ICAO codes, comma separated, e.g. KJFK,KLAX.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: station_info ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_aviation_weather_station_info", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "hazard_reports",
    {
      title: "Hazard reports",
      description: "Active aviation weather hazards for ICAO codes, such as coastal flood warnings, with issue and expiry times.",
      inputSchema: z.object( { stations: z.string().describe("ICAO codes, comma separated."), limit: z.number().describe("Max hazard records.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: hazard_reports ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_aviation_weather_hazard_reports", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "airsigmet_reports",
    {
      title: "AIRSIGMET reports",
      description: "Active SIGMETs worldwide from the Aviation Weather Center, with type, validity window and issuing centre.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await airsigmetReports(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
