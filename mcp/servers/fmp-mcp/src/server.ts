import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { companyProfile, FmpError, incomeStatement, stockQuote } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "fmp-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "stock_quote",
    {
      title: "Stock quote",
      description: "Quote with day range and market cap.",
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
    "company_profile",
    {
      title: "Company profile",
      description: "Company: industry, CEO, website, description.",
      inputSchema: z.object({
        symbol: z.string().describe("Ticker, e.g. 'AAPL'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbol }) => {
      try {
        return text(await companyProfile(symbol))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "income_statement",
    {
      title: "Income statement",
      description: "Recent annual revenue and net income in billions.",
      inputSchema: z.object({
        symbol: z.string().describe("Ticker, e.g. 'AAPL'"),
        limit: z.number().int().min(1).max(10).default(4),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbol, limit }) => {
      try {
        return text(await incomeStatement(symbol, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "currency_rates",
    {
      title: "Currency rates",
      description: "Current ECB reference rates for one base currency against up to ten others.",
      inputSchema: z.object({
        base: z.string().describe("Base currency code, e.g. 'USD'. Defaults to USD."),
        symbols: z.array(z.string()).describe("Target currency codes, e.g. ['EUR','JPY']. Up to ten."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: currency_rates ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_fmp_currency_rates", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "fx_history",
    {
      title: "FX rate history",
      description: "Daily ECB reference rates for one currency pair between two dates, with the period change, high and low.",
      inputSchema: z.object({
        pair: z.string().describe("Currency pair, e.g. 'EURUSD'."),
        start: z.string().describe("Start date, YYYY-MM-DD."),
        end: z.string().describe("End date, YYYY-MM-DD."),
        limit: z.number().int().min(1).max(30).default(10).describe("How many of the most recent days to print."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: fx_history ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_fmp_fx_history", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "price_history",
    {
      title: "Price history",
      description: "Recent OHLC bars and volume for a ticker, with the last price and the 52-week range.",
      inputSchema: z.object({
        symbol: z.string().describe("Ticker, e.g. 'AAPL'."),
        range: z.enum(["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "ytd", "max"]).default("1mo").describe("Window to fetch."),
        interval: z.enum(["1m", "5m", "15m", "30m", "60m", "1h", "1d", "5d", "1wk", "1mo", "3mo"]).default("1d").describe("Bar size."),
        limit: z.number().int().min(1).max(30).default(10).describe("How many of the most recent bars to print."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: price_history ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_fmp_price_history", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof FmpError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
