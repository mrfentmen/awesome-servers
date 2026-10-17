import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { daily, regional } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "nasa-power-mcp", version: "1.0.0" })
  server.registerTool(
    "daily",
    {
      title: "Daily",
      description: "Daily solar and weather values for a point.",
      inputSchema: z.object( { latitude: z.number().describe("Latitude."), longitude: z.number().describe("Longitude."), parameters: z.string().describe("Comma separated parameters like T2M,PRECTOTCORR.").optional(), start: z.string().describe("Start date YYYYMMDD.").optional(), end: z.string().describe("End date YYYYMMDD.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await daily(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "hourly",
    {
      title: "Hourly data",
      description: "NASA POWER at hourly resolution for a coordinate and date range, so you can see the diurnal cycle rather than a daily mean.",
      inputSchema: z.object( { latitude: z.number().describe("Latitude -90 to 90."), longitude: z.number().describe("Longitude -180 to 180."), parameters: z.string().describe("Comma-separated, e.g. T2M,WS2M,RH2M.").optional(), start: z.string().describe("YYYYMMDD.").optional(), end: z.string().describe("YYYYMMDD.").optional(), limit: z.number().describe("Max hours.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement hourly locally (paywall removed)
    try { return textError("Not yet implemented: hourly") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "climatology",
    {
      title: "Climatology",
      description: "NASA POWER 30-year monthly climate normals for a coordinate: what the temperature and rainfall there usually are, month by month.",
      inputSchema: z.object( { latitude: z.number().describe("Latitude -90 to 90."), longitude: z.number().describe("Longitude -180 to 180."), parameters: z.string().describe("Comma-separated, e.g. T2M,PRECTOTCORR.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement climatology locally (paywall removed)
    try { return textError("Not yet implemented: climatology") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "regional",
    {
      title: "Regional grid",
      description: "NASA POWER over a bounding box instead of a point, returning one row per grid cell so you can see a gradient across a region.",
      inputSchema: z.object( { latitude_min: z.number().describe("South edge."), latitude_max: z.number().describe("North edge."), longitude_min: z.number().describe("West edge."), longitude_max: z.number().describe("East edge."), parameters: z.string().describe("Comma-separated, default T2M.").optional(), start: z.string().describe("YYYYMMDD.").optional(), end: z.string().describe("YYYYMMDD.").optional(), limit: z.number().describe("Max cells.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await regional(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
