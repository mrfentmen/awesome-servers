import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { nearest, route } from "./api.js"
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
    try { return text(await route(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await nearest(args)) } catch (e) { return textError(String(e)) }
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
    // TODO: implement table locally (paywall removed)
    try { return textError("Not yet implemented: table") } catch (e) { return textError(String(e)) }
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
    // TODO: implement trace locally (paywall removed)
    try { return textError("Not yet implemented: trace") } catch (e) { return textError(String(e)) }
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
    // TODO: implement trip locally (paywall removed)
    try { return textError("Not yet implemented: trip") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
