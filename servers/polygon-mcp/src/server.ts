import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listTickers,
  getTicker,
  prevClose,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "polygon-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_tickers",
    {
      title: "List tickers",
      description: "Reference tickers, with name and market.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listTickers(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_ticker",
    {
      title: "Get ticker",
      description: "One ticker's reference details by symbol.",
      inputSchema: z.object({
        ticker: z.string().describe("Ticker symbol, e.g. AAPL")
      }),
      annotations: READ_ONLY,
    },
    async ({ ticker }) => {
      try {
        return text(await getTicker(ticker));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "prev_close",
    {
      title: "Previous close",
      description: "Previous day's bar: open, high, low, close, volume.",
      inputSchema: z.object({
        ticker: z.string().describe("Ticker symbol, e.g. AAPL")
      }),
      annotations: READ_ONLY,
    },
    async ({ ticker }) => {
      try {
        return text(await prevClose(ticker));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}