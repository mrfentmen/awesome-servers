import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { fact, many } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "meowfacts-mcp", version: "1.0.0" })
  server.registerTool(
    "fact",
    {
      title: "Fact",
      description: "One random cat fact.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await fact(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "many",
    {
      title: "Many",
      description: "Several cat facts.",
      inputSchema: z.object( { count: z.number().describe("How many facts.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await many(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "fact_by_number",
    {
      title: "Fact by number",
      description: "One specific numbered MeowFacts cat fact, so a cited fact still resolves to the same text on a later call.",
      inputSchema: z.object( { number: z.number().describe("Fact number, 1 to 9999.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: fact_by_number ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_meowfacts_fact_by_number", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
