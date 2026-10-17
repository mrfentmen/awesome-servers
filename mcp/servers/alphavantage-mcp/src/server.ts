import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { AlphaVantageError, cryptoPrice, fxRate, stockQuote, symbolSearch, priceHistory, companyProfile } from "./api.js"
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "symbol_search",
    {
      title: "Symbol search",
      description: "Find ticker symbols by company name, e.g. ibm.",
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
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "company_profile",
    {
      title: "Company profile",
      description:
        "A company's own fundamentals: sector, industry, market capitalisation, EBITDA, P/E, PEG, price to book, EPS, dividend and yield, margins, returns on assets and equity, TTM revenue and gross profit, debt to equity, current and quick ratios, the 52-week range and its business description. Reads Alpha Vantage's public demo key, so no ALPHAVANTAGE_API_KEY is needed.",
      inputSchema: z.object({
        symbol: z.string().describe("Ticker symbol, e.g. IBM, AAPL"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
        try { return text(await companyProfile(args.symbol)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "price_history",
    {
      title: "Price history",
      description:
        "A symbol's own price history from the daily or intraday series: window high and low, the range as a share of the mean, mean and standard deviation, the last bar open/high/low/close, total and mean volume, and the most recent bars. Reads Alpha Vantage's public demo key, so no ALPHAVANTAGE_API_KEY is needed.",
      inputSchema: z.object({
        symbol: z.string().describe("Ticker symbol, e.g. IBM, AAPL"),
        days: z.number().describe("Bars in the window, 5-120. Defaults to 30.").optional(),
        interval: z.string().describe("'daily' (default) or an intraday interval: 5min, 15min, 30min, 60min.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await priceHistory(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof AlphaVantageError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
