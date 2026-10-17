import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { coin } from "./api.js"
import { coins, marketSentiment, gainersLosers, globalMarket } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "cryptorank-mcp", version: "1.0.0" })
  server.registerTool(
    "coins",
    {
      title: "Coins",
      description: "Ranked coins with market cap and 24h change.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await coins(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "coin",
    {
      title: "Coin",
      description: "One coin by its CryptoRank key, e.g. bitcoin.",
      inputSchema: z.object( { key: z.string().describe("Coin key like bitcoin.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await coin(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "market_sentiment",
    {
      title: "Fear & Greed index",
      description: "The Crypto Fear & Greed index with its 0-100 value, the band it falls in and what that band has historically meant. Flags it when CryptoRank's own classification disagrees with the documented thresholds, and can append 30 days of daily readings to show which way sentiment is travelling.",
      inputSchema: z.object({
        record: z.string().optional().describe('Set to "true" to also fetch 30 days of daily index history.'),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await marketSentiment(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "gainers_losers",
    {
      title: "Top gainers and losers",
      description: "The biggest risers or fallers over 24 hours, 7 days or 30 days, from the CryptoRank v3 API with a configurable market-cap floor. Reports the spread across the set so a single outlier does not read as the whole market moving.",
      inputSchema: z.object({
        group: z.string().default("gainers").describe("gainers or losers, default gainers"),
        period: z.string().default("24h").describe("24h, 7d or 30d, default 24h"),
        limit: z.number().int().min(1).max(50).default(10).describe("Coins to list, default 10"),
        min_market_cap: z.number().min(0).optional().describe("Only coins at or above this market cap in USD. CryptoRank applies its own 500,000 USD floor by default."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await gainersLosers(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "global_market",
    {
      title: "Global market snapshot",
      description: "One market-wide view: total market cap and its 24h change, total spot volume with turnover against cap, how much of the cap is BTC and ETH versus everything else, and how many coins, trading pairs and exchanges are actually live. Can append the full dominance breakdown.",
      inputSchema: z.object({
        record: z.string().optional().describe('Set to "true" to also fetch the per-asset dominance breakdown.'),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await globalMarket(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
