import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_price, m0_trending, markets, coin, chart, global, categories, exchanges, search, history } from './api.js'
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
    try { return text(await m0_price(args)) } catch (e) { return textError(error(e)) }
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
    try { return text(await m0_trending(args)) } catch (e) { return textError(error(e)) }
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
    try { return text(await markets(args)) } catch (e) { return textError(error(e)) }
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
    try { return text(await coin(args)) } catch (e) { return textError(error(e)) }
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
    try { return text(await chart(args)) } catch (e) { return textError(error(e)) }
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
    try { return text(await global(args)) } catch (e) { return textError(error(e)) }
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
    try { return text(await categories(args)) } catch (e) { return textError(error(e)) }
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
    try { return text(await exchanges(args)) } catch (e) { return textError(error(e)) }
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
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
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
    try { return text(await history(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
