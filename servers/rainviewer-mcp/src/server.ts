import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_radar, m1_timeline } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'rainviewer-mcp', version: '1.0.0' })
server.registerTool(
    "radar",
    {
      title: "Radar",
      description: "Current radar tile index.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_radar(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "timeline",
    {
      title: "Timeline",
      description: "Radar tile timeline with past, nowcast, and forecast frames.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_timeline(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "radar_tiles",
    {
      title: "Radar tiles",
      description: "The exact RainViewer tile URLs covering a place, computed from a latitude and longitude for a chosen past, nowcast or forecast frame.",
      inputSchema: z.object( { lat: z.number().describe("Latitude -85.05 to 85.05."), lon: z.number().describe("Longitude -180 to 180."), zoom: z.number().describe("Tile zoom, 1 to 12.").optional(), frame: z.string().describe("past, nowcast or forecast.").optional(), index: z.number().describe("Which frame in that series.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: radar_tiles ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_rainviewer_radar_tiles", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
