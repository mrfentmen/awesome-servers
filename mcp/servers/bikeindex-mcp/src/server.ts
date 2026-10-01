import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { bike, search, manufacturerCatalogue } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "bikeindex-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search bikes.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "bike",
    {
      title: "Bike",
      description: "Get a bike by id.",
      inputSchema: z.object( { id: z.number().describe("Bike id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await bike(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "stolen_bikes",
    {
      title: "Stolen bikes",
      description: "Browse the Bike Index stolen bike register with manufacturer, frame model, colour, type, theft date, last known city and description, optionally restricted to a recent window.",
      inputSchema: z.object( { limit: z.number().describe("Max records.").optional(), page: z.number().describe("Page of the stolen index.").optional(), days_ago: z.number().describe("Only bikes stolen within this many days.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: stolen_bikes ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bikeindex_stolen_bikes", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "bikes_near",
    {
      title: "Bikes near a location",
      description: "Find bikes registered on Bike Index within a radius of a latitude and longitude, with a manufacturer breakdown and full records, optionally restricted to stolen bikes.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), distance: z.number().describe("Radius in km.").optional(), stolen_only: z.boolean().describe("Only stolen bikes.").optional(), limit: z.number().describe("Max records.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: bikes_near ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bikeindex_bikes_near", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "manufacturer_catalogue",
    {
      title: "Manufacturer catalogue",
      description: "List Bike Index registered bikes for a manufacturer with a frame model breakdown, or search the manufacturer catalogue itself for company details and websites.",
      inputSchema: z.object( { manufacturer: z.string().describe("Manufacturer name, e.g. Trek."), search_catalogue: z.boolean().describe("Search the manufacturer catalogue instead of the bike register.").optional(), limit: z.number().describe("Max records.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await manufacturerCatalogue(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
