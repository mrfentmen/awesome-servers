import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { EsploraError, feeEstimates, getAddress, getBlock, getTx, mempoolFees, tipHeight, recentBlocks, recentMempool } from "./local-api.js"

import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "esplora-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "tip_height",
    {
      title: "Chain tip",
      description: "Current Bitcoin block height. Set ESPLORA_URL for other instances/networks.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(`Bitcoin tip height: ${await tipHeight()}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "fee_estimates",
    {
      title: "Fee estimates",
      description: "Fee estimates in sat/vB plus mempool stats.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(`${await feeEstimates()}\n\n${await mempoolFees()}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_block",
    {
      title: "Get block",
      description: "Block by height or hash: time, tx count, size.",
      inputSchema: z.object({
        height_or_hash: z.string().describe("Block height like '968083' or 64-hex hash"),
      }),
      annotations: READ_ONLY,
    },
    async ({ height_or_hash }) => {
      try {
        return text(await getBlock(height_or_hash))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_tx",
    {
      title: "Get transaction",
      description: "Transaction: confirmation, fee, outputs total.",
      inputSchema: z.object({
        txid: z.string().describe("64-hex transaction id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ txid }) => {
      try {
        return text(await getTx(txid))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_address",
    {
      title: "Get address",
      description: "Address balance, tx count, pending mempool txs.",
      inputSchema: z.object({
        address: z.string().describe("Bitcoin address"),
      }),
      annotations: READ_ONLY,
    },
    async ({ address }) => {
      try {
        return text(await getAddress(address))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "recent_blocks",
    {
      title: "Recent blocks",
      description: "The most recently mined Bitcoin blocks from a given height: hash, timestamp, transaction count, size and merkle root.",
      inputSchema: z.object({
        height: z.string().describe("Starting block height, e.g. 900000. Use \"tip\" for the chain tip.").default("tip"),
        limit: z.number().int().min(1).max(25).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ height, limit }) => {
      try {
        return text(await recentBlocks(height, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "recent_mempool",
    {
      title: "Recent mempool",
      description: "Transactions most recently accepted into the Bitcoin mempool, with value, fee and fee rate in sat/vB.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(30).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await recentMempool(limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "difficulty_adjustment",
    {
      title: "Difficulty adjustment",
      description: "Current Bitcoin mining difficulty adjustment progress and projected retarget from mempool.space.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: difficulty_adjustment ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_esplora_difficulty_adjustment", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof EsploraError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
