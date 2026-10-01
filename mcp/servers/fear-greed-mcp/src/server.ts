import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { current, history, bandDistribution } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "fear-greed-mcp", version: "1.0.0" })
  server.registerTool(
    "current",
    {
      title: "Current",
      description: "The current fear and greed index.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await current(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "history",
    {
      title: "History",
      description: "Recent fear and greed index values.",
      inputSchema: z.object( { days: z.number().describe("How many days back.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await history(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "market_extremes",
    {
      title: "Market extremes",
      description: "The highest and lowest fear and greed readings on record, with their dates, plus the mean and full band counts.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: market_extremes ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_fear_greed_market_extremes", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "greed_trend",
    {
      title: "Greed trend",
      description: "Fear and greed moving averages over 7, 30, 90 and 365 days, each compared with the period before it.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: greed_trend ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_fear_greed_greed_trend", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "band_distribution",
    {
      title: "Band distribution",
      description: "How many days of a recent window fell into each fear and greed band.",
      inputSchema: z.object( { days: z.number().describe("Window size in days, 1-365.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await bandDistribution(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
