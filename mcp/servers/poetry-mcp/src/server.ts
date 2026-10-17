import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { byAuthor, randomPoem, searchTitles } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "poetry-mcp", version: "1.0.0" })
  server.registerTool(
    "search_titles",
    {
      title: "Search titles",
      description: "Search poems by title.",
      inputSchema: z.object( { title: z.string().describe("Poem title."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchTitles(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "by_author",
    {
      title: "By author",
      description: "List poems by an author.",
      inputSchema: z.object( { author: z.string().describe("Author name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await byAuthor(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "random_poem",
    {
      title: "Random poem",
      description: "Get a random poem.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await randomPoem(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "author_poems",
    {
      title: "Author poems",
      description: "The full text of an author's poems in PoetryDB, not just their titles, with line counts.",
      inputSchema: z.object( { author: z.string().describe("Author name, e.g. \"Emily Dickinson\"."), limit: z.number().int().min(1).max(8).default(3).describe("Max poems.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement poems locally (paywall removed)
    try { return textError("Not yet implemented: poems") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "title_index",
    {
      title: "Title index",
      description: "Browse PoetryDB's alphabetical index of every poem title it holds, a window at a time.",
      inputSchema: z.object( { offset: z.number().int().min(0).max(5000).default(0).describe("Index offset."), limit: z.number().int().min(1).max(100).default(25).describe("Max titles.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement index locally (paywall removed)
    try { return textError("Not yet implemented: index") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
