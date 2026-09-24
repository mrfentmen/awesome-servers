import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ArweaveError, networkInfo, storagePrice, txStatus, walletBalance } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "arweave-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "network_info",
    {
      title: "Network info",
      description: "Arweave network: height, peers, queue. Set ARWEAVE_URL for other gateways.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await networkInfo())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "tx_status",
    {
      title: "Transaction status",
      description: "Check if an Arweave transaction is confirmed and in which block.",
      inputSchema: z.object({
        id: z.string().describe("Transaction id (43 chars)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(await txStatus(id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "wallet_balance",
    {
      title: "Wallet balance",
      description: "AR balance of a wallet address.",
      inputSchema: z.object({
        address: z.string().describe("Wallet address (43 chars)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ address }) => {
      try {
        return text(await walletBalance(address))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "storage_price",
    {
      title: "Storage price",
      description: "What storing N bytes costs in AR right now.",
      inputSchema: z.object({
        bytes: z.number().positive().describe("Bytes to store, e.g. 1048576 for 1 MB"),
      }),
      annotations: READ_ONLY,
    },
    async ({ bytes }) => {
      try {
        return text(await storagePrice(bytes))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ArweaveError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
