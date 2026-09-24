import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getBook,
  searchBooks,
  getBooksBatch,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "isbndb-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_book",
    {
      title: "Get book by ISBN",
      description: "ISBNdb book detail: title, authors, publisher, pages, cover.",
      inputSchema: z.object({
        isbn: z.string().describe("ISBN-10 or ISBN-13"),
      }),
      annotations: READ_ONLY,
    },
    async ({ isbn }) => {
      try {
        return text(await getBook(isbn));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_books",
    {
      title: "Search books",
      description: "Search ISBNdb by title, author or subject with pagination.",
      inputSchema: z.object({
        query: z.string().describe("Search text"),
        page: z.number().default(1).describe("Page number"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, page }) => {
      try {
        return text(await searchBooks(query, page));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_books_batch",
    {
      title: "Batch lookup",
      description: "Look up several ISBNdb books in one call.",
      inputSchema: z.object({
        isbns: z.string().describe("Comma-separated ISBNs"),
      }),
      annotations: READ_ONLY,
    },
    async ({ isbns }) => {
      try {
        return text(await getBooksBatch(isbns));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
