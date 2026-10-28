import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { GutenbergError, bookDetail, byLanguage, popular, searchBooks } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof GutenbergError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "gutenberg-mcp", version: "1.0.0" })
  const limit = z.number().int().min(1).max(32).default(8).describe("Books to return (1-32)")

  server.tool(
    "search_books",
    "Search 79,000+ public domain books by title or author.",
    { query: z.string().min(2).describe("Search term, e.g. 'moby dick' or 'austen'"), limit },
    async ({ query, limit: n }) => {
      try {
        return text(await searchBooks(query, n))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "book_detail",
    "One book with summary and every download format.",
    { id: z.number().int().positive().describe("Gutendex book id, e.g. 1342") },
    async ({ id }) => {
      try {
        return text(await bookDetail(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "books_by_language",
    "Most downloaded books in one language.",
    { language: z.string().min(2).max(3).describe("Language code, e.g. en, fr, de, es"), limit },
    async ({ language, limit: n }) => {
      try {
        return text(await byLanguage(language, n))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("popular_books", "The most downloaded books on Project Gutenberg.", { limit }, async ({ limit: n }) => {
    try {
      return text(await popular(n))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  return server
}
