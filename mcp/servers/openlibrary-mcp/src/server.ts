import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search_books, work, author, isbn_lookup, subject, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "openlibrary-mcp", version: "1.0.0" })

  server.tool(
    "search_books",
    "Search books by title, author or subject",
    {
      query: z.string().min(2).describe("Search text, e.g. dune"),
      limit: z.number().int().min(1).max(20).default(10).describe("Maximum books")
    },
    async (a) => {
      try {
        return text(await search_books(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "work",
    "Work record: description, subjects and first publication",
    {
      workId: z.string().min(3).describe("Work key such as OL893414W or /works/OL893414W")
    },
    async (a) => {
      try {
        return text(await work(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "author",
    "Author record: name, dates and biography",
    {
      authorId: z.string().min(3).describe("Author key such as OL25712A")
    },
    async (a) => {
      try {
        return text(await author(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "isbn_lookup",
    "Find a book edition by ISBN",
    {
      isbn: z.string().min(10).describe("ISBN-10 or ISBN-13")
    },
    async (a) => {
      try {
        return text(await isbn_lookup(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "subject",
    "Top works for a subject",
    {
      subject: z.string().min(2).describe("Subject such as science_fiction"),
      limit: z.number().int().min(1).max(20).default(10).describe("Maximum works")
    },
    async (a) => {
      try {
        return text(await subject(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
