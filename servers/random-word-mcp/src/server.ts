import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { word } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "random-word-mcp", version: "1.0.0" })
  server.registerTool(
    "word",
    {
      title: "Word",
      description: "One or more random words.",
      inputSchema: z.object( { count: z.number().describe("Number of words.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await word(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "word_details",
    {
      title: "Word details",
      description: "Look a word up in the English Wiktionary and return its definition, etymology and usage section as plain text.",
      inputSchema: z.object( { word: z.string().describe("Word to look up, e.g. 'ephemeral'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: word_details ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_random_word_word_details", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
