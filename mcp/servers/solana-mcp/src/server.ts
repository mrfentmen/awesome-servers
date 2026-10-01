import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { slot } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "solana-mcp", version: "1.0.0" })
  server.registerTool(
    "slot",
    {
      title: "Slot",
      description: "Current Solana slot.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await slot(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "solana_supply",
    {
      title: "Solana supply",
      description: "Total, circulating and non-circulating SOL from the Solana JSON-RPC, which a slot lookup says nothing about.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: solana_supply ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_solana_solana_supply", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "solana_epoch",
    {
      title: "Solana epoch",
      description: "The current Solana epoch, how far through it is, the absolute slot and block height, and the epoch's transaction count.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: solana_epoch ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_solana_solana_epoch", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "solana_versions",
    {
      title: "Solana versions",
      description: "The Solana JSON-RPC client's software version, feature set and health status.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: solana_versions ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_solana_solana_versions", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
