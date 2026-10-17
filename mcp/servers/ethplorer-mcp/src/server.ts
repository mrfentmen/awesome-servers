import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { addressInfo, addressHistory, tokenHistory, tokenHolders, tokenInfo, topTokens, lastBlock, addressTransactions, txInfo, chainHoldings } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ethplorer-mcp", version: "1.0.0" })
  server.registerTool(
    "token_info",
    {
      title: "Token info",
      description: "Get ERC-20 token details by address.",
      inputSchema: z.object( { address: z.string().describe("Token contract address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tokenInfo(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "address_info",
    {
      title: "Address info",
      description: "Get token holdings for an address.",
      inputSchema: z.object( { address: z.string().describe("Wallet address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await addressInfo(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "token_history",
    {
      title: "Token history",
      description: "Transfer history for a token address, newest first.",
      inputSchema: z.object( { address: z.string().describe("Token address."), limit: z.number().describe("Max records.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tokenHistory(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "topTokens",
    {
      title: "Top tokens",
      description: "Top ERC-20 tokens by activity with holder and transaction counts.",
      inputSchema: z.object( { limit: z.number().describe("How many tokens, 1-50. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await topTokens(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "tokenHolders",
    {
      title: "Token holders",
      description: "Largest holders of a token with balances and share percent.",
      inputSchema: z.object( { address: z.string().describe("Token address."), limit: z.number().describe("How many holders, 1-50. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tokenHolders(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "addressHistory",
    {
      title: "Address history",
      description: "Token operations involving an address, newest first.",
      inputSchema: z.object( { address: z.string().describe("Wallet address."), limit: z.number().describe("Max records, 1-50. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await addressHistory(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "last_block",
    {
      title: "Last block",
      description: "Current Ethereum head block height, useful for timestamping the other lookups.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await lastBlock()) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "address_transactions",
    {
      title: "ETH transfers",
      description: "Latest plain ETH transfers for an address, with direction and USD value — token movements live in address_history.",
      inputSchema: z.object( { address: z.string().describe("Wallet address."), limit: z.number().describe("How many transfers, 1-50. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await addressTransactions(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "tx_info",
    {
      title: "Transaction info",
      description: "One Ethereum transaction by hash: status, sender, receiver, value, gas used and fee, plus token transfer and log counts.",
      inputSchema: z.object( { hash: z.string().describe("0x-prefixed transaction hash.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await txInfo(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "top_tokens_by",
    {
      title: "Top tokens by criterion",
      description: "Ranks tokens by trade volume, market capitalisation or operation count using getTop, and by default compares all three orderings against each other. The existing top_tokens uses getTopTokens, whose criterion is fixed at 30-day activity, so sorting by cap or by transaction count is not reachable from it. The cross-criterion comparison is the useful part: it separates a token that is large from one that is actually liquid.",
      inputSchema: z.object({
        criteria: z.enum(["trade", "cap", "count"]).default("trade").describe("Sort criterion: trade volume, market cap, or operation count. Default trade"),
        limit: z.number().int().min(1).max(50).default(15).describe("Tokens per list, default 15. Ethplorer caps this at 50."),
        compare: z.boolean().default(true).describe("Also fetch the other two criteria and report the overlap. Default true"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement by locally (paywall removed)
    try { return textError("Not yet implemented: by") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "new_tokens",
    {
      title: "Newest indexed tokens",
      description: "Lists the most recently added tradable tokens on Ethereum Mainnet from getTokensNew, with price, holder count and the date the indexer added each contract. Reports how many have no price, zero holders or a tiny circulating supply, and is explicit that this is a stream of unvetted anonymous deployments: a name and a symbol are chosen by the deployer and prove nothing, and being indexed as tradable is not an audit.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(20).describe("Tokens to list, default 20. The endpoint itself returns up to 100."),
        with_price_only: z.boolean().default(false).describe("Only tokens Ethplorer has a price for, which is a crude liquidity filter. Default false"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement tokens locally (paywall removed)
    try { return textError("Not yet implemented: tokens") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "chain_holdings",
    {
      title: "Holdings across chains",
      description: "Reads one address on every chain Ethplorer serves: Ethereum, BNB Smart Chain, Linea, Blast, and the Sepolia, Holesky and Hoodi testnets. Flags any ticker that appears on more than one chain, because a token address is meaningless across chains and the same ticker is usually a different, unrelated contract each time. Also notes that the gas-token fields are named ETH across the API even on BNB, Linea and Blast.",
      inputSchema: z.object({
        address: z.string().describe("0x-prefixed 40-hex-character address to look up on every chain."),
        chains: z.string().optional().describe("Comma-separated chain ids to restrict to: 1, 56, 59144, 81457, 11155111, 17000, 560048. Omit for all of them."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await chainHoldings(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
