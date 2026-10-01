import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_reverse, m0_search, m1_geocode, m1_reverse } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'nominatim-mcp', version: '1.0.0' })
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search places by name.",
      inputSchema: z.object( { query: z.string().describe("Place name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_search(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "reverse",
    {
      title: "Reverse",
      description: "Address for coordinates.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_reverse(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "geocode",
    {
      title: "Geocode",
      description: "Find coordinates for a place name or address.",
      inputSchema: z.object( { query: z.string().describe("Place or address."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_geocode(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "lookup_osm",
    {
      title: "Lookup OSM ids",
      description: "Resolve a batch of OpenStreetMap ids at once, with namedetails and extra tags attached, using the ids a search or reverse reports.",
      inputSchema: z.object( { ids: z.string().describe("OSM ids like W5013364, comma separated, max 50."), extratags: z.boolean().describe("Include extra tags (default true).").optional(), namedetails: z.boolean().describe("Include name details (default true).").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: lookup_osm ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_nominatim_lookup_osm", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
