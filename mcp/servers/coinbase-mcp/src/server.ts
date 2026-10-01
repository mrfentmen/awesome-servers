import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { exchange, buy, currencies, sell, spot, time, exchangeStats, candles, exchangeTicker, orderBook, tradingProducts, marketOverview } from "./api.js"
import { premiumTool } from "./gateway.js"
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

  server.registerTool(
    "product_info",
    {
      title: "Product trading rules",
      description: "The trading rules for one Coinbase Exchange product: lot sizes for base and quote, minimum order value, max slippage, and the per-order restrictions (margin, post only, limit only, cancel only, trading disabled). Also converts the smallest legal lot into a cash amount at the live price, which is usually the real reason an order gets rejected.",
      inputSchema: z.object({
        pair: z.string().describe("Product id, for example BTC-USD."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: product_info ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_coinbase_product_info", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "recent_trades",
    {
      title: "Recent public trades",
      description: "Recent public trades for a Coinbase Exchange pair, summarised into a tape: price range, total size, notional, buy versus sell aggression, and a per-trade list. Can also report how much of the notional traded in blocks at or above a size threshold, which is how you tell a real move from a few small prints.",
      inputSchema: z.object({
        pair: z.string().describe("Product id, for example BTC-USD."),
        limit: z.number().int().min(1).max(50).default(12).describe("Trades to list, default 12"),
        min_size: z.number().min(0).default(0).describe("Only report trades of at least this size, default 0 for no threshold"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: recent_trades ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_coinbase_recent_trades", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "market_overview",
    {
      title: "Market overview",
      description: "Ranks every online Coinbase Exchange product in one quote currency by 24 hour volume, with each pair's share of combined volume, last price and 24 hour range. Walks the stats endpoint once per product, so it reflects what is actually liquid rather than what merely appears in the product list.",
      inputSchema: z.object({
        quote: z.string().default("USD").describe("Quote currency to rank, for example USD, EUR or BTC."),
        min_volume: z.number().min(0).default(0).describe("Only count products whose 24h volume reaches this, default 0 for no floor"),
        limit: z.number().int().min(1).max(40).default(15).describe("Products to list, default 15"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await marketOverview(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
