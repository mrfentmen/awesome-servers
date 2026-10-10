import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { city, stationSearch, nearestStation } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "waqi-mcp", version: "1.0.0" })
  server.registerTool(
    "city",
    {
      title: "City",
      description: "AQI for a city.",
      inputSchema: z.object( { city: z.string().describe("City like beijing.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await city(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "station_search",
    {
      title: "Station search",
      description: "Search the WAQI network for monitoring stations by place name, with coordinates, current AQI and the station uid.",
      inputSchema: z.object( { keyword: z.string().describe("Place name, e.g. london."), limit: z.number().int().min(1).max(25).default(10).describe("Max stations.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: station_search ----
    const paywallMessage = await premiumRequired("station_search")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await stationSearch(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "nearest_station",
    {
      title: "Nearest station",
      description: "Current air quality at the WAQI station nearest a latitude and longitude, with the dominant pollutant and the main iaqi measurements.",
      inputSchema: z.object( { lat: z.number().describe("Latitude, -90 to 90."), lon: z.number().describe("Longitude, -180 to 180.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: nearest_station ----
    const paywallMessage = await premiumRequired("nearest_station")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await nearestStation(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
