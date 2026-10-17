import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, getBook, searchBooks, getBooksBatch } from "./api.js"
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
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "search_books",
    {
      title: "Search books",
      description: "Search ISBNdb by title, author or subject with pagination.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. the great gatsby"),
        page: z.number().default(1).describe("Page number, 1 or higher"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, page }) => {
      try {
        return text(await searchBooks(query, page));
      } catch (e) {
        return textError(String(e));
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
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "loc_catalog",
    {
      title: "LOC catalog",
      description: "Catalog records from the Library of Congress, which publishes its bibliographic data without a key: title, contributors, date, subjects, LCCN, language and access restrictions.",
      inputSchema: z.object({ query: z.string().describe("Title, author or subject to search for"), limit: z.number().int().min(1).max(20).default(5).describe("How many records to print (default 5, max 20).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement catalog locally (paywall removed)
      try { return textError("Not yet implemented: catalog") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "book_background",
    {
      title: "Book background",
      description: "The encyclopaedia summary of a book or author from Wikipedia, with revision and edit date, for the context an ISBN record never carries. No ISBNdb key needed.",
      inputSchema: z.object({ title: z.string().describe("Book title or author name, e.g. The Dispossessed") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement background locally (paywall removed)
      try { return textError("Not yet implemented: background") } catch (e) { return textError(String(e)) }
    }
  )

  return server
}
