import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, getBalances, getTransactions, getNfts, getTokenMetadata, parseTransactions } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
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
        page: z.number().default(1).describe("Page number, 1 or higher"),
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

  server.registerTool(
    "wallet_holdings",
    {
      title: "Wallet holdings",
      description: "The native Solana RPC view of a wallet: SOL balance, account owner and data size, and every SPL token with a non-zero balance, biggest first. No Helius key needed.",
      inputSchema: z.object({ address: z.string().describe("Solana wallet address"), limit: z.number().int().min(1).max(40).default(10).describe("How many tokens to list (default 10, max 40).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: wallet_holdings ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_helius_wallet_holdings", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "token_market",
    {
      title: "Token market",
      description: "Where an SPL token actually trades: live price, pool liquidity, 24h volume and buy/sell counts per pair, from the deepest pool down. No Helius key needed.",
      inputSchema: z.object({ token: z.string().describe("SPL mint address to look up.").optional(), query: z.string().describe("Symbol or name to search for, used when no mint is given.").optional(), limit: z.number().int().min(1).max(20).default(5).describe("How many pairs to print (default 5, max 20).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: token_market ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_helius_token_market", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
