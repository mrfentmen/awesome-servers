import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_price, m0_trending, markets, coin, chart, global, categories, exchanges, search, history, exchangeTickers } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
export function createServer(): McpServer {
  const server = new McpServer({ name: 'coingecko-mcp', version: '1.0.0' })
server.registerTool(
    "price",
    {
      title: "Price",
      description: "Current price for one coin id, e.g. bitcoin, in a chosen currency.",
      inputSchema: z.object( { coin: z.string().describe("Coin id like bitcoin."), currency: z.string().describe("Currency like usd.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_price(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "trending",
    {
      title: "Trending",
      description: "Coins trending in CoinGecko search over the last 24 hours.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_trending(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "markets",
    {
      title: "Top markets",
      description: "Top coins by market cap with rank and price.",
      inputSchema: z.object( { currency: z.string().describe("Vs currency like usd. Defaults to usd.").optional(), limit: z.number().describe("How many coins, 1-50. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await markets(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "coin",
    {
      title: "Coin detail",
      description: "One coin with rank, 24h change, algorithm and categories.",
      inputSchema: z.object( { coin: z.string().describe("Coin id like bitcoin.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await coin(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "chart",
    {
      title: "Price chart",
      description: "Sampled daily closes for a coin over N days with the period percent change.",
      inputSchema: z.object( { coin: z.string().describe("Coin id like bitcoin.").optional(), currency: z.string().describe("Vs currency like usd.").optional(), days: z.number().describe("Days of history, 1-365. Defaults to 7.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await chart(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "global",
    {
      title: "Global stats",
      description: "Total coins and markets plus top-5 dominance shares.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await global(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "categories",
    {
      title: "Categories",
      description: "CoinGecko sector categories ranked by market cap, with 24h change and volume.",
      inputSchema: z.object( { limit: z.number().describe("How many categories, 1-40. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await categories(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "exchanges",
    {
      title: "Exchanges",
      description: "CoinGecko exchange rankings by trust score, with 24h BTC volume and country.",
      inputSchema: z.object( { limit: z.number().describe("How many exchanges, 1-50. Defaults to 10.").optional(), page: z.number().describe("Page of results, defaults to 1.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await exchanges(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Find coin, exchange and category ids on CoinGecko by name or symbol, e.g. solana, aave.",
      inputSchema: z.object( { query: z.string().describe("Name or symbol to search for."), limit: z.number().describe("Max coin rows, 1-30. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "history",
    {
      title: "Historical snapshot",
      description: "Coin price, market cap and volume on a past date, e.g. 20-09-2026.",
      inputSchema: z.object( { date: z.string().describe("Date as dd-mm-yyyy, e.g. 20-09-2026."), coin: z.string().describe("Coin id like bitcoin. Defaults to bitcoin.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await history(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "coin_tickers",
    {
      title: "Cross-market tickers for a coin",
      description: "Every market CoinGecko lists for one coin, ranked by real 24 hour USD volume rather than by the product list, with the price dispersion across those markets and the data-quality flags that say whether a price can be trusted: stale prints, anomalies, markets paying a trading incentive, and missing trust scores.",
      inputSchema: z.object({
        coin: z.string().describe("Coin id, for example bitcoin or ethereum."),
        limit: z.number().int().min(1).max(40).default(12).describe("Markets to list, default 12"),
        min_volume: z.number().min(0).default(0).describe("Only rank markets whose 24h volume in USD reaches this, default 0 for no floor"),
        only_clean: z.string().optional().describe('Set to "true" to drop stale, anomalous and incentive-paying markets before ranking.'),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement tickers locally (paywall removed)
    try { return textError("Not yet implemented: tickers") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "exchange_tickers",
    {
      title: "What an exchange is quoting",
      description: "Every market one exchange lists, ranked by 24 hour USD volume, which shows where that exchange's liquidity actually sits rather than just how many pairs it has. Optionally narrowed to a single quote currency.",
      inputSchema: z.object({
        exchange: z.string().describe("Exchange id, for example binance, coinbase or kraken. Use exchanges to list them."),
        limit: z.number().int().min(1).max(40).default(12).describe("Markets to list, default 12"),
        min_volume: z.number().min(0).default(0).describe("Only count markets whose 24h volume in USD reaches this, default 0 for no floor"),
        quote: z.string().optional().describe("Only markets quoted in this currency, for example USDT or BTC."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await exchangeTickers(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "coin_ohlc",
    {
      title: "OHLC candles",
      description: "Real open, high, low and close candles for a coin over 1, 7, 14, 30, 90, 180 or 365 days, with the candle cadence named, the period change and range, and a plain reading of where the latest candle closed inside its own range.",
      inputSchema: z.object({
        coin: z.string().describe("Coin id, for example bitcoin or ethereum."),
        currency: z.string().default("usd").describe("Quote currency, default usd"),
        days: z.number().int().min(1).max(365).default(7).describe("Window in days: 1, 7, 14, 30, 90, 180 or 365"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement ohlc locally (paywall removed)
    try { return textError("Not yet implemented: ohlc") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
