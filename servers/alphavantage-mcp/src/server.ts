import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { AlphaVantageError, cryptoPrice, fxRate, stockQuote, symbolSearch } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "alphavantage-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "stock_quote",
    {
      title: "Stock quote",
      description: "Quote with open/high/low, change, volume. Free tier is 25 calls/day.",
      inputSchema: z.object({
        symbol: z.string().describe("Ticker, e.g. 'AAPL'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbol }) => {
      try {
        return text(await stockQuote(symbol))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "fx_rate",
    {
      title: "FX rate",
      description: "Currency exchange rate between two codes.",
      inputSchema: z.object({
        from: z.string().describe("From code, e.g. 'USD'"),
        to: z.string().describe("To code, e.g. 'EUR'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ from, to }) => {
      try {
        return text(await fxRate(from, to))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "crypto_price",
    {
      title: "Crypto price",
      description: "Crypto price in a market currency.",
      inputSchema: z.object({
        symbol: z.string().describe("Crypto code, e.g. 'BTC'"),
        market: z.string().default("USD"),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbol, market }) => {
      try {
        return text(await cryptoPrice(symbol, market))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "symbol_search",
    {
      title: "Symbol search",
      description: "Find tickers by company name.",
      inputSchema: z.object({
        keywords: z.string().describe("Company name, e.g. 'Apple'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ keywords }) => {
      try {
        const rows = await symbolSearch(keywords)
        if (rows.length === 0) return text(`No symbols for "${keywords}".`)
        return text(rows.map((r, i) => `${i + 1}. ${r}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof AlphaVantageError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
