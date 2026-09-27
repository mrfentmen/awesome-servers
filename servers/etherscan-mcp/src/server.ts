import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getBalance,
  getTransactions,
  getTokenTransfers,
  txStatus,
  contractAbi,
  contractSource,
  tokenBalance,
  gasOracle,
  ethPrice,
  blockNumber,
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

  server.registerTool(
    "tx_status",
    {
      title: "TX status",
      description: "Receipt status by hash.",
      inputSchema: z.object({
        txhash: z.string().describe("Transaction hash."),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ txhash, chain_id }) => {
      try {
        return text(await txStatus(txhash, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "contract_abi",
    {
      title: "Contract ABI",
      description: "Verified ABI.",
      inputSchema: z.object({
        address: z.string().describe("Contract address."),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ address, chain_id }) => {
      try {
        return text(await contractAbi(address, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "contract_source",
    {
      title: "Contract source",
      description: "Verified source info.",
      inputSchema: z.object({
        address: z.string().describe("Contract address."),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ address, chain_id }) => {
      try {
        return text(await contractSource(address, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "token_balance",
    {
      title: "Token balance",
      description: "ERC-20 balance.",
      inputSchema: z.object({
        contract: z.string().describe("Token contract."),
        address: z.string().describe("0x address."),
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ contract, address, chain_id }) => {
      try {
        return text(await tokenBalance(contract, address, chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "gas_oracle",
    {
      title: "Gas prices",
      description: "Current gas tiers.",
      inputSchema: z.object({
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ chain_id }) => {
      try {
        return text(await gasOracle(chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "eth_price",
    {
      title: "ETH price",
      description: "ETH/USD price.",
      inputSchema: z.object({
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ chain_id }) => {
      try {
        return text(await ethPrice(chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "block_number",
    {
      title: "Block number",
      description: "Latest block.",
      inputSchema: z.object({
        chain_id: z.string().describe("Chain ID (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ chain_id }) => {
      try {
        return text(await blockNumber(chain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}