import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { addressInfo, blockInfo, feeEstimates, latestHeight, recentBlocks } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "blockchain-mcp", version: "1.0.0" })
  server.registerTool(
    "latest_height",
    {
      title: "Latest height",
      description: "Get the latest Bitcoin block height.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await latestHeight(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "block_info",
    {
      title: "Block info",
      description: "Get info about a Bitcoin block by height.",
      inputSchema: z.object( { height: z.number().describe("Block height.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await blockInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "fee_estimates",
    {
      title: "Fee estimates",
      description: "Get recommended Bitcoin transaction fee rates.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await feeEstimates(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "address_info",
    {
      title: "Address info",
      description: "Get info about a Bitcoin address.",
      inputSchema: z.object( { address: z.string().describe("Bitcoin address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await addressInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "address_transactions",
    {
      title: "Address transactions",
      description: "Recent transactions touching a Bitcoin address.",
      inputSchema: z.object( { address: z.string().describe("Bitcoin address."), limit: z.number().describe("How many, 1-15.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: address_transactions ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_blockchain_address_transactions", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "mempool_status",
    {
      title: "Mempool status",
      description: "Current Bitcoin mempool congestion: pending count, backlog size and fee bands.",
      inputSchema: z.object( { bands: z.number().describe("Fee bands to show, 1-10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: mempool_status ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_blockchain_mempool_status", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "recent_blocks",
    {
      title: "Recent blocks",
      description: "The latest Bitcoin blocks with time, transaction count, size, reward and difficulty.",
      inputSchema: z.object( { limit: z.number().describe("How many blocks, 1-15.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await recentBlocks(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
