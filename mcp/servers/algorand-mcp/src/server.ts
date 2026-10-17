successfully downloaded text file (SHA: d2aefaadad926295d7a8d43696b213b2c505dda8)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { status, circulatingSupply } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "algorand-mcp", version: "1.0.0" })
  server.registerTool(
    "status",
    {
      title: "Status",
      description: "Current Algorand status.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await status(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "block_detail",
    {
      title: "Block detail",
      description: "One Algorand block by round: close time, transactions, previous block, seeds and reward addresses.",
      inputSchema: z.object( { round: z.number().describe("Block round. Defaults to the chain head.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: block_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_algorand_block_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "circulating_supply",
    {
      title: "Circulating supply",
      description: "Total Algos in circulation on Algorand, with the online money and online stake splits.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await circulatingSupply(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "asset_detail",
    {
      title: "Asset detail",
      description: "One Algorand asset by ID: name, unit, decimals, supply, manager, reserve and freeze address.",
      inputSchema: z.object( { assetId: z.number().describe("Asset ID, e.g. 31566704 for USDC.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: asset_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_algorand_asset_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
