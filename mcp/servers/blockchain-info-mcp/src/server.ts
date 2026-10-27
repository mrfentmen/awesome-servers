import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { addressSummary, latestBlock, priceTicker, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "blockchain-info-mcp", version: "1.0.0" })

  server.tool(
    "latest_block",
    "The newest Bitcoin block with height, hash and timestamp.",
    {
      // no arguments
    },
    async (a) => {
      try {
        return text(await latestBlock())
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "price_ticker",
    "BTC price across currencies, or one currency in detail.",
    {
      currency: z.string().length(3).optional().describe("Three-letter currency code, e.g. USD. Omit for all of them")
    },
    async (a) => {
      try {
        return text(await priceTicker(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "address_summary",
    "Balance and recent transactions for a Bitcoin address.",
    {
      address: z.string().min(26).max(62).describe("Bitcoin address, base58 or bc1"),
      limit: z.number().int().min(1).max(10).default(5).describe("Transactions to list")
    },
    async (a) => {
      try {
        return text(await addressSummary(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
