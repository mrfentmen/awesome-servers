import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_album, m0_artist, m1_track } from './api.js'

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'theaudiodb-mcp', version: '1.0.0' })
server.registerTool(
    "artist",
    {
      title: "Artist",
      description: "Search artists by name.",
      inputSchema: z.object( { name: z.string().describe("Artist name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_artist(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "album",
    {
      title: "Album",
      description: "Albums by artist.",
      inputSchema: z.object( { artist: z.string().describe("Artist name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_album(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "track",
    {
      title: "Track",
      description: "Details for one track by ID.",
      inputSchema: z.object( { id: z.number().describe("Track ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_track(args)) } catch (e) { return textError(String(e)) }
  }
  )
const serverName = "theaudiodb-mcp"

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
