import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getLatestEod,
  getEodOnDate,
  searchTickers,
  listExchanges,
  getDividends,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

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
        query: z.string().describe("Search text"),
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

  return server
}
