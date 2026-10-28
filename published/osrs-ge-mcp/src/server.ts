import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { itemPrice, itemSearch, priceHistory, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "osrs-ge-mcp", version: "1.0.0" })

  server.tool(
    "item_search",
    "Search Old School RuneScape items by name, with current buy and sell prices.",
    {
      query: z.string().describe('Item name, e.g. "dragon scimitar"'), limit: z.number().int().min(1).max(30).optional().describe('Items to return, default 10')
    },
    async (a) => {
      try {
        return text(await itemSearch(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "item_price",
    "Current Grand Exchange price for one item, by name or item id: instant buy/sell, spread, trade recency and 5-minute averages.",
    {
      item: z.union([z.string(), z.number()]).describe('Item name or numeric id, e.g. "dragon scimitar" or 4151')
    },
    async (a) => {
      try {
        return text(await itemPrice(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "price_history",
    "Historical Grand Exchange averages for one item at 5m, 1h, 6h or 24h granularity.",
    {
      item: z.union([z.string(), z.number()]).describe('Item name or numeric id'), timestep: z.enum(['5m', '1h', '6h', '24h']).optional().describe('Granularity, default 24h'), limit: z.number().int().min(1).max(60).optional().describe('Points to show, default 14')
    },
    async (a) => {
      try {
        return text(await priceHistory(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
