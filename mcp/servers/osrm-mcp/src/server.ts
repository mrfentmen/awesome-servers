import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { nearest, route } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "osrm-mcp", version: "1.0.0" })
  server.registerTool(
    "route",
    {
      title: "Route",
      description: "Route between coordinates.",
      inputSchema: z.object( { coordinates: z.string().describe("lon,lat;lon,lat pairs."), profile: z.string().describe("driving, cycling, or walking.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await route(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "nearest",
    {
      title: "Nearest",
      description: "Nearest road point to a coordinate.",
      inputSchema: z.object( { longitude: z.number().describe("Longitude."), latitude: z.number().describe("Latitude."), profile: z.string().describe("driving, cycling, or walking.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await nearest(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "route_table",
    {
      title: "Route table",
      description: "Distance and duration matrix between every pair of the points you give, using OSRM's table service.",
      inputSchema: z.object({ coordinates: z.string().describe("lon,lat;lon,lat pairs, 2 to 12 of them."), profile: z.string().describe("driving, cycling, or walking.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: route_table ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_osrm_route_table", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "match_trace",
    {
      title: "Match trace",
      description: "Snap a raw GPS trace onto the road network with OSRM's map matching service and report the match confidence and per-point snap distance.",
      inputSchema: z.object({ coordinates: z.string().describe("lon,lat;lon,lat trace points, 2 to 50 of them."), profile: z.string().describe("driving, cycling, or walking.").optional(), radius: z.number().describe("Snap radius in metres, 1-100, default 25.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: match_trace ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_osrm_match_trace", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "round_trip",
    {
      title: "Round trip",
      description: "Order a set of points into the shortest round trip with OSRM's trip service, and report the visit order, distance and duration.",
      inputSchema: z.object({ coordinates: z.string().describe("lon,lat;lon,lat pairs, 2 to 12 of them."), profile: z.string().describe("driving, cycling, or walking.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: round_trip ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_osrm_round_trip", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
