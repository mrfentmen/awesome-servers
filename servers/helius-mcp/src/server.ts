import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getBalances,
  getTransactions,
  getNfts,
  getTokenMetadata,
  parseTransactions,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "helius-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_balances",
    {
      title: "Get wallet balances",
      description: "Solana wallet balances via Helius: SOL plus every token holding with amounts and decimals.",
      inputSchema: z.object({
        address: z.string().describe("Wallet address"),
      }),
      annotations: READ_ONLY,
    },
    async ({ address }) => {
      try {
        return text(await getBalances(address));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_transactions",
    {
      title: "Get transactions",
      description: "Recent Solana signatures for an address with slot and block time.",
      inputSchema: z.object({
        address: z.string().describe("Wallet address"),
        limit: z.number().default(10).describe("How many signatures"),
      }),
      annotations: READ_ONLY,
    },
    async ({ address, limit }) => {
      try {
        return text(await getTransactions(address, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_nfts",
    {
      title: "Get wallet NFTs",
      description: "NFTs held by a Solana wallet: collections, names, images.",
      inputSchema: z.object({
        address: z.string().describe("Wallet address"),
        page: z.number().default(1).describe("Page number"),
      }),
      annotations: READ_ONLY,
    },
    async ({ address, page }) => {
      try {
        return text(await getNfts(address, page));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_token_metadata",
    {
      title: "Get token metadata",
      description: "Fungible token metadata for Solana mints: decimals, supply, name, symbol.",
      inputSchema: z.object({
        mints: z.string().describe("Comma-separated mint addresses"),
      }),
      annotations: READ_ONLY,
    },
    async ({ mints }) => {
      try {
        return text(await getTokenMetadata(mints));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "parse_transactions",
    {
      title: "Parse transactions",
      description: "Human-readable Helius parse of Solana transactions: type, source, transfers, swaps.",
      inputSchema: z.object({
        transactions: z.string().describe("Comma-separated transaction signatures"),
      }),
      annotations: READ_ONLY,
    },
    async ({ transactions }) => {
      try {
        return text(await parseTransactions(transactions));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
