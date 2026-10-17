successfully downloaded text file (SHA: 1ec5aa7a897d394e4f8060d1b0f7a769a8249997)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { random } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "advice-mcp", version: "1.0.0" })
  server.registerTool(
    "random",
    {
      title: "Random",
      description: "A random piece of advice.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await random(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "advice_search",
    {
      title: "Advice search",
      description: "Advice Slip advice on a topic, with the slip ids and dates so they can be fetched again.",
      inputSchema: z.object( { topic: z.string().describe("Topic word, e.g. love, life, work.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: advice_search ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_advice_advice_search", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "advice_by_id",
    {
      title: "Advice by id",
      description: "One specific Advice Slip by its numeric id.",
      inputSchema: z.object( { slip_id: z.number().describe("Advice slip id, e.g. 101.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: advice_by_id ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_advice_advice_by_id", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
