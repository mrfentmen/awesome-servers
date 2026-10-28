import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { cardDetail, listSets, searchCards, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "lorcana-mcp", version: "1.0.1" })

  server.tool(
    "search_cards",
    "Search Lorcana cards by name, text, set or ink.",
    {
      query: z.string().min(2).describe('Lorcast query, e.g. "Elsa", "body:draw a card" or "set:1"'),
      limit: z.number().int().min(1).max(25).default(10).describe("Cards to return")
    },
    async (a) => {
      try {
        return text(await searchCards(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "card_detail",
    "One card by its Lorcast id, with full text, prices and legalities.",
    {
      cardId: z.string().min(6).describe('Lorcast card id, e.g. "crd_a6f3c215973844fc8ae5cbc2a4ea388f"')
    },
    async (a) => {
      try {
        return text(await cardDetail(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_sets",
    "Every Lorcana set with its code and release dates.",
    {
      limit: z.number().int().min(1).max(50).default(20).describe("Sets to return")
    },
    async (a) => {
      try {
        return text(await listSets(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
