import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchItems,
  getItem,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ebay-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_items",
    {
      title: "Search items",
      description: "eBay listings matching a query, with price and condition.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        limit: z.string().describe("Max results (default 10, max 200).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchItems(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_item",
    {
      title: "Get item",
      description: "One listing by item id, with price and seller.",
      inputSchema: z.object({
        item_id: z.string().describe("eBay item ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ item_id }) => {
      try {
        return text(await getItem(item_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}