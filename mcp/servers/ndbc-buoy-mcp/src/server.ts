import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { station } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ndbc-buoy-mcp", version: "1.0.0" })
  server.registerTool(
    "station",
    {
      title: "Station",
      description: "Latest observations for a buoy station.",
      inputSchema: z.object( { stationId: z.string().describe("Station ID like 41008.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await station(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "nearby_stations",
    {
      title: "Nearby stations",
      description: "Active NDBC stations within a radius of a point, nearest first, with distance, position and station type.",
      inputSchema: z.object( { lat: z.number().min(-90).max(90).describe("Latitude."), lon: z.number().min(-180).max(180).describe("Longitude."), radiusKm: z.number().int().min(1).max(1000).default(100).describe("Search radius in km."), type: z.string().max(30).optional(), limit: z.number().int().min(1).max(30).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: nearby_stations ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ndbc_buoy_nearby_stations", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "wave_spectrum",
    {
      title: "Wave spectrum",
      description: "Latest wave spectrum observations for a buoy: significant and mean wave height, peak and average period, mean direction and steepness.",
      inputSchema: z.object( { stationId: z.string().describe("Station ID like 41008."), limit: z.number().int().min(1).max(20).default(6) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: wave_spectrum ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ndbc_buoy_wave_spectrum", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
