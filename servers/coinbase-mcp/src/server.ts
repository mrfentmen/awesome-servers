import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { exchange } from "./api.js"
import { buy } from "./api.js"
import { currencies } from "./api.js"
import { sell } from "./api.js"
import { spot } from "./api.js"
import { time } from "./api.js"

import { exchangeStats } from "./api.js"
import { candles } from "./api.js"
import { exchangeTicker } from "./api.js"
import { orderBook } from "./api.js"
import { tradingProducts } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "coinbase-mcp", version: "1.0.0" })
  server.registerTool(
    "spot",
    {
      title: "Spot",
      description: "Latest spot price for one pair, e.g. BTC-USD.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC-USD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await spot(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "exchange",
    {
      title: "Exchange",
      description: "Crypto-to-fiat exchange rates for one base currency.",
      inputSchema: z.object( { currency: z.string().describe("Base currency like USD.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await exchange(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "buy",
    {
      title: "Buy price",
      description: "Coinbase buy price for a pair, returns base, currency and amount.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC-USD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await buy(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "sell",
    {
      title: "Sell price",
      description: "Coinbase sell price for a pair, returns base, currency and amount.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC-USD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await sell(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "currencies",
    {
      title: "Currencies",
      description: "How many currencies Coinbase supports with a fiat count and a 15-code sample. Full list omitted for size.",
      inputSchema: z.object( { }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await currencies()) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "time",
    {
      title: "Server time",
      description: "Coinbase server time as ISO string and epoch, useful for timestamping quotes.",
      inputSchema: z.object( { }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await time()) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "exchange_stats",
    {
      title: "Exchange stats",
      description: "Coinbase Exchange 24h open, high, low, last and volume for a product, with the day's range.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC-USD.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await exchangeStats(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "candles",
    {
      title: "Candles",
      description: "Coinbase Exchange OHLCV candles for a product at 1m to 1d granularity, with the period change.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC-USD.").optional(), granularity: z.number().describe("Seconds per candle: 60, 300, 900, 3600, 21600 or 86400. Defaults to 3600.").optional(), limit: z.number().describe("How many recent candles, 1-50. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await candles(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "exchange_ticker",
    {
      title: "Exchange ticker",
      description: "Live Coinbase Exchange ticker: price, bid/ask, spread, 24h volume and last trade id.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC-USD.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await exchangeTicker(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "order_book",
    {
      title: "Order book",
      description: "Coinbase Exchange level-2 book: top bids and asks with sizes, order counts and the spread.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC-USD.").optional(), limit: z.number().describe("Levels per side, 1-20. Defaults to 5.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await orderBook(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "trading_products",
    {
      title: "Trading products",
      description: "Coinbase Exchange products for a quote currency, e.g. every USD or USDT market, with online status.",
      inputSchema: z.object( { quote: z.string().describe("Quote currency like USD or USDT. Defaults to USD.").optional(), limit: z.number().describe("How many products to list, 1-50. Defaults to 20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tradingProducts(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
