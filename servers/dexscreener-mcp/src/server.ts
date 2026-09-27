import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { latestBoosts, multiTokens, pairDetails, search, tokenOrders, tokenProfiles, topBoosts, trending } from "./api.js"
import { tokens } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "dexscreener-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search token pairs.",
      inputSchema: z.object( { query: z.string().describe("Token symbol or name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "tokens",
    {
      title: "Tokens",
      description: "Top pairs for a token.",
      inputSchema: z.object( { address: z.string().describe("Token address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tokens(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "top_boosts",
    {
      title: "Top boosts",
      description: "Most boosted tokens.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await topBoosts(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "latest_boosts",
    {
      title: "Latest boosts",
      description: "Recently boosted tokens.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await latestBoosts(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "token_orders",
    {
      title: "Token orders",
      description: "Paid orders (ads) for a token.",
      inputSchema: z.object( { chain: z.string().describe("Chain like solana."), address: z.string().describe("Token address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tokenOrders(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "multi_tokens",
    {
      title: "Multi tokens",
      description: "Prices for up to 30 tokens at once.",
      inputSchema: z.object( { chain: z.string().describe("Chain like solana."), addresses: z.string().describe("Comma-separated addresses.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await multiTokens(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "trending",
    {
      title: "Trending",
      description: "Trending token metas.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await trending()) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "token_profiles",
    {
      title: "Token profiles",
      description: "Latest token profiles.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tokenProfiles()) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "pair_details",
    {
      title: "Pair details",
      description: "One pair by chain and address.",
      inputSchema: z.object( { chain: z.string().describe("Chain like solana."), pair: z.string().describe("Pair address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pairDetails(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
