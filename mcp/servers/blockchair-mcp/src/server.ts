import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { chain, stats } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "blockchair-mcp", version: "1.0.0" })
  server.registerTool(
    "stats",
    {
      title: "Stats",
      description: "Bitcoin network stats.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await stats(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "chain",
    {
      title: "Chain",
      description: "Stats for a chain.",
      inputSchema: z.object( { chain: z.string().describe("Chain like bitcoin.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await chain(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "chain_comparison",
    {
      title: "Compare several chains side by side",
      description: "Put up to 6 blockchains next to each other from Blockchair: block height, blocks and transactions in the last day, price, market cap, dominance, fee percentiles and mempool depth, then say which leads on market cap and which mempool is busiest.",
      inputSchema: z.object({
        chains: z.string().describe("Up to 6 chain names separated by commas, for example bitcoin, ethereum, dogecoin. Defaults to bitcoin and ethereum.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: chain_comparison ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_blockchair_chain_comparison", args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "mempool_pressure",
    {
      title: "Mempool and fee pressure",
      description: "Show how congested a chain's mempool is: pending transactions and outputs, throughput, fees locked in the mempool, the suggested fee per byte, last-day fee percentiles, plus hashrate and the next difficulty retarget.",
      inputSchema: z.object({
        chains: z.string().describe("Chain names separated by commas, for example bitcoin, litecoin. Defaults to bitcoin.").optional(),
        chain: z.string().describe("A single chain name, used only when chains is not given.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: mempool_pressure ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_blockchair_mempool_pressure", args)) } catch (e) { return textError(error(e)) }
    }
  )

  return server
}
