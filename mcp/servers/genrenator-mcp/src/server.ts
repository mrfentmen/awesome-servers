import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { genre, genres } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "genrenator-mcp", version: "1.0.0" })
  server.registerTool(
    "genre",
    {
      title: "Genre",
      description: "Get a random genre.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await genre(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "genres",
    {
      title: "Genres",
      description: "Get several random genres.",
      inputSchema: z.object( { count: z.number().describe("How many genres.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await genres(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "genre_story",
    {
      title: "Genre story",
      description: "Ask Genrenator for one-line stories built from freshly generated genre combinations, to see the generated genres used in context.",
      inputSchema: z.object( { count: z.number().int().min(1).max(10).default(3).describe("How many stories.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement story locally (paywall removed)
    try { return textError("Not yet implemented: story") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "catalog_size",
    {
      title: "Catalog size",
      description: "How many distinct genre combinations the Genrenator catalog currently holds.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement size locally (paywall removed)
    try { return textError("Not yet implemented: size") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
