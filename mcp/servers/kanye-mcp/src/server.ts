import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { random } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "kanye-mcp", version: "1.0.0" })
  server.registerTool(
    "random",
    {
      title: "Random",
      description: "A random Kanye quote.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await random(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "quotes",
    {
      title: "Quotes",
      description: "The whole api.kanye.rest quote archive in order, with an offset and limit, rather than one random quote per call.",
      inputSchema: z.object( { offset: z.number().describe("First quote index.").optional(), limit: z.number().describe("How many quotes.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement quotes locally (paywall removed)
    try { return textError("Not yet implemented: quotes") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "search_quotes",
    {
      title: "Search quotes",
      description: "Search inside the Kanye quote archive for a word or phrase, returning the archive index of every match.",
      inputSchema: z.object( { query: z.string().describe("Word or phrase to find."), limit: z.number().describe("Max matches.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement quotes locally (paywall removed)
    try { return textError("Not yet implemented: quotes") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
