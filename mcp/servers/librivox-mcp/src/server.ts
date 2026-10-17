import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "librivox-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search audiobooks.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "author_books",
    {
      title: "Books by author",
      description: "Every LibriVox recording by one author, with reader names, running time and page link.",
      inputSchema: z.object( { author_id: z.number().describe("LibriVox author id, e.g. 8 for Charles Dickens."), limit: z.number().describe("Max books.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement books locally (paywall removed)
    try { return textError("Not yet implemented: books") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "book_detail",
    {
      title: "Book detail",
      description: "One LibriVox recording in full: author, language, copyright year, description and its first sections with runtimes.",
      inputSchema: z.object( { book_id: z.number().describe("LibriVox book id, e.g. 47.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
