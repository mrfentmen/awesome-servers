import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, geocodeInBox } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "photon-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Geocode a place name.",
      inputSchema: z.object( { query: z.string().describe("Place name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "reverse_geocode",
    {
      title: "Reverse geocode",
      description: "OpenStreetMap features at a latitude and longitude: nearest street, house, square or place, with OSM type and postcode.",
      inputSchema: z.object( { lat: z.number().min(-90).max(90).describe("Latitude."), lon: z.number().min(-180).max(180).describe("Longitude."), limit: z.number().int().min(1).max(20).default(5) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: reverse_geocode ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_photon_reverse_geocode", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "search_by_tag",
    {
      title: "Search by tag",
      description: "Geocode a place name restricted to one OpenStreetMap tag, such as amenity:restaurant or tourism:attraction.",
      inputSchema: z.object( { query: z.string().describe("Place name."), tag: z.string().describe("OSM tag as key:value."), countryCode: z.string().max(2).optional(), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_by_tag ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_photon_search_by_tag", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "geocode_in_box",
    {
      title: "Geocode in box",
      description: "Geocode a place name restricted to a bounding box, so results only come from that part of the world.",
      inputSchema: z.object( { query: z.string().describe("Place name."), south: z.number().min(-90).max(90), west: z.number().min(-180).max(180), north: z.number().min(-90).max(90), east: z.number().min(-180).max(180), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await geocodeInBox(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
