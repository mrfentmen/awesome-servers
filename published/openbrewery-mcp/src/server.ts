import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_search, m1_byCity, m1_byState, m1_search } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'openbrewery-mcp', version: '1.0.0' })
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search breweries by name or city.",
      inputSchema: z.object( { query: z.string().describe("Search terms.").optional(), city: z.string().describe("City name.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_search(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "by_city",
    {
      title: "By city",
      description: "List breweries in a city.",
      inputSchema: z.object( { city: z.string().describe("City name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_byCity(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "by_state",
    {
      title: "By state",
      description: "List breweries in a state.",
      inputSchema: z.object( { state: z.string().describe("State name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_byState(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "brewery_detail",
    {
      title: "Brewery detail",
      description: "One brewery by its Open Brewery DB id, with type, full address, phone, website and coordinates.",
      inputSchema: z.object( { id: z.string().min(1).max(64) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "by_type",
    {
      title: "By type",
      description: "List breweries of one brewery type, such as micro, brewpub, large or contract.",
      inputSchema: z.object( { type: z.string().min(1).max(40), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement type locally (paywall removed)
    try { return textError("Not yet implemented: type") } catch (e) { return textError(String(e)) }
  }
  )
const serverName = "openbrewery-mcp"

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


  return server
}
