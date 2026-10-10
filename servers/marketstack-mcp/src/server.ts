import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, getLatestEod, getEodOnDate, searchTickers, listExchanges, getDividends, symbolDividendLedger, priceWindowReview } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer(): McpServer {
  const server = new McpServer({
    name: "marketstack-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_latest_eod",
    {
      title: "Get latest EOD prices",
      description: "Latest end-of-day open/high/low/close/volume for stock symbols.",
      inputSchema: z.object({
        symbols: z.string().describe("Comma-separated symbols, e.g. 'AAPL,MSFT'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbols }) => {
      try {
        return text(await getLatestEod(symbols));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_eod_on_date",
    {
      title: "Get EOD on date",
      description: "End-of-day prices for symbols on one trading date.",
      inputSchema: z.object({
        symbols: z.string().describe("Comma-separated symbols"),
        date: z.string().describe("Date YYYY-MM-DD"),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbols, date }) => {
      try {
        return text(await getEodOnDate(symbols, date));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_tickers",
    {
      title: "Search tickers",
      description: "Search stock tickers by name or symbol: exchange, currency, MIC.",
      inputSchema: z.object({
        query: z.string().describe("Ticker or company, e.g. AAPL"),
        limit: z.number().default(5).describe("How many results"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchTickers(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_exchanges",
    {
      title: "List exchanges",
      description: "Stock exchanges covered by Marketstack with MIC codes and countries.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listExchanges());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_dividends",
    {
      title: "Get dividends",
      description: "Dividend declarations for symbols: amount, pay date, record date.",
      inputSchema: z.object({
        symbols: z.string().describe("Comma-separated symbols"),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbols }) => {
      try {
        return text(await getDividends(symbols));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "symbol_dividend_ledger",
    {
      title: "Symbol dividend ledger",
      description: "The dividend ledger for a ticker from Nasdaq's public quote API: annualised amount, yield, payout ratio, next ex-date and payment date, and the history of declared, record and payment dates with the total paid over the period.",
      inputSchema: z.object({ symbol: z.string().describe("Ticker, e.g. AAPL."), limit: z.number().int().min(1).max(20).default(8).describe("Distributions to print (default 8, max 20).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: symbol_dividend_ledger ----
      const paywallMessage = await premiumRequired("symbol_dividend_ledger")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await symbolDividendLedger(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "price_window_review",
    {
      title: "Price window review",
      description: "What a ticker actually did between two dates, from Nasdaq's public historical endpoint: session count, first and last close, the move, window low and high, biggest single-day move and average volume.",
      inputSchema: z.object({ symbol: z.string().describe("Ticker, e.g. MSFT."), from: z.string().describe("Start date YYYY-MM-DD (default 30 days ago).").optional(), to: z.string().describe("End date YYYY-MM-DD (default today).").optional(), limit: z.number().int().min(1).max(60).default(10).describe("Sessions to print (default 10, max 60).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: price_window_review ----
      const paywallMessage = await premiumRequired("price_window_review")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await priceWindowReview(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
