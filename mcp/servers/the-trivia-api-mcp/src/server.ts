import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { questions } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "the-trivia-api-mcp", version: "1.0.0" })
  server.registerTool(
    "questions",
    {
      title: "Questions",
      description: "Random trivia questions.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await questions(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "categories",
    {
      title: "Categories",
      description: "List the trivia genres and tags The Trivia API can return.",
      inputSchema: z.object( { limit: z.number().describe("Max genres.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: categories ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_the_trivia_api_categories", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
