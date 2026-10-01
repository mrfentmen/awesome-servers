import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getVersion,
  searchItems,
  getItem,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "docspell-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_version",
    {
      title: "Server version",
      description: "Docspell server version info. Public, no auth needed.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getVersion());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_items",
    {
      title: "Search items",
      description: "Full-text document search (requires DOCSPELL_AUTH_TOKEN).",
      inputSchema: z.object({
        query: z.string().describe("Search query, e.g. tag:invoice year:2025.")
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        return text(await searchItems(query));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_item",
    {
      title: "Get item",
      description: "Document item details by ID (requires DOCSPELL_AUTH_TOKEN).",
      inputSchema: z.object({
        item_id: z.string().describe("Docspell item ID.")
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