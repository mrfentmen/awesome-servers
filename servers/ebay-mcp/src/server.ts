import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchItems,
  getItem,
  getItemGroup,
  getLegacyItem,
  dealItems,
  searchExtended,
  searchEndingSoon,
  searchLowestPrice,
  searchNewlyListed,
  searchByCategory,
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

  server.registerTool(
    "get_item_group",
    {
      title: "Item group",
      description: "Multi-seller listing group.",
      inputSchema: z.object({
        item_group_id: z.string().describe("Group ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ item_group_id }) => {
      try {
        return text(await getItemGroup(item_group_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_legacy_item",
    {
      title: "Legacy item",
      description: "Lookup by legacy ID.",
      inputSchema: z.object({
        legacy_id: z.string().describe("Legacy numeric ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ legacy_id }) => {
      try {
        return text(await getLegacyItem(legacy_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "deal_items",
    {
      title: "Deal items",
      description: "eBay Top Deals.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 200).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await dealItems(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_extended",
    {
      title: "Extended search",
      description: "Search with full item details.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        limit: z.string().describe("Max results (default 10, max 200).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchExtended(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_ending_soon",
    {
      title: "Ending soon",
      description: "Auctions ending first.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        limit: z.string().describe("Max results (default 10, max 200).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchEndingSoon(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_lowest_price",
    {
      title: "Lowest price",
      description: "Cheapest first.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        limit: z.string().describe("Max results (default 10, max 200).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchLowestPrice(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_newly_listed",
    {
      title: "Newly listed",
      description: "Newest first.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        limit: z.string().describe("Max results (default 10, max 200).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchNewlyListed(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_by_category",
    {
      title: "Search in category",
      description: "Scoped search.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        category_id: z.string().describe("Category ID."),
        limit: z.string().describe("Max results (default 10, max 200).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, category_id, limit }) => {
      try {
        return text(await searchByCategory(query, category_id, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}