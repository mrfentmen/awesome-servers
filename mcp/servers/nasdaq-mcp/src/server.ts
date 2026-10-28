import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { stockHistory, stockQuote, topStocks, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "nasdaq-mcp", version: "1.0.0" })

  server.tool(
    "stock_quote",
    "Quote for one listed symbol: price, change, volume and market status.",
    {
      symbol: z.string().min(1).max(10).describe("Ticker symbol, e.g. AAPL")
    },
    async (a) => {
      try {
        return text(await stockQuote(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "stock_history",
    "Recent daily bars for a symbol: close, open, high, low and volume.",
    {
      symbol: z.string().min(1).max(10).describe("Ticker symbol, e.g. MSFT"),
      limit: z.number().int().min(1).max(30).default(10).describe("Bars to show")
    },
    async (a) => {
      try {
        return text(await stockHistory(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "top_stocks",
    "The Nasdaq screener list: symbol, name, last sale, change, market cap and sector.",
    {
      limit: z.number().int().min(1).max(50).default(15).describe("Rows to show"),
      offset: z.number().int().min(0).max(5000).default(0).describe("Rows to skip (paging)")
    },
    async (a) => {
      try {
        return text(await topStocks(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
