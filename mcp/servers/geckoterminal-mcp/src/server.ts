import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { token, trending, networks, pool, newPools, search, tokenPools, tokenPrices, dexes } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "geckoterminal-mcp", version: "1.0.0" })
  server.registerTool(
    "token",
    {
      title: "Token",
      description: "Token details by address on one network: price, supply, pool.",
      inputSchema: z.object( { network: z.string().describe("Network id like eth.").optional(), address: z.string().describe("Token address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await token(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "trending",
    {
      title: "Trending",
      description: "Pools with the most activity on GeckoTerminal right now.",
      inputSchema: z.object( { network: z.string().describe("Network id like eth.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await trending(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "networks",
    {
      title: "Networks",
      description: "Blockchains GeckoTerminal tracks, with a 20-network sample. Full list omitted for size.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await networks()) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "pool",
    {
      title: "Pool detail",
      description: "One pool by id with base/quote USD prices and reserves. Get ids from search.",
      inputSchema: z.object( { pool: z.string().describe("Pool id like eth_0xa43fe16908251ee70ef74718545e4fe6c5ccec9f."), network: z.string().describe("Network like eth. Defaults to eth.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pool(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "newPools",
    {
      title: "New pools",
      description: "Recently listed pools on a network with prices and volumes.",
      inputSchema: z.object( { network: z.string().describe("Network like eth. Defaults to eth.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await newPools(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Pool search",
      description: "Search pools by text across networks, returns ids for the pool tool.",
      inputSchema: z.object( { query: z.string().describe("Search text like pepe."), network: z.string().describe("Optional network filter like eth.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "token_pools",
    {
      title: "Token pools",
      description: "Every pool a token trades in on one network, biggest liquidity first, with price, reserves and 24h volume.",
      inputSchema: z.object( { network: z.string().describe("Network id like eth, bsc or solana. Defaults to eth.").optional(), address: z.string().describe("Token contract address."), limit: z.number().describe("How many pools, 1-20. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tokenPools(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "token_prices",
    {
      title: "Token prices",
      description: "Batch spot prices for up to 30 token addresses on one network in a single call.",
      inputSchema: z.object( { addresses: z.string().describe("Comma-separated token addresses (max 30)."), network: z.string().describe("Network id like eth or bsc. Defaults to eth.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tokenPrices(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "dexes",
    {
      title: "DEX list",
      description: "Decentralised exchanges tracked on a network, with the number of pools each has.",
      inputSchema: z.object( { network: z.string().describe("Network id like eth or bsc. Defaults to eth.").optional(), limit: z.number().describe("How many DEXes, 1-50. Defaults to 25.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await dexes(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "pool_ohlc",
    {
      title: "Pool OHLCV",
      description: "Open, high, low, close and volume candles for a pool on minute, hour or day granularity, with the change over the window.",
      inputSchema: z.object({
        network: z.string().describe("Network id, e.g. eth").optional(),
        pool: z.string().describe("Pool address, e.g. 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"),
        timeframe: z.enum(["minute", "hour", "day"]).default("hour").describe("Candle granularity."),
        limit: z.number().int().min(1).max(200).default(12).describe("How many of the most recent candles to print."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement ohlc locally (paywall removed)
      try { return textError("Not yet implemented: ohlc") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "pool_trades",
    {
      title: "Pool trades",
      description: "Most recent trades in a pool with side, size in USD, token amounts and transaction hash, plus the buy/sell split.",
      inputSchema: z.object({
        network: z.string().describe("Network id, e.g. eth").optional(),
        pool: z.string().describe("Pool address, e.g. 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"),
        limit: z.number().int().min(1).max(30).default(10).describe("How many trades to print."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement trades locally (paywall removed)
      try { return textError("Not yet implemented: trades") } catch (e) { return textError(String(e)) }
    }
  )

  return server
}
