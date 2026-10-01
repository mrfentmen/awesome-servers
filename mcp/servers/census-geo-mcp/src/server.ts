import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { coordinates, geocode, coordinateGeographies } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "census-geo-mcp", version: "1.0.0" })
  server.registerTool(
    "geocode",
    {
      title: "Geocode",
      description: "Geocode a street address.",
      inputSchema: z.object( { address: z.string().describe("Street address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await geocode(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "coordinates",
    {
      title: "Coordinates",
      description: "Reverse geocode coordinates.",
      inputSchema: z.object( { x: z.number().describe("Longitude."), y: z.number().describe("Latitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await coordinates(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "address_geographies",
    {
      title: "Address geographies",
      description: "Every census geography an address falls in: state, county, tract, place, congressional district and more.",
      inputSchema: z.object( { address: z.string().describe("Street address, e.g. '1600 Pennsylvania Ave NW Washington DC'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: address_geographies ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_census_geo_address_geographies", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "coordinate_geographies",
    {
      title: "Coordinate geographies",
      description: "Every census geography a longitude/latitude falls in: state, county, tract, place, congressional district and more.",
      inputSchema: z.object( { x: z.number().describe("Longitude."), y: z.number().describe("Latitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await coordinateGeographies(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
