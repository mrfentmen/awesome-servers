import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { companyNews, earningsCalendar, FinnhubError, stockQuote } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "finnhub-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "stock_quote",
    {
      title: "Stock quote",
      description: "Quote with previous close, change, day range.",
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
    "company_news",
    {
      title: "Company news",
      description: "Recent headlines for a ticker with sources and links.",
      inputSchema: z.object({
        symbol: z.string().describe("Ticker, e.g. 'AAPL'"),
        days: z.number().int().min(1).max(365).default(7),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbol, days }) => {
      try {
        const rows = await companyNews(symbol, days)
        if (rows.length === 0) return text(`No news for ${symbol}.`)
        return text(rows.join("\n\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "earnings_calendar",
    {
      title: "Earnings calendar",
      description: "Upcoming earnings with dates and EPS estimates.",
      inputSchema: z.object({
        days: z.number().int().min(1).max(365).default(14),
      }),
      annotations: READ_ONLY,
    },
    async ({ days }) => {
      try {
        const rows = await earningsCalendar(days)
        if (rows.length === 0) return text("No upcoming earnings.")
        return text(rows.join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof FinnhubError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
