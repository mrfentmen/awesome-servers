import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getServerTime,
  listSymbols,
  get24hStats,
  getOrderbook,
  getKlines,
  getFiatPrices,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "kucoin-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_server_time",
    {
      title: "Get server time",
      description: "KuCoin server timestamp for clock sync.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getServerTime());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_symbols",
    {
      title: "List trading symbols",
      description: "KuCoin trading pairs with base/quote currencies. Optional quote filter like USDT.",
      inputSchema: z.object({
        market: z.string().optional().describe("Quote currency filter, e.g. 'USDT'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ market }) => {
      try {
        return text(await listSymbols(market));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_24h_stats",
    {
      title: "Get 24h stats",
      description: "24h KuCoin stats for a symbol: last price, high, low, change rate, volume.",
      inputSchema: z.object({
        symbol: z.string().describe("Symbol like 'BTC-USDT'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbol }) => {
      try {
        return text(await get24hStats(symbol));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_orderbook",
    {
      title: "Get order book",
      description: "KuCoin order book top bids and asks for a symbol.",
      inputSchema: z.object({
        symbol: z.string().describe("Symbol like 'BTC-USDT'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbol }) => {
      try {
        return text(await getOrderbook(symbol));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_klines",
    {
      title: "Get klines",
      description: "KuCoin candlesticks for a symbol: time, open, close, high, low, volume.",
      inputSchema: z.object({
        symbol: z.string().describe("Symbol like 'BTC-USDT'"),
        type: z.string().default("1day").describe("Candle size: 1min, 1hour, 1day, 1week"),
        startAt: z.number().optional().describe("Start unix seconds"),
        endAt: z.number().optional().describe("End unix seconds"),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbol, type, startAt, endAt }) => {
      try {
        return text(await getKlines(symbol, type, startAt, endAt));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_fiat_prices",
    {
      title: "Get fiat prices",
      description: "Fiat prices for crypto currencies, e.g. BTC and ETH in USD.",
      inputSchema: z.object({
        currencies: z.string().default("BTC,ETH").describe("Comma-separated currencies"),
        base: z.string().default("USD").describe("Fiat base currency"),
      }),
      annotations: READ_ONLY,
    },
    async ({ currencies, base }) => {
      try {
        return text(await getFiatPrices(currencies, base));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
