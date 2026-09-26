import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getBalance,
  getTransactions,
  getTokenTransfers,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "etherscan-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_balance",
    {
      title: "ETH balance",
      description: "Native balance for an address.",
      inputSchema: z.object({
        address: z.string().describe("Address, e.g. 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ address, chain_id }) => {
      try {
        return text(await getBalance(address, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_transactions",
    {
      title: "Transactions",
      description: "Recent normal transactions for an address.",
      inputSchema: z.object({
        address: z.string().describe("Address, e.g. 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ address, chain_id }) => {
      try {
        return text(await getTransactions(address, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_token_transfers",
    {
      title: "Token transfers",
      description: "Recent ERC-20 transfers to or from an address.",
      inputSchema: z.object({
        address: z.string().describe("Address, e.g. 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ address, chain_id }) => {
      try {
        return text(await getTokenTransfers(address, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}