import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_search, m1_searchFood } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'usda-food-mcp', version: '1.0.0' })
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search USDA foods.",
      inputSchema: z.object( { query: z.string().describe("Food search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_search(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "search_food",
    {
      title: "Search food",
      description: "Search foods by name and get nutrition facts.",
      inputSchema: z.object( { query: z.string().describe("Food name like banana."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_searchFood(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "food_details",
    {
      title: "Food details",
      description: "The USDA FoodData Central record for one FDC id: data type, brand, category, serving size and the published nutrient amounts.",
      inputSchema: z.object( { fdc_id: z.string().describe("Numeric FDC id, e.g. 173944 for raw bananas.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement details locally (paywall removed)
    try { return textError("Not yet implemented: details") } catch (e) { return textError(String(e)) }
  }
  )
const serverName = "usda-food-mcp"

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
