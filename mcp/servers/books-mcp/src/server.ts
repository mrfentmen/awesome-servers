import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { bookInfo, searchBooks } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "books-mcp", version: "1.0.0" })
  server.registerTool(
    "search_books",
    {
      title: "Search books",
      description: "Search for books by title or author.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchBooks(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "book_info",
    {
      title: "Book info",
      description: "Get details for a specific book volume.",
      inputSchema: z.object( { volumeId: z.string().describe("Google Books volume ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await bookInfo(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "isbn_lookup",
    {
      title: "Isbn lookup",
      description: "Resolve an ISBN-10 or ISBN-13 against Open Library: title, publish date, publishers, page count, language, subjects and first sentence.",
      inputSchema: z.object({ isbn: z.string().describe("ISBN-10 or ISBN-13, digits only or with hyphens.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement lookup locally (paywall removed)
    try { return textError("Not yet implemented: lookup") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "author_works",
    {
      title: "Author works",
      description: "List an author's works and descriptions from Open Library, matched by author name.",
      inputSchema: z.object({ author: z.string().describe("Author name, for example Ursula K. Le Guin."), limit: z.number().describe("Max works, 1-50, default 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement works locally (paywall removed)
    try { return textError("Not yet implemented: works") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
