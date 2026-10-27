import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_radar, m1_timeline } from "./api.js"
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
    try { return text(await m0_radar(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await m1_timeline(args)) } catch (e) { return textError(String(e)) }
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
    // TODO: implement tiles locally (paywall removed)
    try { return textError("Not yet implemented: tiles") } catch (e) { return textError(String(e)) }
  }
  )
const serverName = "rainviewer-mcp"

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
  server.registerTool(
    "timestamp",
    {
      title: "Timestamp",
      description: "Get the current UTC timestamp.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text(new Date().toISOString())
    }
  )
  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Ping the server to check connectivity.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("pong")
    }
  )
  server.registerTool(
    "help",
    {
      title: "Help",
      description: "Get help and usage information.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("This MCP server provides several tools. See tools/list for details.")
    }
  )


  return server
}
