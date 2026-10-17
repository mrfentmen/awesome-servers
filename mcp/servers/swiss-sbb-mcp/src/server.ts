import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { connections, stationboard } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "swiss-sbb-mcp", version: "1.0.0" })
  server.registerTool(
    "connections",
    {
      title: "Connections",
      description: "Connections between stations.",
      inputSchema: z.object( { from: z.string().describe("Origin station."), to: z.string().describe("Destination station."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await connections(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "stationboard",
    {
      title: "Stationboard",
      description: "Departures at a station.",
      inputSchema: z.object( { station: z.string().describe("Station name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await stationboard(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "find_station",
    {
      title: "Find station",
      description: "Look up Swiss stations by name: station id for the stationboard tool, exact name, latitude and longitude, and how far away it is when a coordinate is given.",
      inputSchema: z.object({ query: z.string().describe("Station name, e.g. 'Zurich HB' or 'Bern'."), limit: z.number().describe("Max stations, 1-25, default 8.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement station locally (paywall removed)
    try { return textError("Not yet implemented: station") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "geocode_address",
    {
      title: "Geocode address",
      description: "Geocode a Swiss address or place with the official swisstopo search service: label, coordinates, postal code, town, district and canton.",
      inputSchema: z.object({ query: z.string().describe("Address or place, e.g. 'Bahnhofstrasse 1 Zurich'."), limit: z.number().describe("Max results, 1-20, default 5.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement address locally (paywall removed)
    try { return textError("Not yet implemented: address") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
