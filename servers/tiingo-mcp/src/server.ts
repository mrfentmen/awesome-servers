import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { cryptoMeta, stockMeta, stockPrices, TiingoError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "tiingo-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "stock_meta",
    {
      title: "Stock metadata",
      description: "Stock name, exchange, data range.",
      inputSchema: z.object({
        symbol: z.string().describe("Ticker, e.g. 'AAPL'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbol }) => {
      try {
        return text(await stockMeta(symbol))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "stock_prices",
    {
      title: "Recent prices",
      description: "Recent daily OHLCV prices, newest first.",
      inputSchema: z.object({
        symbol: z.string().describe("Ticker, e.g. 'AAPL'"),
        days: z.number().int().min(1).max(30).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbol, days }) => {
      try {
        return text(await stockPrices(symbol, days))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "crypto_meta",
    {
      title: "Crypto metadata",
      description: "Crypto name for a ticker.",
      inputSchema: z.object({
        symbol: z.string().describe("Crypto ticker, e.g. 'btcusd'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbol }) => {
      try {
        return text(await cryptoMeta(symbol))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof TiingoError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
