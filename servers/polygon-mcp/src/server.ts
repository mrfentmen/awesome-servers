import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listTickers,
  getTicker,
  prevClose,
  aggregates,
  groupedDaily,
  openClose,
  rsi,
  macd,
  dividends,
  splits,
  news,
  gainers,
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

  server.registerTool(
    "aggregates",
    {
      title: "Daily bars",
      description: "Custom date range.",
      inputSchema: z.object({
        ticker: z.string().describe("e.g. AAPL."),
        from: z.string().describe("YYYY-MM-DD."),
        to: z.string().describe("YYYY-MM-DD.")
      }),
      annotations: READ_ONLY,
    },
    async ({ ticker, from, to }) => {
      try {
        return text(await aggregates(ticker, from, to));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "grouped_daily",
    {
      title: "Market day",
      description: "Whole-market daily bars.",
      inputSchema: z.object({
        date: z.string().describe("YYYY-MM-DD.")
      }),
      annotations: READ_ONLY,
    },
    async ({ date }) => {
      try {
        return text(await groupedDaily(date));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "open_close",
    {
      title: "Open/close",
      description: "OHLC for a day.",
      inputSchema: z.object({
        ticker: z.string().describe("e.g. AAPL."),
        date: z.string().describe("YYYY-MM-DD.")
      }),
      annotations: READ_ONLY,
    },
    async ({ ticker, date }) => {
      try {
        return text(await openClose(ticker, date));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "rsi",
    {
      title: "RSI",
      description: "Relative strength.",
      inputSchema: z.object({
        ticker: z.string().describe("e.g. AAPL.")
      }),
      annotations: READ_ONLY,
    },
    async ({ ticker }) => {
      try {
        return text(await rsi(ticker));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "macd",
    {
      title: "MACD",
      description: "Trend momentum.",
      inputSchema: z.object({
        ticker: z.string().describe("e.g. AAPL.")
      }),
      annotations: READ_ONLY,
    },
    async ({ ticker }) => {
      try {
        return text(await macd(ticker));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "dividends",
    {
      title: "Dividends",
      description: "Dividend history.",
      inputSchema: z.object({
        ticker: z.string().describe("e.g. AAPL.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ ticker }) => {
      try {
        return text(await dividends(ticker));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "splits",
    {
      title: "Splits",
      description: "Split history.",
      inputSchema: z.object({
        ticker: z.string().describe("e.g. AAPL.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ ticker }) => {
      try {
        return text(await splits(ticker));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "news",
    {
      title: "Ticker news",
      description: "Latest news.",
      inputSchema: z.object({
        ticker: z.string().describe("e.g. AAPL."),
        limit: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ ticker, limit }) => {
      try {
        return text(await news(ticker, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "gainers",
    {
      title: "Top gainers",
      description: "Day's biggest gainers.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await gainers());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}