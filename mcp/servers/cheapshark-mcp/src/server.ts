import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { deals, stores, game_search, game_prices, store_deals, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "cheapshark-mcp", version: "1.0.0" })

  server.tool(
    "deals",
    "Current game deals, cheapest first",
    {
      storeID: z.string().optional().describe("Optional store id, e.g. 1 for Steam"),
      upperPrice: z.number().min(0).max(1000).default(20).describe("Maximum price in USD"),
      limit: z.number().int().min(1).max(60).default(10).describe("Maximum deals")
    },
    async (a) => {
      try {
        return text(await deals(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "stores",
    "Game stores CheapShark tracks",
    {
      // no arguments
    },
    async (a) => {
      try {
        return text(await stores(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "game_search",
    "Find a game by title",
    {
      title: z.string().min(2).describe("Game title, e.g. batman"),
      limit: z.number().int().min(1).max(20).default(10).describe("Maximum games")
    },
    async (a) => {
      try {
        return text(await game_search(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "game_prices",
    "Every store price for one game",
    {
      gameID: z.string().min(1).describe("CheapShark game id, e.g. 612")
    },
    async (a) => {
      try {
        return text(await game_prices(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "store_deals",
    "Best deals at one store",
    {
      storeID: z.string().min(1).describe("Store id, e.g. 1 for Steam"),
      limit: z.number().int().min(1).max(40).default(10).describe("Maximum deals")
    },
    async (a) => {
      try {
        return text(await store_deals(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
