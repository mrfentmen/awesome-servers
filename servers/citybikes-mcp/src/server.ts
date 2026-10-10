import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { network, networks, networkCapacity } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "citybikes-mcp", version: "1.0.0" })
  server.registerTool(
    "networks",
    {
      title: "Networks",
      description: "All bike share networks.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await networks(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "network",
    {
      title: "Network",
      description: "Live stations for one network.",
      inputSchema: z.object( { id: z.string().describe("Network ID like bixi-montreal.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await network(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "network_search",
    {
      title: "Network search",
      description: "Search the CityBikes directory of bike share systems by name, id, operator, city or country, with a breakdown of how many networks operate in each country.",
      inputSchema: z.object( { query: z.string().describe("Name, id or operator fragment.").optional(), country: z.string().describe("Country fragment.").optional(), limit: z.number().describe("Max results.").optional(), summary: z.boolean().describe("List matches compactly.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: network_search ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_citybikes_network_search", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "station_search",
    {
      title: "Station search",
      description: "Find stations inside a CityBikes network by name or by live availability, ranked by bikes free, with dock counts, coordinates, e-bike numbers and the data timestamp.",
      inputSchema: z.object( { network: z.string().describe("Network id, e.g. joco-new-york."), query: z.string().describe("Station name fragment.").optional(), has_bikes: z.boolean().describe("Only stations with bikes.").optional(), has_slots: z.boolean().describe("Only stations with empty slots.").optional(), limit: z.number().describe("Max stations.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: station_search ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_citybikes_station_search", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "network_capacity",
    {
      title: "Network capacity",
      description: "Live capacity statistics for a CityBikes network: free bikes and empty docks in total, share of stations stocked, completely full and empty stations, e-bike availability and the spread of bikes per station.",
      inputSchema: z.object( { network: z.string().describe("Network id, e.g. joco-new-york.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await networkCapacity(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}
