import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_area, m1_flightsInBox, m1_flightsNear, airspaceSummary } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'opensky-mcp', version: '1.0.0' })
server.registerTool(
    "area",
    {
      title: "Area",
      description: "Flights in a bounding box.",
      inputSchema: z.object( { minLat: z.number().describe("Min latitude."), minLon: z.number().describe("Min longitude."), maxLat: z.number().describe("Max latitude."), maxLon: z.number().describe("Max longitude."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_area(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "flights_near",
    {
      title: "Flights near",
      description: "Find aircraft within a radius of a location.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), radius_km: z.number().describe("Radius in kilometers.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_flightsNear(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "flights_in_box",
    {
      title: "Flights in box",
      description: "Find aircraft inside a latitude longitude box.",
      inputSchema: z.object( { min_lat: z.number().describe("Minimum latitude."), min_lon: z.number().describe("Minimum longitude."), max_lat: z.number().describe("Maximum latitude."), max_lon: z.number().describe("Maximum longitude."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_flightsInBox(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "callsign_lookup",
    {
      title: "Callsign lookup",
      description: "Find live aircraft by callsign prefix anywhere in the world, no API key needed.",
      inputSchema: z.object( {
        prefix: z.string().describe("Callsign prefix to match, e.g. AFR, UAL, SWR."),
        limit: z.number().int().min(1).max(25).optional().describe("How many aircraft to list, 1-25. Default 10."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement lookup locally (paywall removed)
    try { return textError("Not yet implemented: lookup") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "country_flights",
    {
      title: "Country flights",
      description: "Live aircraft registered to one country, with position, altitude, speed and squawk.",
      inputSchema: z.object( {
        country: z.string().describe("Country name to match, e.g. Germany, France, United States."),
        limit: z.number().int().min(1).max(25).optional().describe("How many aircraft to list, 1-25. Default 10."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement flights locally (paywall removed)
    try { return textError("Not yet implemented: flights") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "airspace_summary",
    {
      title: "Airspace summary",
      description: "Global traffic summary right now: totals, altitude distribution and top countries of registration.",
      inputSchema: z.object( {}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await airspaceSummary(args)) } catch (e) { return textError(String(e)) }
  }
  )
const serverName = "opensky-mcp"

  server.registerTool(
    "health_check",
    {
      title: "Health check",
      description: "Check if the server is running and responsive.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("OK - server is running")
    }
  )
  server.registerTool(
    "version_info",
    {
      title: "Version info",
      description: "Get server version and metadata.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2))
    }
  )
  server.registerTool(
    "list_tools",
    {
      title: "List tools",
      description: "List all available tools on this server.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("See the tools/list response for the full tool list.")
    }
  )
  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Echo back the provided text.",
      inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      return text(String(args?.text ?? ""))
    }
  )


  return server
}
