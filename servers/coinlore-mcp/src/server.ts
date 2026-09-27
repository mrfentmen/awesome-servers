import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { tickers, coin, globalStats, markets, movers, searchCoins, socialStats, rankRange, volumeLeaders } from './api.js'
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'coinlore-mcp', version: '1.0.0' })
  server.registerTool(
    'tickers',
    {
      title: "Tickers",
      description: 'Top coins by market cap, with price and 24h change.',
      inputSchema: z.object( { limit: z.number().describe('Max results.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tickers(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'coin',
    {
      title: "Coin",
      description: 'One coin by its CoinLore id, e.g. 90 for Bitcoin.',
      inputSchema: z.object( { id: z.number().describe('CoinLore id.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await coin(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'globalStats',
    {
      title: "Global Stats",
      description: 'Global crypto market stats: total cap, volume, Bitcoin share.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await globalStats(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'search_coins',
    {
      title: "Search coins",
      description: 'Find a coin by name or symbol among the top 100 by market cap, with its CoinLore id for the coin tool.',
      inputSchema: z.object( { query: z.string().describe('Coin name or symbol, e.g. "solana" or "ETH".'), limit: z.number().describe('Max results, 1-30.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchCoins(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'movers',
    {
      title: "Movers",
      description: 'Biggest 24-hour gainers and losers among the top 100 coins by market cap.',
      inputSchema: z.object( { limit: z.number().describe('How many gainers and how many losers to show, 1-20.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await movers(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'markets',
    {
      title: "Markets",
      description: 'Markets for a coin id across exchanges, e.g. 90 for Bitcoin.',
      inputSchema: z.object( { id: z.number().describe('CoinLore id.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await markets(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "social_stats",
    {
      title: "Social stats",
      description: "Reddit, Twitter and Telegram community sizes for a CoinLore coin id, e.g. 90 for Bitcoin.",
      inputSchema: z.object( { id: z.number().describe("CoinLore coin id, e.g. 90 for Bitcoin.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await socialStats(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "rank_range",
    {
      title: "Rank range",
      description: "Coins in a rank window beyond the top 100, e.g. ranks 101-150, including the CoinLore id for the coin tool.",
      inputSchema: z.object( { start: z.number().describe("Zero-based rank offset, e.g. 100 starts at rank 101."), limit: z.number().describe("How many coins, 1-100. Defaults to 25.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await rankRange(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "volume_leaders",
    {
      title: "Volume leaders",
      description: "Most-traded coins by 24h volume across the largest coins, with each coin's share of the sampled volume.",
      inputSchema: z.object( { limit: z.number().describe("How many coins, 1-25. Defaults to 10.").optional(), sample: z.number().describe("How many coins to rank, 25-200. Defaults to 100.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await volumeLeaders(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
