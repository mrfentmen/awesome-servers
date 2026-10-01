import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ledgers } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "stellar-mcp", version: "1.0.0" })
  server.registerTool(
    "ledgers",
    {
      title: "Ledgers",
      description: "Recent Stellar ledgers.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ledgers(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "stellar_assets",
    {
      title: "Stellar assets",
      description: "Assets issued on the Stellar network with issuer, supply, holder count and toml link, optionally narrowed to one issuer, which the ledger list never shows.",
      inputSchema: z.object( { limit: z.number().describe("Max assets.").optional(), issuer: z.string().describe("Asset issuer account id.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: stellar_assets ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_stellar_stellar_assets", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "stellar_payments",
    {
      title: "Stellar payments",
      description: "Recent payments on the Stellar network with sender, receiver, asset, amount and transaction hash, newest first.",
      inputSchema: z.object( { limit: z.number().describe("Max payments.").optional(), asset: z.string().describe("Filter by asset code, e.g. USDC.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: stellar_payments ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_stellar_stellar_payments", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "horizon_root",
    {
      title: "Horizon root",
      description: "Stellar Horizon's own root record: which network passphrase, core and horizon versions, ledger history, fees, rate limits and ingest quorum.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: horizon_root ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_stellar_horizon_root", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "transaction_detail",
    {
      title: "Transaction detail",
      description: "One Stellar transaction in full: success code, ledger, fee, operation count, memo type and signatures, which the payments list only shows the hash of.",
      inputSchema: z.object( { hash: z.string().describe("64 character transaction hash."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: transaction_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_stellar_transaction_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
