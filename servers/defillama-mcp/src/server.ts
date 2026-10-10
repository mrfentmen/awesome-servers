import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_chains, m0_protocol, m1_chainTvl, m1_protocolInfo, m1_topProtocols, topYields, hacks, stablecoins, dexVolume, feesOverview, stablecoinChains } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
export function createServer(): McpServer {
  const server = new McpServer({ name: 'defillama-mcp', version: '1.0.0' })
server.registerTool(
    "chains",
    {
      title: "Chains",
      description: "Total value locked per chain, biggest first.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_chains(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "protocol",
    {
      title: "Protocol",
      description: "TVL history for a protocol slug, e.g. aave.",
      inputSchema: z.object( { slug: z.string().describe("Protocol slug.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_protocol(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "top_protocols",
    {
      title: "Top protocols",
      description: "Get the top DeFi protocols by TVL.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_topProtocols(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "chain_tvl",
    {
      title: "Chain tvl",
      description: "Total value locked for every chain in one call.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_chainTvl(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "protocol_info",
    {
      title: "Protocol info",
      description: "Get details for a specific protocol.",
      inputSchema: z.object( { protocol: z.string().describe("Protocol slug.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_protocolInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "topYields",
    {
      title: "Top yields",
      description: "Highest-APY DeFi pools with project, chain, APY and TVL.",
      inputSchema: z.object( { limit: z.number().describe("How many pools, 1-25. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await topYields(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "hacks",
    {
      title: "Recent hacks",
      description: "Largest recent DeFi hacks with date, target, chain, amount and technique.",
      inputSchema: z.object( { limit: z.number().describe("How many hacks, 1-25. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hacks(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "stablecoins",
    {
      title: "Stablecoins",
      description: "Stablecoin circulating value by asset, with peg mechanism, price and 7-day change.",
      inputSchema: z.object( { limit: z.number().describe("How many assets, 1-30. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await stablecoins(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "dex_volume",
    {
      title: "DEX volume",
      description: "DeFi DEX trading volume: 24h, 7d and all-time totals plus the busiest protocols.",
      inputSchema: z.object( { limit: z.number().describe("How many protocols, 1-30. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await dexVolume(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "fees_overview",
    {
      title: "Fees overview",
      description: "DeFi protocol fees: 24h, 7d and all-time totals plus the protocols charging the most.",
      inputSchema: z.object( { limit: z.number().describe("How many protocols, 1-30. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await feesOverview(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "stablecoin_chains",
    {
      title: "Stablecoin supply by chain",
      description: "Where stablecoin supply actually sits by chain, in USD at current prices, with each chain's share and a running cumulative share, plus how concentrated the top five are. This is the clearest single view of where on-chain liquidity and users really are.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(60).default(15).describe("Chains to list, default 15"),
        min_share_pct: z.number().min(0).default(0).describe("Only list chains holding at least this share of total supply, 0 for no floor"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await stablecoinChains(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "stablecoin_history",
    {
      title: "Stablecoin supply history",
      description: "How stablecoin supply on one chain (or the whole market) has moved: 7, 30, 90 day and 1 year growth against the actual supply on those dates, the high and low of the window, minted versus still-circulating, and a sparkline of the recent trend. Supply is measured in USD, so a depeg appears as a fall in value.",
      inputSchema: z.object({
        chain: z.string().default("all").describe("DefiLlama chain slug, for example Ethereum, Solana or Arbitrum. Defaults to the global series."),
        days: z.number().int().min(7).max(1095).default(90).describe("Window for the high, low and sparkline, 7-1095 days, default 90"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: stablecoin_history ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_defillama_stablecoin_history", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "aggregator_volume",
    {
      title: "DEX aggregator volume",
      description: "Volume routed through DEX aggregators, with a real period-over-period comparison: DefiLlama publishes the previous 24h and previous 7d windows, so this shows 7d-over-7d alongside the daily change instead of only a single number. Includes each aggregator's share and the top-two concentration.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(40).default(12).describe("Aggregators to list, default 12"),
        min_share_pct: z.number().min(0).default(0).describe("Only list aggregators with at least this share of 24h volume, 0 for no floor"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: aggregator_volume ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_defillama_aggregator_volume", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
