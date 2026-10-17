import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { fees, blockByHeight } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "bitcoiner-mcp", version: "1.0.0" })
  server.registerTool(
    "fees",
    {
      title: "Fees",
      description: "Current fee estimates.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await fees(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "block_by_height",
    {
      title: "Block by height",
      description: "One Bitcoin block by height with its hash, timestamp, transaction count, difficulty and nonce.",
      inputSchema: z.object( { height: z.number().describe("Block height. Defaults to the chain tip.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await blockByHeight(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "mining_pools",
    {
      title: "Mining pools",
      description: "Which pools mined which blocks over a period, with each pool's share and the network hashrate.",
      inputSchema: z.object( { period: z.string().describe("Period, e.g. 1d, 1w, 1m, 1y or all.").optional(), limit: z.number().describe("Max pools.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement pools locally (paywall removed)
    try { return textError("Not yet implemented: pools") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "difficulty_adjustments",
    {
      title: "Difficulty adjustments",
      description: "Recent Bitcoin difficulty retargets with the new difficulty and the percentage change each one made.",
      inputSchema: z.object( { limit: z.number().describe("Max adjustments.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement adjustments locally (paywall removed)
    try { return textError("Not yet implemented: adjustments") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
