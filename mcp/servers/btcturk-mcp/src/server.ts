import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  BtcTurkError,
  cancelOrder,
  formatBalances,
  formatCandles,
  formatOrderbook,
  formatOrders,
  formatSymbols,
  formatTicker,
  formatTickerTable,
  formatTrades,
  getAllTickers,
  getBalances,
  getExchangeInfo,
  getOhlc,
  getOrderbook,
  getServerTime,
  getTicker,
  getTrades,
  listOpenOrders,
  placeOrder,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

const pair = z.string().min(3).describe("Trading pair, e.g. 'BTCTRY' or 'ETHTRY'")

export function createServer(): McpServer {
  const server = new McpServer({ name: "btcturk-mcp", version: "1.0.0" })

  server.tool("get_ticker", "Latest price, 24h high/low and volume for one BtcTurk pair.", { pair }, async ({ pair: p }) => {
    try {
      return text(formatTicker(await getTicker(p)))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "get_all_tickers",
    "Every BtcTurk pair with its last price and 24h range. No API key needed.",
    { limit: z.number().int().min(1).max(500).default(25).describe("How many rows to print") },
    async ({ limit }) => {
      try {
        const tickers = await getAllTickers()
        if (tickers.length === 0) return text("BtcTurk returned no tickers.")
        return text(formatTickerTable(tickers, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("get_exchange_info", "Trading rules and the list of tradable pairs.", {}, async () => {
    try {
      return text(formatSymbols(await getExchangeInfo()))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "get_pair_info",
    "Trading rules for a single pair: scales, minimum order value and status.",
    { pair },
    async ({ pair: p }) => {
      try {
        const info = await getExchangeInfo()
        const hit = (info.symbols ?? []).filter((s) => s.name.toUpperCase() === p.toUpperCase())
        if (hit.length === 0) return text(`Pair ${p.toUpperCase()} is not listed on BtcTurk.`)
        return text(
          hit
            .map(
              (s) =>
                `${s.name}\n  ${s.numerator}/${s.denominator}\n  numerator scale ${s.numeratorScale ?? "-"}  denominator scale ${s.denominatorScale ?? "-"}\n  minimum order value ${s.minimumOrderValue ?? "-"}  status ${s.status ?? "-"}`
            )
            .join("\n\n")
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_orderbook",
    "Bids and asks for a pair, best price first.",
    {
      pair,
      limit: z.number().int().min(1).max(1000).default(100).describe("Levels to request from the API"),
      depth: z.number().int().min(1).max(50).default(10).describe("Levels to print"),
    },
    async ({ pair: p, limit, depth }) => {
      try {
        return text(formatOrderbook(p, await getOrderbook(p, limit), depth))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_trades",
    "Most recent public trades for a pair.",
    {
      pair,
      last: z.number().int().min(1).max(200).default(50).describe("How many trades to return"),
    },
    async ({ pair: p, last }) => {
      try {
        return text(formatTrades(await getTrades(p, last)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_ohlc",
    "Open/high/low/close candles for a pair. Resolution is in minutes.",
    {
      pair,
      resolution: z
        .number()
        .int()
        .min(1)
        .default(60)
        .describe("Candle size in minutes: 1, 15, 60, 240, 1440"),
      from: z.number().int().optional().describe("Unix seconds, optional"),
      to: z.number().int().optional().describe("Unix seconds, optional"),
    },
    async ({ pair: p, resolution, from, to }) => {
      try {
        return text(formatCandles(p, await getOhlc(p, resolution, from, to)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("get_server_time", "BtcTurk server time. Useful for checking clock drift before signing requests.", {}, async () => {
    try {
      const t = await getServerTime()
      return text(JSON.stringify(t, null, 2))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("get_balances", "Account balances. Requires BTCTURK_PUBLIC_KEY and BTCTURK_SECRET_KEY.", {}, async () => {
    try {
      return text(formatBalances(await getBalances()))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "list_open_orders",
    "Open orders, optionally for one pair. Requires API credentials.",
    { pair: z.string().optional().describe("Optional pair filter, e.g. 'BTCTRY'") },
    async ({ pair: p }) => {
      try {
        return text(formatOrders(await listOpenOrders(p)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "place_order",
    "Place a buy or sell order. Requires API credentials and spends real money — market orders fill immediately.",
    {
      pair_symbol: pair,
      order_method: z.enum(["market", "limit", "stopMarket", "stopLimit"]).describe("Order method"),
      order_type: z.enum(["buy", "sell"]).describe("Side of the order"),
      quantity: z.number().positive().describe("Quantity of the numerator asset"),
      price: z.number().positive().optional().describe("Required for limit and stopLimit orders"),
      stop_price: z.number().positive().optional().describe("Required for stopMarket and stopLimit orders"),
      client_order_id: z.string().optional().describe("Optional client side identifier"),
    },
    async (args) => {
      try {
        const order = await placeOrder({
          pairSymbol: args.pair_symbol,
          orderMethod: args.order_method,
          orderType: args.order_type,
          quantity: args.quantity,
          price: args.price,
          stopPrice: args.stop_price,
          clientOrderId: args.client_order_id,
        })
        return text(`Order submitted.\n${JSON.stringify(order, null, 2)}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cancel_order",
    "Cancel one open order by id. Requires API credentials.",
    { order_id: z.string().min(1).describe("Order id, as returned by list_open_orders") },
    async ({ order_id }) => {
      try {
        const res = await cancelOrder(order_id)
        return text(`Cancel requested for ${order_id}.\n${JSON.stringify(res, null, 2)}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof BtcTurkError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
