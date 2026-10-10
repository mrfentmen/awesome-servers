import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { addressBalance, blockInfo, txInfo, recentTransactions } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "blockcypher-mcp", version: "1.0.0" })
  server.registerTool(
    "address_balance",
    {
      title: "Address balance",
      description: "Get address balance for a coin.",
      inputSchema: z.object( { coin: z.string().describe("Coin symbol (btc, eth, ltc, doge)."), address: z.string().describe("Address to query.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await addressBalance(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "block_info",
    {
      title: "Block info",
      description: "Get block details.",
      inputSchema: z.object( { coin: z.string().describe("Coin symbol."), height: z.string().describe("Block height or hash.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await blockInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "tx_info",
    {
      title: "Tx info",
      description: "Get transaction details.",
      inputSchema: z.object( { coin: z.string().describe("Coin symbol."), txid: z.string().describe("Transaction hash.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await txInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "chain_status",
    {
      title: "Chain status",
      description: "Height, latest block, peers, mempool size and current fee or gas estimates for one chain, in the units that chain uses.",
      inputSchema: z.object( { coin: z.string().describe("Coin symbol (btc, eth, ltc, doge).") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: chain_status ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_blockcypher_chain_status", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "address_activity",
    {
      title: "Address activity",
      description: "An address with its confirmed totals plus its most recent transactions, converted with the right decimals for the coin.",
      inputSchema: z.object( { coin: z.string().describe("Coin symbol (btc, eth, ltc, doge)."), address: z.string().describe("Address to inspect."), limit: z.number().describe("How many recent transactions to list, 1-25. Defaults to 5.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: address_activity ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_blockcypher_address_activity", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "recent_transactions",
    {
      title: "Recent transactions",
      description: "The newest transactions BlockCypher sees on a chain, with how many are still unconfirmed and the total value and fees moved.",
      inputSchema: z.object( { coin: z.string().describe("Coin symbol (btc, eth, ltc, doge)."), limit: z.number().describe("How many to list, 1-50. Defaults to 10.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await recentTransactions(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
