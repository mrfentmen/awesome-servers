import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { etd, stations } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "bart-mcp", version: "1.0.0" })
  server.registerTool(
    "etd",
    {
      title: "Etd",
      description: "Estimated departures for a station.",
      inputSchema: z.object( { station: z.string().describe("Station abbreviation.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await etd(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "stations",
    {
      title: "Stations",
      description: "List stations.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await stations(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "station_locations",
    {
      title: "Station locations and nearest station",
      description: "Look up BART stations by city, or find the ones nearest a latitude and longitude, returning the GTFS coordinates, street address, county and zip of each.",
      inputSchema: z.object({
        city: z.string().describe("Filter by city or county, for example Oakland.").optional(),
        latitude: z.number().describe("Latitude to measure from, between -90 and 90.").optional(),
        longitude: z.number().describe("Longitude to measure from, between -180 and 180.").optional(),
        limit: z.number().describe("How many stations to list, 1 to 50. Defaults to 15.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: station_locations ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_bart_station_locations", args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "network_status",
    {
      title: "Network-wide real time status",
      description: "Summarise the whole BART network at one instant: cancelled arrivals, delayed trains, arrivals with no bike space, the longest wait on the board, the busiest stations and the most delayed trains.",
      inputSchema: z.object({
        limit: z.number().describe("How many busiest stations to list, 1 to 25. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: network_status ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_bart_network_status", args)) } catch (e) { return textError(error(e)) }
    }
  )

  return server
}
